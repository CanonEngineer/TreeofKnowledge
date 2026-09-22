#!/usr/bin/env python3
"""Gera scripts/sentinelai-project.json com TODOS os arquivos de código do SentinelAI.

Árvore 2D + Galaxy 3D — cobertura completa do repositório (não curadoria parcial).
"""
from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "sentinelai-project.json"

CANDIDATES = [
    Path.home() / "Desktop" / "SentinelAI",
    Path(__file__).resolve().parent.parent.parent / "SentinelAI",
]

SKIP_DIRS = {
    ".git",
    ".work",
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
    "zionvm_stores",
    "postgres_data",
    "reports_data",
}

SKIP_FILES = {
    "package-lock.json",
    "celerybeat-schedule",
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
    ".cmd",
    ".iss",
    ".sh",
    ".sql",
    ".html",
    ".vue",
    ".dockerfile",
}

MAX_FILE_BYTES = 1_500_000
CODE_LIMIT = 7000
# Pastas com muitos arquivos viram subgrupos — evita fan-out que quebra layout 2D/3D
MAX_DIRECT_FILES = 12


def find_repo() -> Path | None:
    for p in CANDIDATES:
        if p.is_dir() and (p / "backend" / "app" / "main.py").is_file():
            return p
    return None


def path_id(rel: str, *, is_dir: bool = False) -> str:
    """ID estável a partir do caminho relativo."""
    s = rel.replace("\\", "/").strip("/")
    if not s:
        return "sai-root"
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    prefix = "sai-dir-" if is_dir else "sai-file-"
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
        if p.name.startswith(SKIP_NAME_PREFIXES) and p.name not in {".env.example", ".gitignore", ".cursorignore", ".nojekyll"}:
            # allow listed dotfiles that are project config
            if not p.name.startswith(".env") and p.name not in {".gitignore", ".cursorignore", ".dockerignore"}:
                if p.name.startswith("."):
                    # still skip most dotfiles except allowlist
                    if p.name not in {".gitignore", ".cursorignore", ".dockerignore", ".env.example"}:
                        continue
        if p.name.startswith("tmp_"):
            continue
        suf = p.suffix.lower()
        if p.name.lower() == "dockerfile":
            suf = ".dockerfile"
        if suf not in CODE_EXTS and p.name not in {".gitignore", ".cursorignore", ".dockerignore", ".env.example"}:
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
    dir_ids: dict[str, str] = {"": "sai-root"}

    readme = repo / "README.md"
    readme_code = read_code(repo, "README.md", limit=12000) if readme.is_file() else "# SentinelAI\n"
    nodes.append(
        {
            "id": "sai-root",
            "parent": None,
            "layer": "root",
            "title": "SentinelAI",
            "description": (
                f"Árvore completa do repositório — {len(files)} arquivos de código mapeados "
                "(backend, frontend, mobile, docs, scripts, deploy). "
                "Estabilização Fases 1–8 + 9b (credenciais, wallboard, agent lab, CMDB, SLA, NetFlow UI)."
            ),
            "file": "README.md",
            "code": readme_code,
            "implementation": [
                "Repo: https://github.com/CanonEngineer/SentinelAI",
                f"Arquivos na árvore: {len(files)}",
                "2D + Galaxy 3D — cobertura total do código-fonte",
                "CHANGELOG v2.2 · docs/UPGRADE-v2.2.md",
                "docker compose up → http://localhost:5173",
            ],
        }
    )
    seen_ids.add("sai-root")

    # Diretórios que contêm arquivos
    dirs_needed: set[str] = set()
    for f in files:
        rel = f.relative_to(repo).as_posix()
        parent = str(Path(rel).parent).replace("\\", "/")
        if parent == ".":
            parent = ""
        # all ancestors
        parts = parent.split("/") if parent else []
        acc = []
        for part in parts:
            acc.append(part)
            dirs_needed.add("/".join(acc))

    # Criar módulos de diretório (profundidade crescente)
    for drel in sorted(dirs_needed, key=lambda s: (s.count("/"), s.lower())):
        did = path_id(drel, is_dir=True)
        parent_path = str(Path(drel).parent).replace("\\", "/")
        if parent_path == ".":
            parent_path = ""
        parent_id = dir_ids.get(parent_path, "sai-root")
        # evitar colisão
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
                "description": f"Pacote/pasta `{drel}/` do SentinelAI.",
                "file": drel + "/",
                "code": f"# Diretório: {drel}/\n# Contém arquivos e subpastas do projeto.\n",
                "implementation": [f"path: {drel}/", "nó de agrupamento na árvore"],
            }
        )

    # Arquivos (agrupa quando pasta tem muitos filhos diretos)
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
        gid = unique_id(path_id(f"{parent_path}/{slug}" if parent_path else slug, is_dir=True).replace("sai-dir-", "sai-grp-"))
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
        parent_id = dir_ids.get(parent_path, "sai-root")

        if len(flist) <= MAX_DIRECT_FILES:
            targets = [(parent_id, f) for f in flist]
        else:
            # Preferir grupos por letra inicial; se ainda > MAX, fatiar
            by_letter: dict[str, list[Path]] = defaultdict(list)
            for f in flist:
                ch = f.name[0].upper()
                key = ch if ch.isalpha() else "#"
                by_letter[key].append(f)

            targets = []
            # Mesclar letras pequenas até ~MAX_DIRECT_FILES
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
                        f"GitHub: https://github.com/CanonEngineer/SentinelAI/blob/main/{rel}",
                    ],
                }
            )

    return {
        "slug": "sentinelai",
        "name": "SentinelAI",
        "repoUrl": "https://github.com/CanonEngineer/SentinelAI",
        "demoUrl": "http://localhost:5173",
        "color": "#38bdf8",
        "icon": "network",
        "stack": "FastAPI + React + Celery + Nmap + SNMP + WMI + ZionVM + ZionXDR",
        "summary": (
            f"Cobertura completa: {len(files)} arquivos de código no repositório "
            f"({len(nodes)} nós na árvore incluindo pastas). "
            "Plataforma NMS v2.8+ — Zion hub, mapa 2D/3D, backup, ZionVM (hypervisor Proxmox-like), "
            "ZionXDR (endpoints, telemetria, Eagle bridge), MFA TOTP e instalador on-prem."
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
        raise SystemExit("Repositório SentinelAI não encontrado (Desktop/SentinelAI).")
    project = build(repo)
    OUT.write_text(json.dumps(project, ensure_ascii=False, indent=2), encoding="utf-8")
    size_mb = OUT.stat().st_size / (1024 * 1024)
    print(f"SentinelAI: {project['meta']['treeNodes']} nos ({project['meta']['sourceFiles']} arquivos)")
    print(f"JSON: {OUT} ({size_mb:.2f} MB)")
    print(f"Fonte: {repo}")


if __name__ == "__main__":
    main()
