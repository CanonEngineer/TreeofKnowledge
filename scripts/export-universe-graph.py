#!/usr/bin/env python3
"""Exporta grafo leve (sem code) para visualização 3D Galaxy."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "scripts", "projects-data.json")
OUT_DIR = os.path.join(ROOT, "universe", "public", "graphs")

CATEGORIES = {
    "core": ("Backend", "#3b82f6"),
    "network": ("Rede / Scan", "#22d3ee"),
    "ad": ("Active Directory", "#a78bfa"),
    "loop": ("Loop SNMP", "#f97316"),
    "autotest": ("AutoTest", "#06b6d4"),
    "oracle": ("Oracle / DB", "#c084fc"),
    "platform": ("Plataforma Canon", "#8b5cf6"),
    "auth": ("Segurança", "#ef4444"),
    "frontend": ("Frontend", "#eab308"),
    "scripts": ("Scripts", "#64748b"),
    "tests": ("Testes", "#94a3b8"),
    "other": ("Outros", "#64748b"),
}


def category_for(node):
    nid = node.get("id", "")
    file = (node.get("file") or "").lower()
    if nid.startswith("ps-grp-core") or nid.startswith("ps-server") or nid in (
        "ps-root", "ps-static", "ps-ws", "ps-enrich", "ps-history", "ps-vm-vlan",
        "ps-detect-vm", "ps-parse-target", "ps-ping", "ps-os-ttl", "ps-dns",
        "ps-mac", "ps-vendor", "ps-tcp-scan", "ps-concurrent", "ps-detect-dmz",
        "ps-device-type", "ps-export-xlsx", "ps-api-results",
    ) or file == "server.js" or file.endswith("hostenrichment.js") or file.endswith("hosthistory.js") or file.endswith("vmvlanstrategy.js"):
        return "core" if nid != "ps-root" else "core"
    if "loop" in nid or file.endswith("loopdetection.js"):
        return "loop"
    if "ad" in nid or file.endswith("aduseraudit.js"):
        return "ad"
    if "autotest" in nid or "auto" in file:
        return "autotest"
    if "oracle" in nid or "oracle" in file or file.endswith(".java"):
        return "oracle"
    if "platform" in nid or "platform" in file or nid.startswith("ps-network") or nid.startswith("ps-asset") or nid.startswith("ps-nac") or nid.startswith("ps-tls") or nid.startswith("ps-deep") or nid.startswith("ps-passive") or nid.startswith("ps-scheduled") or nid.startswith("ps-webhook") or nid.startswith("ps-canon-agent") or nid.startswith("ps-ala"):
        return "platform"
    if "auth" in nid or "rbac" in nid or file.endswith("canonauth.js") or file.endswith("canonrbac.js"):
        return "auth"
    if "public" in file or nid.startswith("ps-client") or nid.startswith("ps-map") or nid.startswith("ps-app") or nid.startswith("ps-index") or nid.startswith("ps-style") or nid.startswith("ps-port"):
        return "frontend"
    if "script" in nid or file.endswith(".ps1"):
        return "scripts"
    if "test" in nid or file.startswith("test"):
        return "tests"
    if nid.startswith("ps-grp-"):
        return "core"
    return "other"


def layer_size(layer):
    return {"root": 1.4, "module": 1.0, "file": 0.72, "function": 0.58}.get(layer, 0.6)


def main():
    with open(DATA, encoding="utf-8") as f:
        projects = json.load(f)

    os.makedirs(OUT_DIR, exist_ok=True)

    for project in projects:
        slug = project.get("slug")
        if not slug:
            continue
        nodes_in = project.get("nodes", [])
        if not nodes_in:
            continue

        nodes = []
        links = []
        for n in nodes_in:
            cat = category_for(n)
            nodes.append({
                "id": n["id"],
                "label": n.get("title") or n["id"],
                "parent": n.get("parent"),
                "layer": n.get("layer", "file"),
                "category": cat,
                "categoryLabel": CATEGORIES[cat][0],
                "color": CATEGORIES[cat][1],
                "size": layer_size(n.get("layer", "file")),
                "file": n.get("file", ""),
                "description": n.get("description", ""),
            })
            if n.get("parent"):
                links.append({"source": n["parent"], "target": n["id"], "type": "dependency"})

        out = {
            "slug": slug,
            "name": project.get("name", slug),
            "repoUrl": project.get("repoUrl", ""),
            "color": project.get("color", "#06b6d4"),
            "demoUrl": project.get("demoUrl", ""),
            "nodeCount": len(nodes),
            "categories": {k: {"label": v[0], "color": v[1]} for k, v in CATEGORIES.items()},
            "nodes": nodes,
            "links": links,
        }

        path = os.path.join(OUT_DIR, f"{slug}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)
        print(f"  {slug}: {len(nodes)} nós, {len(links)} links -> {path}")


if __name__ == "__main__":
    main()
