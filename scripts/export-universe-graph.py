#!/usr/bin/env python3
"""Exporta grafo leve (sem code) para visualização 3D Galaxy — todos os projetos."""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "scripts", "projects-data.json")
CPE_FILE = os.path.join(ROOT, "scripts", "cpe-project.json")
VEYON_FILE = os.path.join(ROOT, "scripts", "veyon-project.json")
DROPBOX_FILE = os.path.join(ROOT, "scripts", "dropbox-project.json")
RESTAURANT_FILE = os.path.join(ROOT, "scripts", "restaurant-project.json")
EXTRA_FILE = os.path.join(ROOT, "scripts", "extra-projects.json")
DANGERZONE_FILE = os.path.join(ROOT, "scripts", "dangerzone-project.json")
SMARTHOME_FILE = os.path.join(ROOT, "scripts", "smarthome-project.json")
SMARTFERRARI_FILE = os.path.join(ROOT, "scripts", "smartferrari-project.json")
OUT_DIR = os.path.join(ROOT, "universe", "public", "graphs")

CATEGORIES = {
    "core": ("Backend", "#3b82f6"),
    "network": ("Rede / Scan", "#22d3ee"),
    "ad": ("Active Directory", "#a78bfa"),
    "loop": ("Loop SNMP", "#f97316"),
    "autotest": ("AutoTest", "#06b6d4"),
    "oracle": ("Oracle / DB", "#c084fc"),
    "platform": ("Plataforma Canon", "#8b5cf6"),
    "inventory": ("Inventário UNESP", "#10b981"),
    "auth": ("Segurança", "#ef4444"),
    "frontend": ("Frontend", "#eab308"),
    "scripts": ("Scripts", "#64748b"),
    "tests": ("Testes", "#94a3b8"),
    "other": ("Outros", "#64748b"),
}


def load_all_projects():
    """Mesma composição de scripts/build-projects.py."""
    with open(CPE_FILE, encoding="utf-8") as f:
        cpe = json.load(f)
    with open(DATA, encoding="utf-8") as f:
        others = [p for p in json.load(f) if p.get("slug") not in ("customize-veyon", "javascript-dropbox")]
    with open(VEYON_FILE, encoding="utf-8") as f:
        veyon = json.load(f)
    with open(DROPBOX_FILE, encoding="utf-8") as f:
        dropbox = json.load(f)
    with open(RESTAURANT_FILE, encoding="utf-8") as f:
        restaurant = json.load(f)
    extras = []
    if os.path.isfile(EXTRA_FILE):
        with open(EXTRA_FILE, encoding="utf-8") as f:
            extras = json.load(f)
    dangerzone = []
    if os.path.isfile(DANGERZONE_FILE):
        with open(DANGERZONE_FILE, encoding="utf-8") as f:
            dangerzone = [json.load(f)]
    smarthome = []
    if os.path.isfile(SMARTHOME_FILE):
        with open(SMARTHOME_FILE, encoding="utf-8") as f:
            smarthome = [json.load(f)]
    smartferrari = []
    if os.path.isfile(SMARTFERRARI_FILE):
        with open(SMARTFERRARI_FILE, encoding="utf-8") as f:
            smartferrari = [json.load(f)]
    return [cpe] + others[:1] + [dropbox, restaurant] + others[1:] + [veyon] + extras + dangerzone + smarthome + smartferrari


def category_for_professional_scanner(node):
    nid = node.get("id", "")
    file = (node.get("file") or "").lower()
    if nid.startswith("ps-grp-core") or nid.startswith("ps-server") or nid in (
        "ps-root", "ps-static", "ps-ws", "ps-enrich", "ps-history", "ps-vm-vlan",
        "ps-detect-vm", "ps-parse-target", "ps-ping", "ps-os-ttl", "ps-dns",
        "ps-mac", "ps-vendor", "ps-tcp-scan", "ps-concurrent", "ps-detect-dmz",
        "ps-device-type", "ps-export-xlsx", "ps-api-results",
    ) or file == "server.js" or file.endswith("hostenrichment.js") or file.endswith("hosthistory.js") or file.endswith("vmvlanstrategy.js"):
        return "core"
    if "loop" in nid or file.endswith("loopdetection.js"):
        return "loop"
    if "ad" in nid or file.endswith("aduseraudit.js"):
        return "ad"
    if "autotest" in nid or "auto" in file:
        return "autotest"
    if "oracle" in nid or "oracle" in file or file.endswith(".java"):
        return "oracle"
    if "platform" in nid or "platform" in file or nid.startswith(("ps-network", "ps-asset", "ps-nac", "ps-tls", "ps-deep", "ps-passive", "ps-scheduled", "ps-webhook", "ps-canon-agent", "ps-ala")):
        return "platform"
    if "inventory" in nid or file.startswith("inventory") or "inventory/" in file or file.endswith("switchmaclookup.js"):
        return "inventory"
    if "auth" in nid or "rbac" in nid or file.endswith("canonauth.js") or file.endswith("canonrbac.js"):
        return "auth"
    if "public" in file or nid.startswith(("ps-client", "ps-map", "ps-app", "ps-index", "ps-style", "ps-port")):
        return "frontend"
    if "script" in nid or file.endswith(".ps1"):
        return "scripts"
    if "test" in nid or file.startswith("test"):
        return "tests"
    if nid.startswith("ps-grp-"):
        return "core"
    return "other"


def category_for(node, slug=""):
    if slug == "professional-scanner" or (node.get("id") or "").startswith("ps-"):
        return category_for_professional_scanner(node)

    nid = (node.get("id") or "").lower()
    file = (node.get("file") or "").lower()
    title = (node.get("title") or "").lower()
    layer = node.get("layer", "")

    if layer == "root":
        return "core"
    if file.endswith((".html", ".htm", ".css", ".scss", ".jsx", ".tsx", ".vue")) or any(k in nid for k in ("frontend", "front-end", "ui", "view", "template", "static")):
        return "frontend"
    if file.endswith((".sql", ".sqlite")) or any(k in nid for k in ("database", "db", "oracle", "mysql", "postgres")):
        return "oracle"
    if any(k in nid or k in title for k in ("auth", "security", "login", "jwt", "rbac", "permission")):
        return "auth"
    if file.endswith(".ps1") or "script" in nid:
        return "scripts"
    if "test" in nid or file.startswith("test") or file.endswith(("_test.py", "_test.js", ".spec.js", ".spec.ts")):
        return "tests"
    if any(k in nid for k in ("network", "scan", "socket", "websocket", "api", "route", "endpoint")):
        return "network"
    if file.endswith((".py", ".js", ".ts", ".java", ".cpp", ".c", ".php", ".go", ".rs", ".cs")):
        return "core"
    if layer == "module":
        return "core"
    return "other"


def layer_size(layer):
    return {"root": 2.2, "module": 1.35, "file": 0.85, "function": 0.62}.get(layer, 0.6)


def export_project(project):
    slug = project.get("slug")
    if not slug:
        return None
    nodes_in = project.get("nodes", [])
    if not nodes_in:
        return None

    nodes = []
    links = []
    used_categories = set()

    for n in nodes_in:
        cat = category_for(n, slug)
        used_categories.add(cat)
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

    return {
        "slug": slug,
        "name": project.get("name", slug),
        "repoUrl": project.get("repoUrl", ""),
        "color": project.get("color", "#06b6d4"),
        "demoUrl": project.get("demoUrl", ""),
        "nodeCount": len(nodes),
        "categories": {k: {"label": v[0], "color": v[1]} for k, v in CATEGORIES.items() if k in used_categories or k == "other"},
        "nodes": nodes,
        "links": links,
    }


def main():
    projects = load_all_projects()
    os.makedirs(OUT_DIR, exist_ok=True)

    exported = 0
    for project in projects:
        if project.get("comingSoon"):
            continue
        out = export_project(project)
        if not out:
            print(f"  SKIP {project.get('slug', '?')}: sem nós", file=sys.stderr)
            continue
        path = os.path.join(OUT_DIR, f"{out['slug']}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)
        print(f"  {out['slug']}: {out['nodeCount']} nós, {len(out['links'])} links")
        exported += 1

    print(f"Total exportado: {exported} projetos -> {OUT_DIR}")


if __name__ == "__main__":
    main()
