#!/usr/bin/env python3
"""Gera scripts/dangerzone-project.json com árvore densa a partir do repo DangerZone."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "dangerzone-project.json"

CANDIDATES = [
    Path.home() / "Desktop" / "Danger Zone" / "DangerZone-tmp",
    Path.home() / "Desktop" / "DangerZone",
]

SKIP_DIRS = {".git", "__pycache__", ".venv", "venv", "assets"}
SOURCE_EXTS = {".py", ".md"}
MAX_CODE = 14000


def find_repo() -> Path:
    for c in CANDIDATES:
        if (c / "README.md").is_file() and (c / "common").is_dir():
            return c
    raise SystemExit("DangerZone repo não encontrado")


def read(repo: Path, rel: str, limit: int = MAX_CODE) -> str:
    path = repo / rel
    if not path.is_file():
        return f"# ausente: {rel}\n"
    text = path.read_text(encoding="utf-8", errors="replace")
    if len(text) > limit:
        return text[:limit] + "\n\n# … truncado para a árvore …\n"
    return text


def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower()).strip("-")
    return s[:48] or "x"


def n(id_, parent, layer, title, desc, file, code, impl):
    return {
        "id": id_,
        "parent": parent,
        "layer": layer,
        "title": title,
        "description": desc,
        "file": file,
        "code": (code or "").strip(),
        "implementation": impl if isinstance(impl, list) else [impl],
    }


def collect(repo: Path) -> list[Path]:
    files: list[Path] = []
    for p in repo.rglob("*"):
        if not p.is_file():
            continue
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        if p.suffix.lower() not in SOURCE_EXTS:
            continue
        if p.name == "generate_catalog.py":
            continue
        files.append(p)
    return sorted(files, key=lambda x: str(x).lower())


def build(repo: Path) -> dict:
    used: set[str] = set()

    def mid(base: str) -> str:
        bid = f"dz-{slugify(base)}"
        if bid not in used:
            used.add(bid)
            return bid
        i = 2
        while f"{bid}-{i}" in used:
            i += 1
        nid = f"{bid}-{i}"
        used.add(nid)
        return nid

    nodes = [
        n(
            "dz-root",
            None,
            "root",
            "DangerZone",
            "Laboratório educacional: catálogo de pragas, labs, prevenção empresarial e defesa.",
            "README.md",
            read(repo, "README.md", 9000),
            [
                "git clone https://github.com/CanonEngineer/DangerZone.git",
                "Leia DISCLAIMER.md",
                "python demos/run_all_sims.py",
                "python prevention/print_controls.py",
            ],
        )
    ]
    used.add("dz-root")

    # Fixed high-value modules first
    modules = [
        ("dz-common", "common/", "Biblioteca VFS + telemetria segura"),
        ("dz-catalog", "catalog/", "28 famílias ilustrativas não funcionais"),
        ("dz-labs-sim", "labs/sims", "Labs 01–05 e 10–19 (simulação)"),
        ("dz-labs-def", "labs/defense", "Labs 06–09 defesa + 20 hardening"),
        ("dz-docs", "docs/", "Catálogo, kill chain, prevenção, risco"),
        ("dz-conference", "conference/", "Roteiro e talking points"),
        ("dz-prevention", "prevention/", "Controles empresariais imprimíveis"),
        ("dz-demos", "demos/", "Pipeline da palestra"),
    ]
    for mid_, title, desc in modules:
        nodes.append(
            n(mid_, "dz-root", "module", title, desc, title.split("/")[0] + "/", f"# módulo {title}", [
                "Explore os nós filhos na árvore.",
                "Todo código ofensivo é ilustrativo/não funcional.",
            ])
        )
        used.add(mid_)

    # Map top-level folder -> module id
    folder_map = {
        "common": "dz-common",
        "catalog": "dz-catalog",
        "docs": "dz-docs",
        "conference": "dz-conference",
        "prevention": "dz-prevention",
        "demos": "dz-demos",
        "DISCLAIMER.md": "dz-root",
        "README.md": "dz-root",
        "requirements.txt": "dz-root",
    }

    def parent_for(rel: Path) -> str:
        parts = rel.parts
        if parts[0] == "labs":
            name = parts[1] if len(parts) > 1 else ""
            num = name.split("_")[0] if name else ""
            try:
                nlab = int(num)
            except ValueError:
                nlab = 0
            if nlab in {6, 7, 8, 9, 20} or name.startswith("06") or name.startswith("07") or name.startswith("08") or name.startswith("09") or name.startswith("20"):
                return "dz-labs-def"
            return "dz-labs-sim"
        if parts[0] in folder_map:
            return folder_map[parts[0]]
        return "dz-root"

    # Group labs into submodules for clarity
    lab_dirs = sorted({p.parts[1] for p in collect(repo) if len(p.relative_to(repo).parts) > 1 and p.relative_to(repo).parts[0] == "labs"})
    lab_module_ids: dict[str, str] = {}
    for lab in lab_dirs:
        num = lab.split("_")[0]
        try:
            nlab = int(num)
        except ValueError:
            nlab = 0
        parent = "dz-labs-def" if nlab in {6, 7, 8, 9, 20} else "dz-labs-sim"
        lid = mid(f"lab-{lab}")
        lab_module_ids[lab] = lid
        nodes.append(
            n(
                lid,
                parent,
                "module",
                lab,
                f"Laboratório educacional {lab}",
                f"labs/{lab}/",
                f"# {lab}\n# Ver arquivos .py e README neste nó.",
                [f"cd labs/{lab}", "python *.py"],
            )
        )

    for path in collect(repo):
        rel = path.relative_to(repo)
        rel_s = str(rel).replace("\\", "/")
        if rel_s in ("README.md",):
            # already on root
            continue
        if rel.parts[0] == "labs" and len(rel.parts) >= 2:
            parent = lab_module_ids.get(rel.parts[1], parent_for(rel))
        else:
            parent = parent_for(rel)

        layer = "file"
        title = path.name
        desc = f"Arquivo educacional `{rel_s}` — risco/conceito/prevenção."
        if path.suffix == ".md":
            desc = f"Documentação: {path.stem.replace('_', ' ')}"
        elif path.name.startswith("simulate_") or path.name.startswith("ILLUSTRATIVE") or "ILLUSTRATIVE" in path.read_text(encoding="utf-8", errors="ignore")[:500]:
            desc = f"Ilustração não funcional: {path.stem}"

        # functions for python files with def
        code = read(repo, rel_s)
        nid = mid(rel_s.replace("/", "-").replace(".", "-"))
        nodes.append(
            n(
                nid,
                parent,
                layer,
                title,
                desc,
                rel_s,
                code,
                [
                    f"Abra `{rel_s}` no repositório.",
                    "Execute apenas scripts educacionais deste repo.",
                    "Use prevention/print_controls.py para ver controles.",
                ],
            )
        )

        if path.suffix == ".py":
            text = path.read_text(encoding="utf-8", errors="ignore")
            for m in re.finditer(r"^def (ILLUSTRATIVE_\w+|\w+)\(", text, flags=re.M):
                fn = m.group(1)
                if fn in {"main", "explain", "render", "load", "run", "n", "read", "find_repo", "collect", "build", "slugify", "mid", "parent_for"}:
                    continue
                if fn.startswith("_"):
                    continue
                # limit function nodes to illustrative / key APIs
                if not (
                    fn.startswith("ILLUSTRATIVE_")
                    or fn.startswith("simulate_")
                    or fn in {
                        "demo_host", "mark_infected", "emit", "match", "baseline",
                        "score_file", "scan_vfs", "lock_docs", "recover", "xor_bytes",
                    }
                ):
                    continue
                fid = mid(f"{rel_s}-{fn}")
                # extract small snippet
                snippet = f"# função {fn} em {rel_s}\n"
                start = m.start()
                snippet += text[start : start + 400]
                nodes.append(
                    n(
                        fid,
                        nid,
                        "function",
                        f"{fn}()",
                        f"Função ilustrativa/defensiva `{fn}`",
                        rel_s,
                        snippet,
                        ["Estude o corpo da função no arquivo pai.", "Nada aqui deve ser usado ofensivamente."],
                    )
                )

    return {
        "slug": "danger-zone",
        "name": "DangerZone",
        "color": "#ef4444",
        "icon": "scanner",
        "stack": "Python · Cybersecurity Labs",
        "summary": "Catálogo de pragas virtuais, labs não funcionais e prevenção empresarial para conferências de cibersegurança.",
        "repoUrl": "https://github.com/CanonEngineer/DangerZone",
        "nodes": nodes,
    }


def main() -> None:
    repo = find_repo()
    project = build(repo)
    OUT.write_text(json.dumps(project, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK {project['name']}: {len(project['nodes'])} nós -> {OUT}")


if __name__ == "__main__":
    main()
