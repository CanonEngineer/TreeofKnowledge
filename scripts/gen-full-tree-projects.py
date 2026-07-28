#!/usr/bin/env python3
"""Regenera os projetos do Tree of Knowledge como árvores full-code.

Mantém os metadados atuais (slug, nome, cor, stack, etc.) e substitui os nós
curados por um scan completo do repositório local de cada projeto.
"""
from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DESKTOP = Path.home() / "Desktop"

SOURCE_FILES: list[tuple[str, bool]] = [
    ("cpe-project.json", True),
    ("projects-data.json", False),
    ("dropbox-project.json", True),
    ("restaurant-project.json", True),
    ("veyon-project.json", True),
    ("canonsyncengine-project.json", True),
    ("extra-projects.json", False),
    ("dangerzone-project.json", True),
    ("smarthome-project.json", True),
    ("smartferrari-project.json", True),
]

REPO_CANDIDATES = {
    "canon-sync-engine": [
        DESKTOP / "CanonCopy",
    ],
    "customize-veyon": [
        DESKTOP / "CustomizeVeyonProject",
        DESKTOP / "Projeto Veyon" / "veyon-4.10.4-src (1)" / "veyon-4.10.4",
        DESKTOP / "Projeto Veyon",
    ],
    "danger-zone": [
        DESKTOP / "DangerZone",
        DESKTOP / "Danger Zone" / "DangerZone-tmp",
    ],
}

SKIP_DIRS = {
    ".git",
    "bin",
    "obj",
    "node_modules",
    "bower_components",
    "vendor",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    "dist",
    "build",
    "build-win64",
    "backups",
    ".cursor",
    "reports",
    ".pytest_cache",
    ".mypy_cache",
    "htmlcov",
    ".eggs",
    "coverage",
    ".idea",
}

SKIP_FILES = {
    "package-lock.json",
    "celerybeat-schedule",
    ".DS_Store",
    "Thumbs.db",
    "db.sqlite3",
}

ALLOW_DOTFILES = {
    ".gitignore",
    ".cursorignore",
    ".dockerignore",
    ".env.example",
    ".env-sample",
    ".nojekyll",
}

CODE_EXTS = {
    ".py",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".css",
    ".scss",
    ".ps1",
    ".yml",
    ".yaml",
    ".md",
    ".json",
    ".toml",
    ".ini",
    ".bat",
    ".sh",
    ".sql",
    ".html",
    ".htm",
    ".vue",
    ".dockerfile",
    ".ejs",
    ".php",
    ".java",
    ".cpp",
    ".c",
    ".cc",
    ".h",
    ".hpp",
    ".ino",
    ".cs",
    ".go",
    ".rs",
}

MAX_FILE_BYTES = 1_500_000
CODE_LIMIT = 7000
FUNC_CODE_LIMIT = 4500
MAX_DIRECT_FILES = 12
MAX_ROOT_CHILDREN = 16
MAX_FUNCS_PER_FILE = 28
MAX_ROUTES_PER_FILE = 48

# Projetos que ganham nós function (rotas/funções) sob arquivos-chave
FUNCTION_EXTRACT_SLUGS = {"professional-scanner"}

# Funções prioritárias (espelha a árvore antiga / APIs críticas)
PRIORITY_FUNCS = {
    "server.js": [
        "parseTarget",
        "pingHost",
        "getOSFromTTL",
        "resolveHostname",
        "getMacAddress",
        "scanTcpPort",
        "runConcurrent",
        "detectDMZ",
        "detectOTICS",
        "detectVM",
        "getADDomain",
        "broadcastLoopMsg",
        "notifyPlatformScanComplete",
        "abortScanSockets",
        "guessServiceName",
    ],
    "public/app.js": [
        "bootCanonApp",
        "gateCanonModalsArea",
        "handleServerMessage",
        "openLoopModal",
        "renderAutoTestEngineeringBanner",
        "buildTopologyFromResults",
        "addOrUpdateHost",
        "applyAutoTestResult",
        "applyCanonUiTheme",
        "refreshResultsTable",
        "startScan",
        "stopScan",
        "exportResultsXlsx",
    ],
    "public/map.js": [
        "render3DMap",
        "refreshTopology",
        "buildTreeGraph",
        "exportMapPng",
        "exportMapSvg",
        "exportMapExcel",
    ],
    "hostEnrichment.js": [
        "enrichHost",
        "resolveHostname",
        "getOSFromTTL",
        "getMacFromArp",
        "lookupAd",
        "lookupAdByIp",
        "detectVM",
    ],
    "deviceTypeDetect.js": ["detectDeviceType"],
    "vmVlanStrategy.js": [
        "detectVirtualization",
        "applyVirtualizationToHost",
        "assignVlansToHosts",
        "resolveHostVlan",
        "querySwitchesMacVlan",
    ],
}


def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower()).strip("-")
    return s[:80] or "x"


def path_id(slug: str, rel: str, *, is_dir: bool = False) -> str:
    clean = rel.replace("\\", "/").strip("/")
    prefix = slugify(slug)
    if not clean:
        return f"{prefix}-root"
    kind = "dir" if is_dir else "file"
    return f"{prefix}-{kind}-{slugify(clean)}"[:140]


def repo_name_from_url(url: str) -> str:
    return url.rstrip("/").split("/")[-1]


def find_repo(slug: str, repo_url: str) -> Path:
    for candidate in REPO_CANDIDATES.get(slug, []):
        if candidate.is_dir():
            return candidate
    repo_name = repo_name_from_url(repo_url)
    candidate = DESKTOP / repo_name
    if candidate.is_dir():
        return candidate
    raise FileNotFoundError(f"Clone não encontrado para {slug}: {repo_name}")


def file_suffix(path: Path) -> str:
    if path.name.lower() == "dockerfile":
        return ".dockerfile"
    return path.suffix.lower()


def is_code_candidate(path: Path, repo: Path) -> bool:
    rel_parts = path.relative_to(repo).parts
    if any(part in SKIP_DIRS for part in rel_parts):
        return False
    if path.name in SKIP_FILES:
        return False
    if path.name.startswith("tmp_"):
        return False
    if path.name.startswith(".") and path.name not in ALLOW_DOTFILES:
        return False
    suffix = file_suffix(path)
    if suffix not in CODE_EXTS and path.name not in ALLOW_DOTFILES and path.name != "www":
        return False
    return True


def collect_files(repo: Path) -> tuple[list[Path], list[Path]]:
    """Retorna (arquivos normais, stubs grandes)."""
    files: list[Path] = []
    stubs: list[Path] = []
    for path in repo.rglob("*"):
        if not path.is_file():
            continue
        if not is_code_candidate(path, repo):
            continue
        try:
            size = path.stat().st_size
        except OSError:
            continue
        if size > MAX_FILE_BYTES:
            stubs.append(path)
        else:
            files.append(path)
    files.sort(key=lambda p: p.as_posix().lower())
    stubs.sort(key=lambda p: p.as_posix().lower())
    return files, stubs


def read_code(repo: Path, rel: str, limit: int = CODE_LIMIT) -> str:
    path = repo / rel.replace("/", os.sep)
    if not path.is_file():
        return f"# Arquivo não encontrado: {rel}\n"
    try:
        raw = path.read_bytes()
    except OSError as exc:
        return f"# Erro ao ler {rel}: {exc}\n"
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("utf-8", errors="replace")
    if len(text) > limit:
        text = text[:limit] + "\n\n/* … truncado na árvore (arquivo completo no GitHub) … */\n"
    return text


def stub_code(repo: Path, rel: str) -> str:
    path = repo / rel.replace("/", os.sep)
    size = path.stat().st_size if path.is_file() else 0
    return (
        f"# Arquivo grande demais para embutir na árvore ({size:,} bytes)\n"
        f"# path: {rel}\n"
        f"# Abra no GitHub / clone local para o conteúdo completo.\n"
    )


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


def extract_js_function(source: str, name: str) -> str | None:
    patterns = [
        rf"async\s+function\s+{re.escape(name)}\s*\(",
        rf"function\s+{re.escape(name)}\s*\(",
        rf"(?:const|let|var)\s+{re.escape(name)}\s*=\s*async\s*\(",
        rf"(?:const|let|var)\s+{re.escape(name)}\s*=\s*\(",
        rf"(?:const|let|var)\s+{re.escape(name)}\s*=\s*async\s+function\s*\(",
        rf"(?:const|let|var)\s+{re.escape(name)}\s*=\s*function\s*\(",
    ]
    for pat in patterns:
        m = re.search(pat, source)
        if m:
            block = brace_block(source, m.start())
            if block and len(block) >= 40:
                return block[:FUNC_CODE_LIMIT]
    return None


def extract_js_route(source: str, method: str, route: str) -> str | None:
    esc = re.escape(route)
    patterns = [
        rf"(?:app|router)\.{method.lower()}\s*\(\s*['\"]{esc}['\"]",
    ]
    for pat in patterns:
        m = re.search(pat, source)
        if m:
            block = brace_block(source, m.start())
            if block:
                return block[:FUNC_CODE_LIMIT]
    return None


def list_js_symbols(source: str) -> tuple[list[tuple[str, str]], list[str]]:
    """Retorna (rotas [(METHOD, path)], funções)."""
    routes = [
        (m.upper(), path)
        for m, path in re.findall(
            r"(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['\"]([^'\"]+)['\"]",
            source,
            re.I,
        )
    ]
    funcs = list(
        dict.fromkeys(
            re.findall(r"(?:async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(", source)
        )
    )
    return routes, funcs


def pick_functions(rel: str, funcs: list[str]) -> list[str]:
    priority = PRIORITY_FUNCS.get(rel, [])
    picked: list[str] = []
    for name in priority:
        if name in funcs and name not in picked:
            picked.append(name)
    for name in funcs:
        if name.startswith("_"):
            continue
        if name not in picked:
            picked.append(name)
        if len(picked) >= MAX_FUNCS_PER_FILE:
            break
    return picked[:MAX_FUNCS_PER_FILE]


def root_entry(repo: Path, files: list[Path], original_file: str | None) -> str:
    preferred = [original_file, "README.md", "README.rst", "README.txt", "index.html", "app.js", "manage.py"]
    for entry in preferred:
        if not entry:
            continue
        if (repo / entry).is_file():
            return entry
    return files[0].relative_to(repo).as_posix()


def unique_id(candidate: str, seen: set[str]) -> str:
    if candidate not in seen:
        seen.add(candidate)
        return candidate
    base = candidate
    idx = 2
    while f"{base}-{idx}" in seen:
        idx += 1
    out = f"{base}-{idx}"
    seen.add(out)
    return out


def build_project(meta: dict) -> dict:
    slug = meta["slug"]
    repo = find_repo(slug, meta["repoUrl"])
    files, stubs = collect_files(repo)
    if not files and not stubs:
        raise RuntimeError(f"Nenhum arquivo elegível para {slug}")

    nodes: list[dict] = []
    seen_ids: set[str] = set()
    dir_ids: dict[str, str] = {"": f"{slugify(slug)}-root"}
    extract_funcs = slug in FUNCTION_EXTRACT_SLUGS
    source_file_count = len(files) + len(stubs)

    entry = root_entry(repo, files or stubs, meta.get("file"))
    nodes.append(
        {
            "id": dir_ids[""],
            "parent": None,
            "layer": "root",
            "title": meta["name"],
            "description": meta.get("summary") or f"Árvore completa do repositório `{meta['name']}`.",
            "file": entry,
            "code": read_code(repo, entry, limit=12000),
            "implementation": [
                f"Repo: {meta['repoUrl']}",
                f"Arquivos na árvore: {source_file_count}",
                "2D + Galaxy 3D — cobertura total do código-fonte",
            ],
        }
    )
    seen_ids.add(dir_ids[""])

    all_for_dirs = files + stubs
    dirs_needed: set[str] = set()
    for f in all_for_dirs:
        rel = f.relative_to(repo).as_posix()
        parent = str(Path(rel).parent).replace("\\", "/")
        if parent == ".":
            parent = ""
        parts = parent.split("/") if parent else []
        acc: list[str] = []
        for part in parts:
            acc.append(part)
            dirs_needed.add("/".join(acc))

    for drel in sorted(dirs_needed, key=lambda s: (s.count("/"), s.lower())):
        parent_path = str(Path(drel).parent).replace("\\", "/")
        if parent_path == ".":
            parent_path = ""
        did = unique_id(path_id(slug, drel, is_dir=True), seen_ids)
        dir_ids[drel] = did
        nodes.append(
            {
                "id": did,
                "parent": dir_ids.get(parent_path, dir_ids[""]),
                "layer": "module",
                "title": Path(drel).name + "/",
                "description": f"Pacote/pasta `{drel}/` do projeto.",
                "file": drel + "/",
                "code": f"# Diretório: {drel}/\n# Contém arquivos e subpastas do projeto.\n",
                "implementation": [f"path: {drel}/", "nó de agrupamento na árvore"],
            }
        )

    files_by_dir: dict[str, list[Path]] = defaultdict(list)
    stub_set = {p.resolve() for p in stubs}
    for f in all_for_dirs:
        rel = f.relative_to(repo).as_posix()
        if rel == entry:
            continue
        parent = str(Path(rel).parent).replace("\\", "/")
        if parent == ".":
            parent = ""
        files_by_dir[parent].append(f)

    def ensure_group(parent_path: str, parent_id: str, label: str, slug_part: str) -> str:
        group_base = path_id(slug, (parent_path + "/" if parent_path else "") + slug_part, is_dir=True)
        gid = unique_id(group_base.replace("-dir-", "-grp-"), seen_ids)
        nodes.append(
            {
                "id": gid,
                "parent": parent_id,
                "layer": "module",
                "title": label,
                "description": f"Grupo de arquivos em `{parent_path or '.'}/` — {label}",
                "file": (parent_path + "/" if parent_path else "") + f"[{slug_part}]",
                "code": f"# Grupo: {label}\n# Pasta: {parent_path or '.'}/\n",
                "implementation": ["agrupamento para layout 2D/3D", f"pasta: {parent_path or '.'}/"],
            }
        )
        return gid

    def add_function_children(file_id: str, rel: str, source: str) -> int:
        if not extract_funcs or not rel.endswith((".js", ".jsx", ".ts", ".tsx")):
            return 0
        routes, funcs = list_js_symbols(source)
        if rel not in PRIORITY_FUNCS and not routes:
            return 0

        children_specs: list[tuple[str, str, str]] = []
        for method, route in routes[:MAX_ROUTES_PER_FILE]:
            title = f"{method} {route}"
            code = extract_js_route(source, method, route) or f"// {title}\n// rota em {rel}\n"
            children_specs.append((title, code, "route"))

        for name in pick_functions(rel, funcs):
            title = f"{name}()"
            code = extract_js_function(source, name) or f"// {title}\n// função em {rel}\n"
            children_specs.append((title, code, "function"))

        if not children_specs:
            return 0

        parents: list[tuple[str, tuple[str, str, str]]] = []
        if len(children_specs) <= MAX_DIRECT_FILES:
            parents = [(file_id, s) for s in children_specs]
        else:
            route_specs = [s for s in children_specs if s[2] == "route"]
            func_specs = [s for s in children_specs if s[2] == "function"]

            def attach_chunks(specs: list[tuple[str, str, str]], group_title: str, slug_part: str) -> None:
                if not specs:
                    return
                group_id = unique_id(
                    path_id(slug, f"{rel}/{slug_part}", is_dir=True).replace("-dir-", "-grp-"),
                    seen_ids,
                )
                nodes.append(
                    {
                        "id": group_id,
                        "parent": file_id,
                        "layer": "module",
                        "title": group_title,
                        "description": f"{group_title} em `{rel}`",
                        "file": f"{rel}#{slug_part}",
                        "code": f"# {group_title} em {rel}\n",
                        "implementation": [f"agrupamento: {slug_part}"],
                    }
                )
                if len(specs) <= MAX_DIRECT_FILES:
                    parents.extend((group_id, s) for s in specs)
                    return
                for start in range(0, len(specs), MAX_DIRECT_FILES):
                    chunk = specs[start:start + MAX_DIRECT_FILES]
                    lo, hi = start + 1, start + len(chunk)
                    gid = unique_id(
                        path_id(slug, f"{rel}/{slug_part}/{lo}-{hi}", is_dir=True).replace("-dir-", "-grp-"),
                        seen_ids,
                    )
                    nodes.append(
                        {
                            "id": gid,
                            "parent": group_id,
                            "layer": "module",
                            "title": f"{group_title} {lo}–{hi}",
                            "description": f"Fatia {lo}–{hi} de {group_title.lower()} em `{rel}`",
                            "file": f"{rel}#{slug_part}-{lo}-{hi}",
                            "code": f"# {group_title} {lo}-{hi} em {rel}\n",
                            "implementation": [f"agrupamento: {slug_part}"],
                        }
                    )
                    parents.extend((gid, s) for s in chunk)

            attach_chunks(route_specs, "Rotas API", "routes")
            attach_chunks(func_specs, "Funções", "functions")

        added = 0
        for parent_fn, (title, code, kind) in parents:
            nid = unique_id(
                path_id(slug, f"{rel}/{title}", is_dir=False).replace("-file-", "-fn-"),
                seen_ids,
            )
            nodes.append(
                {
                    "id": nid,
                    "parent": parent_fn,
                    "layer": "function",
                    "title": title,
                    "description": f"{'Rota' if kind == 'route' else 'Função'} em `{rel}`",
                    "file": rel,
                    "code": code,
                    "implementation": [
                        f"Arquivo: {rel}",
                        f"Símbolo: {title}",
                        f"GitHub: {meta['repoUrl'].rstrip('/')}/blob/main/{rel}",
                    ],
                }
            )
            added += 1
        return added

    function_nodes = 0
    stub_nodes = 0

    for parent_path, flist in sorted(files_by_dir.items(), key=lambda item: item[0].lower()):
        flist = sorted(flist, key=lambda p: p.name.lower())
        parent_id = dir_ids.get(parent_path, dir_ids[""])

        if len(flist) <= MAX_DIRECT_FILES:
            targets = [(parent_id, f) for f in flist]
        else:
            by_letter: dict[str, list[Path]] = defaultdict(list)
            for f in flist:
                ch = f.name[0].upper()
                key = ch if ch.isalpha() else "#"
                by_letter[key].append(f)

            buckets: list[tuple[str, list[Path]]] = []
            cur_label_parts: list[str] = []
            cur_files: list[Path] = []
            for letter in sorted(by_letter):
                chunk = by_letter[letter]
                if cur_files and len(cur_files) + len(chunk) > MAX_DIRECT_FILES:
                    buckets.append(("–".join(cur_label_parts), cur_files))
                    cur_label_parts, cur_files = [], []
                cur_label_parts.append(letter)
                cur_files.extend(chunk)
            if cur_files:
                buckets.append(("–".join(cur_label_parts), cur_files))

            targets = []
            for label, chunk in buckets:
                letter_parent = ensure_group(
                    parent_path,
                    parent_id,
                    f"Arquivos {label}",
                    f"files-{label.lower()}",
                )
                if len(chunk) <= MAX_DIRECT_FILES:
                    targets.extend((letter_parent, f) for f in chunk)
                else:
                    for start in range(0, len(chunk), MAX_DIRECT_FILES):
                        part = chunk[start:start + MAX_DIRECT_FILES]
                        lo = start + 1
                        hi = start + len(part)
                        gid = ensure_group(
                            parent_path,
                            letter_parent,
                            f"{lo}–{hi}",
                            f"files-{label.lower()}-{lo}-{hi}",
                        )
                        targets.extend((gid, f) for f in part)

        for file_parent_id, f in targets:
            rel = f.relative_to(repo).as_posix()
            fid = unique_id(path_id(slug, rel, is_dir=False), seen_ids)
            is_stub = f.resolve() in stub_set
            if is_stub:
                stub_nodes += 1
                code = stub_code(repo, rel)
                desc = f"Arquivo grande (stub): `{rel}` — conteúdo completo no GitHub."
            else:
                code = read_code(repo, rel)
                desc = f"Código-fonte: `{rel}`"
            nodes.append(
                {
                    "id": fid,
                    "parent": file_parent_id,
                    "layer": "file",
                    "title": Path(rel).name,
                    "description": desc,
                    "file": rel,
                    "code": code,
                    "implementation": [
                        f"path: {rel}",
                        f"GitHub: {meta['repoUrl'].rstrip('/')}/blob/main/{rel}",
                        *(["stub: arquivo > 1.5MB"] if is_stub else []),
                    ],
                }
            )
            if not is_stub and extract_funcs:
                try:
                    source = (repo / rel).read_text(encoding="utf-8", errors="replace")
                except OSError:
                    source = ""
                function_nodes += add_function_children(fid, rel, source)

    # Se a raiz ainda tiver muitos filhos (pastas + grupos), agrupa módulos
    root_id = dir_ids[""]
    root_kids = [n for n in nodes if n.get("parent") == root_id]
    if len(root_kids) > MAX_ROOT_CHILDREN:
        by_letter: dict[str, list[dict]] = defaultdict(list)
        for child in root_kids:
            ch = (child.get("title") or child["id"])[0].upper()
            key = ch if ch.isalpha() else "#"
            by_letter[key].append(child)

        buckets: list[tuple[str, list[dict]]] = []
        cur_label: list[str] = []
        cur_nodes: list[dict] = []
        for letter in sorted(by_letter):
            chunk = by_letter[letter]
            if cur_nodes and len(cur_nodes) + len(chunk) > MAX_ROOT_CHILDREN:
                buckets.append(("–".join(cur_label), cur_nodes))
                cur_label, cur_nodes = [], []
            cur_label.append(letter)
            cur_nodes.extend(chunk)
        if cur_nodes:
            buckets.append(("–".join(cur_label), cur_nodes))

        for label, chunk in buckets:
            if len(chunk) <= 1:
                continue
            bucket_id = unique_id(
                path_id(slug, f"root-bucket-{label.lower()}", is_dir=True).replace("-dir-", "-grp-"),
                seen_ids,
            )
            nodes.append(
                {
                    "id": bucket_id,
                    "parent": root_id,
                    "layer": "module",
                    "title": f"Pastas {label}",
                    "description": f"Agrupamento de pastas/módulos na raiz — {label}",
                    "file": f"[root-{label.lower()}]",
                    "code": f"# Agrupamento da raiz: {label}\n",
                    "implementation": ["agrupamento de fan-out da raiz", f"letras: {label}"],
                }
            )
            for child in chunk:
                child["parent"] = bucket_id

    out = dict(meta)
    out["summary"] = (
        f"Cobertura completa: {source_file_count} arquivos de código no repositório "
        f"({len(nodes)} nós na árvore incluindo pastas"
        + (f", {function_nodes} funções/rotas" if function_nodes else "")
        + (f", {stub_nodes} stubs grandes" if stub_nodes else "")
        + ")."
    )
    out["nodes"] = nodes
    out["meta"] = {
        "sourceFiles": source_file_count,
        "treeNodes": len(nodes),
        "functionNodes": function_nodes,
        "stubFiles": stub_nodes,
        "complete": True,
    }
    return out


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    import sys

    only = None
    if "--only" in sys.argv:
        i = sys.argv.index("--only")
        only = sys.argv[i + 1] if i + 1 < len(sys.argv) else None

    total_projects = 0
    for name, single in SOURCE_FILES:
        path = ROOT / name
        data = load_json(path)
        projects = [data] if single else data
        updated = []
        print(f"\n{name}:")
        for project in projects:
            if only and project.get("slug") != only:
                updated.append(project)
                continue
            full = build_project(project)
            updated.append(full)
            meta = full.get("meta", {})
            print(
                f"  {full['slug']}: {meta.get('sourceFiles', '?')} arquivos -> "
                f"{meta.get('treeNodes', '?')} nós"
                + (f" ({meta.get('functionNodes', 0)} funcs)" if meta.get("functionNodes") else "")
                + (f" ({meta.get('stubFiles', 0)} stubs)" if meta.get("stubFiles") else "")
            )
            total_projects += 1
        save_json(path, updated[0] if single else updated)
    print(f"\nProjetos regenerados: {total_projects}")


if __name__ == "__main__":
    main()
