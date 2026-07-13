#!/usr/bin/env python3
"""Simula o novo layout sem sobreposição e reporta colisões."""
import json
import math
import os
import random
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, "js", "data", "projects.js")

SIBLING_PAD = 1.28
PARENT_PAD = 1.18
SEPARATION_ITERS = 48


def node_half(layer, dense):
    sizes = (
        {"root": 43, "module": 29, "file": 25, "function": 22}
        if dense
        else {"root": 50, "module": 36, "file": 29, "function": 25}
    )
    return sizes.get(layer, sizes["function"])


def build_tree(nodes):
    m = {n["id"]: {**n, "children": []} for n in nodes}
    root = next(n for n in nodes if not n.get("parent"))
    for n in nodes:
        p = n.get("parent")
        if p and p in m:
            m[p]["children"].append(m[n["id"]])
    return m[root["id"]]


def measure(node, dense):
    half = node_half(node.get("layer") or "function", dense)
    children = node.get("children") or []
    if not children:
        node["_subR"] = half
        return half
    for ch in children:
        measure(ch, dense)
    child_rs = [ch["_subR"] for ch in children]
    n = len(children)
    orbit = 0
    if n == 1:
        orbit = (half + child_rs[0]) * PARENT_PAD
    else:
        step = (2 * math.pi) / n
        for i in range(n):
            a = child_rs[i]
            b = child_rs[(i + 1) % n]
            need = ((a + b) * SIBLING_PAD) / (2 * math.sin(step / 2))
            orbit = max(orbit, need)
        orbit = max(orbit, (half + max(child_rs)) * PARENT_PAD)
    node["_orbit"] = orbit
    node["_subR"] = orbit + max(child_rs)
    return node["_subR"]


def layout(node, angle, depth, positions, cx, cy, dense):
    positions[node["id"]] = {"x": cx, "y": cy, "node": node, "depth": depth}
    children = node.get("children") or []
    if not children:
        return
    orbit_r = node.get("_orbit") or 0
    if len(children) == 1:
        a = angle
        layout(
            children[0],
            a,
            depth + 1,
            positions,
            cx + math.cos(a) * orbit_r,
            cy + math.sin(a) * orbit_r,
            dense,
        )
        return
    step = (2 * math.pi) / len(children)
    start = -math.pi / 2 if depth == 0 else angle - math.pi + step / 2
    for i, child in enumerate(children):
        a = start + step * i
        layout(
            child,
            a,
            depth + 1,
            positions,
            cx + math.cos(a) * orbit_r,
            cy + math.sin(a) * orbit_r,
            dense,
        )


def resolve(positions, dense):
    items = list(positions.values())
    for _ in range(SEPARATION_ITERS):
        moved = False
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                a, b = items[i], items[j]
                ra = node_half(a["node"].get("layer") or "function", dense)
                rb = node_half(b["node"].get("layer") or "function", dense)
                min_dist = (ra + rb) * SIBLING_PAD
                dx = b["x"] - a["x"]
                dy = b["y"] - a["y"]
                dist = math.hypot(dx, dy)
                if dist < 0.01:
                    dx = (random.random() - 0.5) or 0.01
                    dy = (random.random() - 0.5) or 0.01
                    dist = math.hypot(dx, dy)
                if dist >= min_dist:
                    continue
                push = (min_dist - dist) / 2
                ux, uy = dx / dist, dy / dist
                a_root = a["node"].get("layer") == "root"
                b_root = b["node"].get("layer") == "root"
                if not a_root:
                    a["x"] -= ux * push
                    a["y"] -= uy * push
                    moved = True
                if not b_root:
                    b["x"] += ux * (push * 2 if a_root else push)
                    b["y"] += uy * (push * 2 if a_root else push)
                    moved = True
                elif a_root:
                    a["x"] -= ux * push * 2
                    a["y"] -= uy * push * 2
                    moved = True
        if not moved:
            break


def overlaps(positions, dense, pad=1.0):
    items = list(positions.values())
    out = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            a, b = items[i], items[j]
            ra = node_half(a["node"].get("layer") or "function", dense)
            rb = node_half(b["node"].get("layer") or "function", dense)
            need = (ra + rb) * SIBLING_PAD * pad
            dist = math.hypot(a["x"] - b["x"], a["y"] - b["y"])
            if dist < need - 0.05:
                out.append((a["node"]["title"][:28], b["node"]["title"][:28], round(dist, 1), round(need, 1)))
    return out


def main():
    text = open(JS, encoding="utf-8").read()
    projects = json.loads(re.search(r"const PROJECTS = (\[.*\]);", text, re.S).group(1))
    total = 0
    for p in projects:
        nodes = p.get("nodes") or []
        if not nodes:
            continue
        tree = build_tree(nodes)
        dense = len(nodes) > 14
        measure(tree, dense)
        positions = {}
        layout(tree, -math.pi / 2, 0, positions, 0, 0, dense)
        resolve(positions, dense)
        overs = overlaps(positions, dense)
        total += len(overs)
        print(f"{p['slug']}: {len(nodes)} nodes, overlaps={len(overs)}")
        for a, b, d, need in overs[:6]:
            print(f"  - {a} x {b}: dist={d} need={need}")
    print(f"TOTAL overlaps: {total}")


if __name__ == "__main__":
    main()
