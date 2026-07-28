#!/usr/bin/env python3
"""Gera scripts/eagle-project.json com TODOS os arquivos de código do EagleOffensivePlatform.

Árvore 2D + Galaxy 3D — cobertura completa do repositório (não curadoria parcial).
"""
from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "eagle-project.json"

CANDIDATES = [
    Path.home() / "Desktop" / "Eagle destroys",
    Path.home() / "Desktop" / "EagleOffensivePlatform",
    Path(__file__).resolve().parent.parent.parent / "EagleOffensivePlatform",
]

SKIP_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "dist",
    "build",
    "backups",
    ".cursor",
    "reports",
    ".pytest_cache",
    ".mypy_cache",
    "htmlcov",
    ".eggs",
    "coverage",
    "logs",
    "quarantine",
}

SKIP_FILES = {
    "package-lock.json",
    ".DS_Store",
    "Thumbs.db",
}

SKIP_NAME_PREFIXES = ("tmp_", ".")

CODE_EXTS = {
    ".py",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".css",
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
    ".svg",
    ".dockerfile",
}

MAX_FILE_BYTES = 1_500_000
CODE_LIMIT = 7000
MAX_DIRECT_FILES = 12

REPO_URL = "https://github.com/CanonEngineer/EagleOffensivePlatform"


def find_repo() -> Path | None:
    for p in CANDIDATES:
        if p.is_dir() and (p / "agent" / "eagle" / "__init__.py").is_file():
            return p
    return None


def path_id(rel: str, *, is_dir: bool = False) -> str:
    s = rel.replace("\\", "/").strip("/")
    if not s:
        return "eop-root"
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    prefix = "eop-dir-" if is_dir else "eop-file-"
    return (prefix + s)[:120]


def read_code(repo: Path, rel: str, limit: int = CODE_LIMIT) -> str:
    path = repo / rel.replace("/", os.sep)
    if not path.is_file():
        return f"# Arquivo não encontrado: {rel}\n"
    try:
        raw = path.read_bytes()
    except OSError as exc:
        return f"# Erro ao ler {rel}: {exc}\n"
    if len(raw) > MAX_FILE_BYTES:
        return f"# Arquivo grande demais para embutir na árvore ({len(raw)} bytes): {rel}\n"
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("utf-8", errors="replace")
    if len(text) > limit:
        text = text[:limit] + "\n\n/* … truncado na árvore (arquivo completo no GitHub) … */\n"
    return text


def collect_files(repo: Path) -> list[Path]:
    files: list[Path] = []
    for p in repo.rglob("*"):
        if not p.is_file():
            continue
        rel_parts = p.relative_to(repo).parts
        if any(part in SKIP_DIRS for part in rel_parts):
            continue
        if p.name in SKIP_FILES:
            continue
        if p.name.startswith(SKIP_NAME_PREFIXES) and p.name not in {
            ".env.example",
            ".gitignore",
            ".cursorignore",
            ".nojekyll",
        }:
            if not p.name.startswith(".env") and p.name not in {
                ".gitignore",
                ".cursorignore",
                ".dockerignore",
            }:
                if p.name.startswith("."):
                    if p.name not in {".gitignore", ".cursorignore", ".dockerignore", ".env.example"}:
                        continue
        if p.name.startswith("tmp_"):
            continue
        suf = p.suffix.lower()
        if p.name.lower() == "dockerfile":
            suf = ".dockerfile"
        if suf not in CODE_EXTS and p.name not in {
            ".gitignore",
            ".cursorignore",
            ".dockerignore",
            ".env.example",
        }:
            continue
        try:
            if p.stat().st_size > MAX_FILE_BYTES:
                continue
        except OSError:
            continue
        files.append(p)
    return sorted(files, key=lambda x: x.as_posix().lower())


def build(repo: Path) -> dict:
    files = collect_files(repo)
    nodes: list[dict] = []
    seen_ids: set[str] = set()
    dir_ids: dict[str, str] = {"": "eop-root"}

    readme = repo / "README.md"
    readme_code = read_code(repo, "README.md", limit=12000) if readme.is_file() else "# EagleOffensivePlatform\n"
    nodes.append(
        {
            "id": "eop-root",
            "parent": None,
            "layer": "root",
            "title": "EagleOffensivePlatform",
            "description": (
                f"Árvore completa do repositório — {len(files)} arquivos de código mapeados "
                "(agent, console, docs, landing, config)."
            ),
            "file": "README.md",
            "code": readme_code,
            "implementation": [
                f"Repo: {REPO_URL}",
                f"Arquivos na árvore: {len(files)}",
                "2D + Galaxy 3D — cobertura total do código-fonte",
                "python -m eagle console → http://127.0.0.1:8787",
            ],
        }
    )
    seen_ids.add("eop-root")

    dirs_needed: set[str] = set()
    for f in files:
        rel = f.relative_to(repo).as_posix()
        parent = str(Path(rel).parent).replace("\\", "/")
        if parent == ".":
            parent = ""
        parts = parent.split("/") if parent else []
        acc = []
        for part in parts:
            acc.append(part)
            dirs_needed.add("/".join(acc))

    for drel in sorted(dirs_needed, key=lambda s: (s.count("/"), s.lower())):
        did = path_id(drel, is_dir=True)
        parent_path = str(Path(drel).parent).replace("\\", "/")
        if parent_path == ".":
            parent_path = ""
        parent_id = dir_ids.get(parent_path, "eop-root")
        base = did
        n = 2
        while did in seen_ids:
            did = f"{base}-{n}"
            n += 1
        dir_ids[drel] = did
        seen_ids.add(did)
        title = Path(drel).name
        nodes.append(
            {
                "id": did,
                "parent": parent_id,
                "layer": "module",
                "title": f"{title}/",
                "description": f"Pacote/pasta `{drel}/` do EagleOffensivePlatform.",
                "file": drel + "/",
                "code": f"# Diretório: {drel}/\n# Contém arquivos e subpastas do projeto.\n",
                "implementation": [f"path: {drel}/", "nó de agrupamento na árvore"],
            }
        )

    files_by_dir: dict[str, list[Path]] = defaultdict(list)
    for f in files:
        rel = f.relative_to(repo).as_posix()
        if rel == "README.md":
            continue
        parent_path = str(Path(rel).parent).replace("\\", "/")
        if parent_path == ".":
            parent_path = ""
        files_by_dir[parent_path].append(f)

    def unique_id(candidate: str) -> str:
        base = candidate
        n = 2
        out = candidate
        while out in seen_ids:
            out = f"{base}-{n}"
            n += 1
        seen_ids.add(out)
        return out

    def ensure_group(parent_path: str, parent_id: str, label: str, slug: str) -> str:
        gid = unique_id(
            path_id(f"{parent_path}/{slug}" if parent_path else slug, is_dir=True).replace(
                "eop-dir-", "eop-grp-"
            )
        )
        nodes.append(
            {
                "id": gid,
                "parent": parent_id,
                "layer": "module",
                "title": label,
                "description": f"Grupo de arquivos em `{parent_path or '.'}/` — {label}",
                "file": (parent_path + "/" if parent_path else "") + f"[{slug}]",
                "code": f"# Grupo: {label}\n# Pasta: {parent_path or '.'}/\n",
                "implementation": ["agrupamento para layout 2D/3D", f"pasta: {parent_path or '.'}/"],
            }
        )
        return gid

    for parent_path, flist in sorted(files_by_dir.items(), key=lambda x: x[0].lower()):
        flist = sorted(flist, key=lambda p: p.name.lower())
        parent_id = dir_ids.get(parent_path, "eop-root")

        if len(flist) <= MAX_DIRECT_FILES:
            targets = [(parent_id, f) for f in flist]
        else:
            by_letter: dict[str, list[Path]] = defaultdict(list)
            for f in flist:
                ch = f.name[0].upper()
                key = ch if ch.isalpha() else "#"
                by_letter[key].append(f)

            targets = []
            buckets: list[tuple[str, list[Path]]] = []
            cur_label_parts: list[str] = []
            cur_files: list[Path] = []
            for letter in sorted(by_letter.keys()):
                chunk = by_letter[letter]
                if cur_files and len(cur_files) + len(chunk) > MAX_DIRECT_FILES:
                    buckets.append(("–".join(cur_label_parts), cur_files))
                    cur_label_parts, cur_files = [], []
                cur_label_parts.append(letter)
                cur_files.extend(chunk)
            if cur_files:
                buckets.append(("–".join(cur_label_parts), cur_files))

            for label, chunk in buckets:
                if len(chunk) <= MAX_DIRECT_FILES:
                    gid = ensure_group(parent_path, parent_id, f"Arquivos {label}", f"files-{label.lower()}")
                    targets.extend((gid, f) for f in chunk)
                else:
                    for i in range(0, len(chunk), MAX_DIRECT_FILES):
                        part = chunk[i : i + MAX_DIRECT_FILES]
                        lo, hi = i + 1, i + len(part)
                        gid = ensure_group(
                            parent_path,
                            parent_id,
                            f"Arquivos {label} ({lo}–{hi})",
                            f"files-{label.lower()}-{lo}-{hi}",
                        )
                        targets.extend((gid, f) for f in part)

        for file_parent_id, f in targets:
            rel = f.relative_to(repo).as_posix()
            fid = unique_id(path_id(rel, is_dir=False))
            title = Path(rel).name
            nodes.append(
                {
                    "id": fid,
                    "parent": file_parent_id,
                    "layer": "file",
                    "title": title,
                    "description": f"Código-fonte: `{rel}`",
                    "file": rel,
                    "code": read_code(repo, rel),
                    "implementation": [
                        f"path: {rel}",
                        f"GitHub: {REPO_URL}/blob/main/{rel}",
                    ],
                }
            )

    return {
        "slug": "eagle-offensive-platform",
        "name": "EagleOffensivePlatform",
        "repoUrl": REPO_URL,
        "demoUrl": "http://127.0.0.1:8787",
        "color": "#c45c26",
        "icon": "shield",
        "stack": "Python + psutil + YAML + HTTP Console",
        "summary": (
            f"Cobertura completa: {len(files)} arquivos de código no repositório "
            f"({len(nodes)} nós na árvore incluindo pastas)."
        ),
        "nodes": nodes,
        "meta": {
            "sourceFiles": len(files),
            "treeNodes": len(nodes),
            "complete": True,
        },
    }


def main() -> None:
    repo = find_repo()
    if not repo:
        raise SystemExit(
            "Repositório EagleOffensivePlatform não encontrado "
            "(Desktop/Eagle destroys ou Desktop/EagleOffensivePlatform)."
        )
    project = build(repo)
    OUT.write_text(json.dumps(project, ensure_ascii=False, indent=2), encoding="utf-8")
    size_mb = OUT.stat().st_size / (1024 * 1024)
    print(f"EagleOffensivePlatform: {project['meta']['treeNodes']} nos ({project['meta']['sourceFiles']} arquivos)")
    print(f"JSON: {OUT} ({size_mb:.2f} MB)")
    print(f"Fonte: {repo}")


if __name__ == "__main__":
    main()
