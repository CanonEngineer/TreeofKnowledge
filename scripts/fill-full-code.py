#!/usr/bin/env python3
"""Preenche o campo code de cada nó com o código-fonte completo do repositório."""
from __future__ import annotations

import ast
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(ROOT, "scripts")
DESKTOP = os.path.join(os.path.expanduser("~"), "Desktop")

REPO_DIRS = {
    "canon-python-ecommerce": "CanonPythonEcommerce",
    "food-online-django": "FoodOnlineDjango",
    "javascript-dropbox": "JavaScriptDropBoxProject",
    "javascript-restaurant": "JavaScriptRestaurantProject",
    "javascript-users": "JavaScriptUsersProject",
    "javascript-restful-api": "JavaScriptRestfulApiProject",
    "professional-scanner": "Professional-Scanner",
    "customize-veyon": "CustomizeVeyonProject",
}

PREFIXES = {
    "customize-veyon": os.path.join("veyon-4.10.4-src (1)", "veyon-4.10.4"),
}

SOURCE_EXTS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".cpp", ".h", ".hpp", ".c", ".cc",
    ".ejs", ".html", ".css", ".sql", ".json", ".sh", ".md", ".vue",
}

SKIP_DIRS = {
    "node_modules", "bower_components", "vendor", "__pycache__", ".git",
    "dist", "build", "migrations", ".venv", "venv",
}

MAX_NODE_CHARS = 250_000


def repo_root(slug: str) -> str:
    name = REPO_DIRS.get(slug)
    if not name:
        raise KeyError(f"Repositório desconhecido: {slug}")
    path = os.path.join(DESKTOP, name)
    if not os.path.isdir(path):
        raise FileNotFoundError(f"Clone não encontrado: {path}")
    return path


def resolve_path(slug: str, file_field: str) -> str | None:
    if not file_field:
        return None
    base = repo_root(slug)
    rel = file_field.replace("/", os.sep).rstrip(os.sep)
    candidates = [os.path.join(base, rel)]
    prefix = PREFIXES.get(slug)
    if prefix and not rel.startswith(prefix.replace("/", os.sep)):
        candidates.append(os.path.join(base, prefix, rel))
    for cand in candidates:
        if os.path.isfile(cand):
            return cand
        if os.path.isdir(cand):
            return cand
    # fallback: basename
    name = os.path.basename(rel)
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        if name in filenames:
            return os.path.join(dirpath, name)
    return None


def read_text(path: str) -> str:
    for enc in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            with open(path, encoding=enc) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
    raise UnicodeDecodeError("utf-8", b"", 0, 1, path)


def truncate(text: str) -> str:
    if len(text) <= MAX_NODE_CHARS:
        return text
    return text[:MAX_NODE_CHARS] + f"\n\n/* ... truncado ({len(text)} chars) ... */"


def brace_block(source: str, start: int) -> str | None:
    i = source.find("{", start)
    if i < 0:
        return None
    depth = 0
    for j in range(i, len(source)):
        ch = source[j]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return source[start:j + 1].strip()
    return None


def parse_title(title: str) -> tuple[str, ...]:
    m = re.match(r"^(GET|POST|PUT|DELETE|PATCH)\s+(.+)$", title.strip(), re.I)
    if m:
        return ("route", m.group(1).upper(), m.group(2).strip())
    if title.endswith("()"):
        return ("function", title[:-2].strip(), "")
    if title.endswith(".js") or title.endswith(".py") or title.endswith(".cpp"):
        return ("file", title.strip(), "")
    return ("symbol", title.strip(), "")


def extract_python(source: str, title: str, layer: str) -> str | None:
    kind, name, _ = parse_title(title)
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return None
    targets: list[str] = []
    if kind == "function":
        targets = [name]
    elif layer == "file" and kind == "symbol":
        targets = [name]
    elif kind == "symbol":
        targets = [name]
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name in targets:
            seg = ast.get_source_segment(source, node)
            if seg:
                return seg
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in targets:
            seg = ast.get_source_segment(source, node)
            if seg:
                return seg
    return None


def extract_js_route(source: str, method: str, path: str) -> str | None:
    esc = re.escape(path)
    patterns = [
        rf"router\.{method.lower()}\s*\(\s*['\"]{esc}['\"]",
        rf"app\.{method.lower()}\s*\(\s*['\"]{esc}['\"]",
    ]
    for pat in patterns:
        m = re.search(pat, source)
        if m:
            return brace_block(source, m.start())
    return None


def extract_js_symbol(source: str, name: str) -> str | None:
    patterns = [
        rf"function\s+{re.escape(name)}\s*\(",
        rf"async\s+function\s+{re.escape(name)}\s*\(",
        rf"{re.escape(name)}\s*=\s*function\s*\(",
        rf"{re.escape(name)}\s*=\s*async\s*function\s*\(",
        rf"{re.escape(name)}\s*=\s*\([^)]*\)\s*=>",
        rf"{re.escape(name)}\s*=\s*async\s*\([^)]*\)\s*=>",
        rf"\b{re.escape(name)}\s*\([^)]*\)\s*\{{",
        rf"class\s+{re.escape(name)}\b",
    ]
    for pat in patterns:
        m = re.search(pat, source)
        if m:
            block = brace_block(source, m.start())
            if block:
                return block
    return None


def extract_cpp(source: str, title: str, layer: str) -> str | None:
    kind, name, _ = parse_title(title)
    targets = []
    if kind == "function":
        targets = [name]
    elif kind == "symbol":
        targets = [name, name.split("::")[-1]]
    for t in targets:
        if not t:
            continue
        patterns = [
            rf"class\s+{re.escape(t)}\b",
            rf"{re.escape(t)}::{re.escape(t)}\s*\(",
            rf"\b{re.escape(t)}\s*\([^)]*\)\s*(const)?\s*\{{",
        ]
        for pat in patterns:
            m = re.search(pat, source)
            if m:
                block = brace_block(source, m.start())
                if block:
                    return block
    return None


def read_directory(dirpath: str) -> str:
    parts: list[str] = []
    for dirpath_walk, dirnames, filenames in os.walk(dirpath):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for fn in sorted(filenames):
            ext = os.path.splitext(fn)[1].lower()
            if ext not in SOURCE_EXTS:
                continue
            fp = os.path.join(dirpath_walk, fn)
            rel = os.path.relpath(fp, dirpath)
            try:
                content = read_text(fp)
            except (OSError, UnicodeDecodeError):
                continue
            parts.append(f"// ===== {rel} =====\n{content.rstrip()}")
    return "\n\n".join(parts)


def extract_symbol(source: str, path: str, title: str, layer: str) -> str | None:
    ext = os.path.splitext(path)[1].lower()
    kind, name, extra = parse_title(title)
    if kind == "route":
        if ext in (".js", ".ts"):
            return extract_js_route(source, name, extra)
        return None
    if ext == ".py":
        return extract_python(source, title, layer)
    if ext in (".js", ".jsx", ".ts", ".tsx"):
        if kind == "function":
            return extract_js_symbol(source, name)
        if kind == "symbol":
            return extract_js_symbol(source, name)
    if ext in (".cpp", ".h", ".hpp", ".cc", ".c"):
        return extract_cpp(source, title, layer)
    return None


def code_for_node(slug: str, node: dict) -> str:
    layer = node.get("layer", "")
    title = node.get("title", "")
    file_field = node.get("file", "")
    resolved = resolve_path(slug, file_field)
    if not resolved:
        return node.get("code", "")

    if os.path.isdir(resolved):
        content = read_directory(resolved)
        return truncate(content) if content else node.get("code", "")

    source = read_text(resolved)

    if layer == "function":
        extracted = extract_symbol(source, resolved, title, layer)
        if extracted and len(extracted) >= 80:
            return truncate(extracted)
        return truncate(source)

    if layer == "file" and parse_title(title)[0] == "symbol":
        extracted = extract_symbol(source, resolved, title, layer)
        if extracted:
            return truncate(extracted)

    return truncate(source)


def fill_project(project: dict) -> tuple[int, int]:
    slug = project["slug"]
    updated = 0
    total = len(project.get("nodes", []))
    for node in project.get("nodes", []):
        try:
            new_code = code_for_node(slug, node)
        except Exception as exc:
            print(f"  WARN {slug}/{node.get('id')}: {exc}", file=sys.stderr)
            continue
        if new_code and new_code != node.get("code"):
            node["code"] = new_code
            updated += 1
    return updated, total


def load_json(path: str) -> list | dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path: str, data) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def project_files() -> list[tuple[str, bool]]:
    """(path, is_single_project_json)"""
    return [
        (os.path.join(SCRIPTS, "cpe-project.json"), True),
        (os.path.join(SCRIPTS, "projects-data.json"), False),
        (os.path.join(SCRIPTS, "dropbox-project.json"), True),
        (os.path.join(SCRIPTS, "restaurant-project.json"), True),
        (os.path.join(SCRIPTS, "veyon-project.json"), True),
    ]


def main() -> None:
    grand_updated = 0
    grand_total = 0
    for path, single in project_files():
        if not os.path.isfile(path):
            print(f"SKIP (não existe): {path}")
            continue
        data = load_json(path)
        projects = [data] if single else data
        print(f"\n{os.path.basename(path)}:")
        for project in projects:
            u, t = fill_project(project)
            grand_updated += u
            grand_total += t
            print(f"  {project['name']}: {u}/{t} nós atualizados")
        save_json(path, data)
    print(f"\nTotal: {grand_updated}/{grand_total} nós com código completo.")


if __name__ == "__main__":
    main()
