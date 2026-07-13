#!/usr/bin/env python3
"""Simula layout estilo Veyon e reporta sobreposições."""
import json
import math
import os
import random
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, "js", "data", "projects.js")

SIBLING_PAD = 1.42
PARENT_PAD = 1.22
SEPARATION_ITERS = 56
SCENE_W, SCENE_H = 1280, 720


def node_half(layer, dense):
    sizes = (
        {"root": 43, "module": 29, "file": 25, "function": 22}
        if dense
        else {"root": 50, "module": 36, "file": 29, "function": 25}
    )
    return sizes.get(layer, sizes["function"])


def child_spread(count, is_root):
    if count <= 1:
        return 0
    if is_root:
        return math.pi * 2
    return min(math.pi * 1.25, 0.55 + count * 0.48)


def orbit_from_children(half, child_rs, is_root):
    n = len(child_rs)
    if n == 0:
        return 0
    if n == 1:
        return (half + child_rs[0]) * PARENT_PAD
    spread = child_spread(n, is_root)
    step = spread / n if is_root else spread / (n - 1)
    orbit = 0
    for i in range(n):
        a = child_rs[i]
        if is_root:
            b = child_rs[(i + 1) % n]
        else:
            if i == n - 1:
                break
            b = child_rs[i + 1]
        need = ((a + b) * SIBLING_PAD) / (2 * math.sin(max(step, 0.12) / 2))
        orbit = max(orbit, need)
    orbit = max(orbit, (half + max(child_rs)) * PARENT_PAD)
    return orbit


def build_tree(nodes):
    m = {n["id"]: {**n, "children": []} for n in nodes}
    root = next(n for n in nodes if not n.get("parent"))
    for n in nodes:
        p = n.get("parent")
        if p and p in m:
            m[p]["children"].append(m[n["id"]])
    return m[root["id"]]


def measure(node, dense, is_root, min_root_orbit):
    half = node_half(node.get("layer") or "function", dense)
    children = node.get("children") or []
    if not children:
        node["_subR"] = half
        node["_orbit"] = 0
        return half
    for ch in children:
        measure(ch, dense, False, 0)
    child_rs = [ch["_subR"] for ch in children]
    orbit = orbit_from_children(half, child_rs, is_root)
    if is_root and min_root_orbit:
        orbit = max(orbit, min_root_orbit)
    if len(children) >= 5:
        orbit *= 1.08
    node["_orbit"] = orbit
    node["_subR"] = orbit + max(child_rs)
    return node["_subR"]


def layout(node, angle, depth, positions, cx, cy):
    positions[node["id"]] = {"x": cx, "y": cy, "node": node, "depth": depth}
    children = node.get("children") or []
    if not children:
        return
    orbit_r = node.get("_orbit") or 0
    n = len(children)
    is_root = depth == 0
    if n == 1:
        a = -math.pi / 2 if is_root else angle
        layout(children[0], a, depth + 1, positions, cx + math.cos(a) * orbit_r, cy + math.sin(a) * orbit_r)
        return
    spread = child_spread(n, is_root)
    step = spread / n if is_root else spread / (n - 1)
    start = -math.pi / 2 if is_root else angle - spread / 2
    for i, child in enumerate(children):
        a = start + step * i
        layout(child, a, depth + 1, positions, cx + math.cos(a) * orbit_r, cy + math.sin(a) * orbit_r)


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


def overlaps(positions, dense):
    items = list(positions.values())
    out = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            a, b = items[i], items[j]
            ra = node_half(a["node"].get("layer") or "function", dense)
            rb = node_half(b["node"].get("layer") or "function", dense)
            need = (ra + rb) * SIBLING_PAD
            dist = math.hypot(a["x"] - b["x"], a["y"] - b["y"])
            if dist < need - 0.05:
                out.append((a["node"]["title"][:24], b["node"]["title"][:24], round(dist, 1), round(need, 1)))
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
        min_root = min(SCENE_W, SCENE_H) * (0.30 if len(nodes) >= 40 else 0.34)
        measure(tree, dense, True, min_root)
        positions = {}
        layout(tree, -math.pi / 2, 0, positions, 0, 0)
        resolve(positions, dense)
        overs = overlaps(positions, dense)
        total += len(overs)
        print(f"{p['slug']}: {len(nodes)} nodes, overlaps={len(overs)}")
        for row in overs[:5]:
            print(" ", row)
    print(f"TOTAL overlaps: {total}")


if __name__ == "__main__":
    main()
