#!/usr/bin/env python3
"""Gera scripts/extra-projects.json a partir dos clones no Desktop."""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

DESKTOP = Path.home() / "Desktop"
OUT = Path(__file__).resolve().parent / "extra-projects.json"

SKIP_DIRS = {
    ".git", "node_modules", "bower_components", "vendor", "__pycache__",
    "venv", ".venv", "env", "dist", "build", "migrations", ".idea",
    "cgi-bin", "log",
}

SKIP_FILES = {
    "package-lock.json", ".gitignore", ".DS_Store", "db.sqlite3",
}

SOURCE_EXTS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".php", ".html", ".htm", ".css",
    ".scss", ".ejs", ".sql", ".json", ".md", ".sh", ".ps1", ".vue",
}

PRIORITY_NAMES = {
    "index.html", "index.php", "app.js", "app.html", "manage.py",
    "settings.py", "urls.py", "views.py", "models.py", "forms.py",
    "admin.py", "package.json", "requirements.txt", "README.md",
    "webpack.config.js", "estilo.css", "jogo.js", "config.php",
}

META = [
    {
        "slug": "canon-engineer-github-io",
        "name": "CanonEngineer.github.io",
        "repo": "CanonEngineer.github.io",
        "color": "#38bdf8",
        "icon": "javascript",
        "stack": "HTML + CSS + JS",
        "summary": "Portfolio profissional e currículo — site CanonEngineer no GitHub Pages.",
    },
    {
        "slug": "javascript-whatsapp",
        "name": "JavaScriptWhatsAppProject",
        "repo": "JavaScriptWhatsAppProject",
        "color": "#22c55e",
        "icon": "javascript",
        "stack": "JS + Webpack + Firebase",
        "summary": "Clone do WhatsApp com Webpack, Firebase Auth, Firestore e Storage.",
    },
    {
        "slug": "user-management",
        "name": "UserManagementProject",
        "repo": "UserManagementProject",
        "color": "#a78bfa",
        "icon": "node",
        "stack": "Express + EJS",
        "summary": "CRUD de usuários com Express, rotas e views EJS.",
    },
    {
        "slug": "course-python-2023",
        "name": "CoursePython2023",
        "repo": "CoursePython2023",
        "color": "#facc15",
        "icon": "python",
        "stack": "Python",
        "summary": "Exercícios e práticas do curso de Python 2023.",
    },
    {
        "slug": "python-employee-list",
        "name": "PythonEmployeeList",
        "repo": "PythonEmployeeList",
        "color": "#fb7185",
        "icon": "django",
        "stack": "Django",
        "summary": "Lista de funcionários com Django, models e templates.",
    },
    {
        "slug": "todo-app",
        "name": "TodoApp",
        "repo": "TodoApp",
        "color": "#34d399",
        "icon": "django",
        "stack": "Django CRUD",
        "summary": "TODO app Django com operações CRUD.",
    },
    {
        "slug": "project-helpdesk",
        "name": "ProjectHelpDesk",
        "repo": "ProjectHelpDesk",
        "color": "#60a5fa",
        "icon": "php",
        "stack": "PHP",
        "summary": "Help Desk em PHP: login, abrir e consultar chamados.",
    },
    {
        "slug": "app-mosquito",
        "name": "AppMosquito",
        "repo": "AppMosquito",
        "color": "#f472b6",
        "icon": "javascript",
        "stack": "HTML + CSS + JS",
        "summary": "Jogo Mata Mosquito com níveis e telas de vitória/derrota.",
    },
    {
        "slug": "neighborhood-boys",
        "name": "NeighborhoodBoysProject",
        "repo": "NeighborhoodBoysProject",
        "color": "#c084fc",
        "icon": "django",
        "stack": "Django + MySQL",
        "summary": "Sistema de salão Meninos da Vila — contas, agenda e clientes.",
    },
    {
        "slug": "search-univesp",
        "name": "SearchUnivespProject",
        "repo": "SearchUnivespProject",
        "color": "#2dd4bf",
        "icon": "node",
        "stack": "Express + EJS",
        "summary": "Projeto integrador UNIVESP com pesquisa e páginas de saúde.",
    },
    {
        "slug": "javascript-calculator",
        "name": "JavaScriptCalculatorProject",
        "repo": "JavaScriptCalculatorProject",
        "color": "#fbbf24",
        "icon": "javascript",
        "stack": "HTML + JavaScript",
        "summary": "Calculadora interativa em JavaScript com som de clique.",
    },
    {
        "slug": "python-ii-ecommerce",
        "name": "PythonIIEcommerceProject",
        "repo": "PythonIIEcommerceProject",
        "color": "#f87171",
        "icon": "django",
        "stack": "Django e-commerce",
        "summary": "E-commerce Django do curso Python II.",
    },
    {
        "slug": "html-website",
        "name": "HtmlWebsiteProject",
        "repo": "HtmlWebsiteProject",
        "color": "#4ade80",
        "icon": "html",
        "stack": "HTML + CSS + Bootstrap",
        "summary": "Coleção de sites HTML: Ana Bella, Chalé, Museu, TecBlog e mais.",
    },
    {
        "slug": "anki-univesp",
        "name": "AnkiUnivespProject",
        "repo": "AnkiUnivespProject",
        "color": "#818cf8",
        "icon": "django",
        "stack": "Django",
        "summary": "App estilo Anki para estudos UNIVESP com accounts e core.",
    },
    {
        "slug": "hyperware",
        "name": "HyperwareProject",
        "repo": "HyperwareProject",
        "color": "#94a3b8",
        "icon": "php",
        "stack": "HTML + CSS + JS + PHP",
        "summary": "Site Hyperware com estrutura web e scripts PHP.",
    },
    {
        "slug": "php-dao",
        "name": "PHPDaoProject",
        "repo": "PHPDaoProject",
        "color": "#e879f9",
        "icon": "php",
        "stack": "PHP DAO",
        "summary": "Padrão DAO em PHP com classes e config de conexão.",
    },
]

MAX_NODES = 28
MAX_FILES_PER_DIR = 8


def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower()).strip("-")
    return s[:40] or "x"


def is_source(path: Path) -> bool:
    if path.name in SKIP_FILES:
        return False
    if path.name.startswith(".") and path.name not in {".env-sample"}:
        return False
    if path.suffix.lower() not in SOURCE_EXTS:
        return False
    # skip huge/minified vendor assets
    low = path.name.lower()
    if low.endswith(".min.js") or low.endswith(".min.css"):
        return False
    if "fontawesome" in str(path).lower() or "bootstrap" in low:
        return False
    return True


def file_score(path: Path) -> tuple:
    name = path.name
    parts_l = [p.lower() for p in path.parts]
    pri = 0 if name in PRIORITY_NAMES else 1
    # deprioritize vendor / plugins / empty stubs
    penalty = 0
    if any(x in parts_l for x in ("plugins", "vendor", "node_modules", "bower_components", "revolution")):
        penalty += 50
    if name in {"__init__.py", "tests.py", "apps.py"}:
        penalty += 20
    if name == "index.php" and "plugins" in parts_l:
        penalty += 40
    depth = len(path.parts)
    ext_rank = {
        ".py": 0, ".js": 0, ".php": 0, ".ejs": 1, ".html": 2, ".css": 3,
        ".json": 4, ".md": 5, ".sql": 3, ".scss": 3,
    }.get(path.suffix.lower(), 9)
    # prefer non-empty-looking filenames over stubs
    size_hint = 0
    try:
        sz = path.stat().st_size
        if sz < 40:
            size_hint = 30
        elif sz < 200:
            size_hint = 5
    except OSError:
        size_hint = 10
    return (pri + penalty + size_hint, ext_rank, depth, name.lower())


def collect_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(
            d for d in dirnames
            if d not in SKIP_DIRS and not d.startswith(".")
        )
        # skip deep plugin trees entirely
        parts_l = [p.lower() for p in Path(dirpath).parts]
        if any(x in parts_l for x in ("plugins", "node_modules", "vendor", "bower_components")):
            dirnames[:] = []
            continue
        for fn in filenames:
            p = Path(dirpath) / fn
            if is_source(p):
                files.append(p)
    files.sort(key=file_score)
    return files


def short_desc(rel: str, layer: str) -> str:
    if layer == "root":
        return "Raiz do repositório — ponto de entrada da árvore de estudo."
    if layer == "module":
        return f"Módulo/pasta `{rel}` com arquivos-chave do projeto."
    return f"Arquivo `{rel}` mapeado a partir do repositório original."


def impl_for(rel: str) -> list[str]:
    return [
        f"Abra `{rel}` no repositório original.",
        "Compare com os nós irmãos da mesma pasta.",
        "Estude o fluxo a partir da raiz do projeto.",
    ]


def build_tree(meta: dict) -> dict | None:
    root_dir = DESKTOP / meta["repo"]
    if not root_dir.is_dir():
        print(f"MISSING clone: {root_dir}")
        return None

    prefix = meta["slug"].split("-")[0][:3]
    # better short id from slug initials
    parts = meta["slug"].split("-")
    prefix = "".join(p[0] for p in parts)[:4]
    if len(prefix) < 3:
        prefix = meta["slug"][:3]

    files = collect_files(root_dir)
    if not files:
        print(f"NO FILES: {meta['repo']}")
        return None

    # Prefer entry points for root file field
    entry = None
    for cand in ("index.html", "index.php", "app.js", "manage.py", "README.md"):
        p = root_dir / cand
        if p.is_file():
            entry = cand
            break
    if entry is None:
        entry = str(files[0].relative_to(root_dir)).replace("\\", "/")

    nodes = [{
        "id": f"{prefix}-root",
        "parent": None,
        "layer": "root",
        "title": meta["name"],
        "description": meta["summary"],
        "file": entry,
        "code": f"// {meta['name']}\n// {meta['summary']}\n",
        "implementation": [
            f"Clone: git clone https://github.com/CanonEngineer/{meta['repo']}.git",
            "Explore a árvore pelos módulos e arquivos.",
            "Abra o repositório no GitHub para o código completo.",
        ],
    }]

    # Group by top-level folder (or '.' for root files)
    groups: dict[str, list[Path]] = {}
    for f in files:
        rel = f.relative_to(root_dir)
        top = rel.parts[0] if len(rel.parts) > 1 else "."
        groups.setdefault(top, []).append(f)

    # Order groups: special dirs first, then alpha; root files last-ish
    def group_key(g: str):
        special = {
            "src": 0, "scripts": 0, "routes": 1, "views": 1, "public": 2,
            "templates": 2, "accounts": 1, "core": 1, "web": 0, "class": 0,
            "employees": 1, "todo": 1, "todo_main": 1, "mysite": 1,
            "wwwroot": 0, "blog": 1, "css": 3, "img": 4, "imagens": 4,
            "audio": 4, "assests": 3, "assets": 3, "design": 2, "app": 1,
            "agenda": 1, "meninos_da_vila": 1, "ProjetoAnkiUnivesp": 1,
            "inc": 1, "bin": 2, ".": 5,
        }
        return (special.get(g, 10), g.lower())

    ordered = sorted(groups.keys(), key=group_key)

    module_ids: dict[str, str] = {}
    used_ids = {nodes[0]["id"]}

    def make_id(base: str) -> str:
        bid = f"{prefix}-{slugify(base)}"
        if bid not in used_ids:
            used_ids.add(bid)
            return bid
        i = 2
        while f"{bid}-{i}" in used_ids:
            i += 1
        nid = f"{bid}-{i}"
        used_ids.add(nid)
        return nid

    for group in ordered:
        if len(nodes) >= MAX_NODES:
            break
        gfiles = sorted(groups[group], key=file_score)[:MAX_FILES_PER_DIR]

        if group == ".":
            parent = f"{prefix}-root"
        else:
            mid = make_id(group)
            module_ids[group] = mid
            rel_mod = group + "/"
            nodes.append({
                "id": mid,
                "parent": f"{prefix}-root",
                "layer": "module",
                "title": group,
                "description": short_desc(rel_mod, "module"),
                "file": rel_mod,
                "code": f"// módulo {group}/\n",
                "implementation": impl_for(rel_mod),
            })
            parent = mid

        for f in gfiles:
            if len(nodes) >= MAX_NODES:
                break
            rel = str(f.relative_to(root_dir)).replace("\\", "/")
            # skip tiny stubs (__init__.py empty, plugin placeholders)
            try:
                if f.stat().st_size < 30 and f.name in {"__init__.py", "index.php"}:
                    continue
            except OSError:
                pass
            nid = make_id(rel.replace("/", "-").replace(".", "-"))
            nodes.append({
                "id": nid,
                "parent": parent,
                "layer": "file",
                "title": Path(rel).name,
                "description": short_desc(rel, "file"),
                "file": rel,
                "code": f"// {rel}\n",
                "implementation": impl_for(rel),
            })

    return {
        "slug": meta["slug"],
        "name": meta["name"],
        "repoUrl": f"https://github.com/CanonEngineer/{meta['repo']}",
        "color": meta["color"],
        "icon": meta["icon"],
        "stack": meta["stack"],
        "summary": meta["summary"],
        "nodes": nodes,
    }


def main() -> None:
    projects = []
    for meta in META:
        proj = build_tree(meta)
        if proj:
            projects.append(proj)
            print(f"  {proj['name']}: {len(proj['nodes'])} nós")
        else:
            print(f"  SKIP {meta['name']}")

    OUT.write_text(json.dumps(projects, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n{len(projects)} projetos -> {OUT}")


if __name__ == "__main__":
    main()
