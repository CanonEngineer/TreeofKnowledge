#!/usr/bin/env python3
"""Gera scripts/dangerzone-project.json a partir do repositório DangerZone."""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "dangerzone-project.json"

# Prefer clone local usado nesta sessão; fallback Desktop/DangerZone
CANDIDATES = [
    Path.home() / "Desktop" / "Danger Zone" / "DangerZone-tmp",
    Path.home() / "Desktop" / "DangerZone",
]


def find_repo() -> Path:
    for c in CANDIDATES:
        if (c / "README.md").is_file() and (c / "common").is_dir():
            return c
    raise SystemExit("DangerZone repo não encontrado nos caminhos esperados.")


def read(repo: Path, rel: str, limit: int = 12000) -> str:
    path = repo / rel
    if not path.is_file():
        return f"# arquivo ausente: {rel}\n"
    text = path.read_text(encoding="utf-8", errors="replace")
    if len(text) > limit:
        return text[:limit] + "\n\n# … truncado para a árvore …\n"
    return text


def n(id, parent, layer, title, desc, file, code, impl):
    return {
        "id": id,
        "parent": parent,
        "layer": layer,
        "title": title,
        "description": desc,
        "file": file,
        "code": code.strip() if isinstance(code, str) else code,
        "implementation": impl if isinstance(impl, list) else [impl],
    }


def build(repo: Path) -> dict:
    nodes = [
        n(
            "dz-root",
            None,
            "root",
            "DangerZone",
            "Laboratório educacional de malware ilustrativo + defesa (VFS, telemetria, IOCs).",
            "README.md",
            read(repo, "README.md", 8000),
            [
                "Clone: git clone https://github.com/CanonEngineer/DangerZone.git",
                "Leia DISCLAIMER.md antes de qualquer demo.",
                "python demos/run_all_sims.py",
            ],
        ),
        n(
            "dz-common",
            "dz-root",
            "module",
            "common/",
            "Biblioteca compartilhada: VFS, telemetria e banner.",
            "common/",
            read(repo, "common/__init__.py"),
            ["Importe via sys.path a partir da raiz do repo.", "Nada toca o disco real do SO."],
        ),
        n(
            "dz-vfs",
            "dz-common",
            "file",
            "virtual_fs.py",
            "Filesystem 100% em memória para simular infecção com segurança.",
            "common/virtual_fs.py",
            read(repo, "common/virtual_fs.py"),
            ["Use VirtualFileSystem.demo_host() nas demos.", "mark_infected() só altera nós virtuais."],
        ),
        n(
            "dz-vfs-demo",
            "dz-vfs",
            "function",
            "demo_host()",
            "Monta um 'PC' fictício com /opt/apps e /home/user/docs.",
            "common/virtual_fs.py",
            "@classmethod\ndef demo_host(cls):\n    vfs = cls()\n    # cria pastas e arquivos saudáveis\n    return vfs",
            ["Chame no início de cada lab ofensivo simulado."],
        ),
        n(
            "dz-telemetry",
            "dz-common",
            "file",
            "telemetry.py",
            "Barramento de eventos JSON para o SOC didático.",
            "common/telemetry.py",
            read(repo, "common/telemetry.py"),
            ["bus.emit(category, action, target, detail, severity)", "dump_json() grava em demos/"],
        ),
        n(
            "dz-banner",
            "dz-common",
            "file",
            "banner.py",
            "Cabeçalho padrão avisando que é simulação educacional.",
            "common/banner.py",
            read(repo, "common/banner.py"),
            ["Sempre chame print_banner() no main dos labs."],
        ),
        n(
            "dz-sims",
            "dz-root",
            "module",
            "Labs 01–05 · Simulação",
            "Famílias clássicas ilustradas sem malware funcional.",
            "labs/",
            "# Sims educacionais\n# 01 vírus · 02 worm · 03 trojan · 04 ransomware · 05 spyware",
            ["Rode individualmente ou via demos/run_all_sims.py."],
        ),
        n(
            "dz-virus",
            "dz-sims",
            "file",
            "simulate_virus.py",
            "Ciclo de vida: entrada → varredura → marcador no VFS.",
            "labs/01_virus_lifecycle/simulate_virus.py",
            read(repo, "labs/01_virus_lifecycle/simulate_virus.py"),
            ["python labs/01_virus_lifecycle/simulate_virus.py", "Observe virus.infect na telemetria."],
        ),
        n(
            "dz-virus-fn",
            "dz-virus",
            "function",
            "simulate_virus()",
            "Anexa marcador DZ-EDU-VIRUS-MARKER em .py virtuais.",
            "labs/01_virus_lifecycle/simulate_virus.py",
            "def simulate_virus(vfs, bus, target_ext='.py'):\n    for node in vfs.list_files('/opt/apps'):\n        vfs.mark_infected(node.path, MARKER)",
            ["Compare hashes no Lab 07 após rodar este."],
        ),
        n(
            "dz-worm",
            "dz-sims",
            "file",
            "simulate_worm.py",
            "Propagação lateral como BFS em grafo fictício.",
            "labs/02_worm_propagation/simulate_worm.py",
            read(repo, "labs/02_worm_propagation/simulate_worm.py"),
            ["Não abre sockets.", "Explique segmentação de rede na palestra."],
        ),
        n(
            "dz-worm-fn",
            "dz-worm",
            "function",
            "simulate_worm()",
            "Fila BFS a partir do paciente zero host-A.",
            "labs/02_worm_propagation/simulate_worm.py",
            "def simulate_worm(seed, bus, max_hops=4):\n    queue = deque([(seed, 0)])\n    ...",
            ["Mostre o diagrama host-A → F nos slides."],
        ),
        n(
            "dz-trojan",
            "dz-sims",
            "file",
            "simulate_trojan.py",
            "Fachada legítima + payload oculto só em telemetria.",
            "labs/03_trojan_behavior/simulate_trojan.py",
            read(repo, "labs/03_trojan_behavior/simulate_trojan.py"),
            ["Destaque dualidade UI × ações maliciosas tipificadas."],
        ),
        n(
            "dz-ransom",
            "dz-sims",
            "file",
            "simulate_ransomware.py",
            "XOR educacional no VFS com recuperação imediata.",
            "labs/04_ransomware_concept/simulate_ransomware.py",
            read(repo, "labs/04_ransomware_concept/simulate_ransomware.py"),
            ["Nunca rode ideias de ransomware fora do VFS.", "Backup imutável = defesa real."],
        ),
        n(
            "dz-spyware",
            "dz-sims",
            "file",
            "simulate_spyware.py",
            "Eventos de coleta abusiva sem capturar dados reais.",
            "labs/05_spyware_telemetry/simulate_spyware.py",
            read(repo, "labs/05_spyware_telemetry/simulate_spyware.py"),
            ["Domínios *.invalid de propósito."],
        ),
        n(
            "dz-defense",
            "dz-root",
            "module",
            "Labs 06–09 · Defesa",
            "IOC, integridade, comportamento e assinaturas.",
            "labs/",
            "# Defesa consome telemetria dos sims",
            ["Sempre rode sims antes do detector."],
        ),
        n(
            "dz-ioc",
            "dz-defense",
            "file",
            "detector.py",
            "Regras defensivas sobre telemetry_*.json.",
            "labs/06_ioc_detector/detector.py",
            read(repo, "labs/06_ioc_detector/detector.py"),
            ["python labs/06_ioc_detector/detector.py", "Gera demos/alerts.json"],
        ),
        n(
            "dz-hash",
            "dz-defense",
            "file",
            "integrity.py",
            "Baseline SHA-256 antes/depois da infecção virtual.",
            "labs/07_hash_integrity/integrity.py",
            read(repo, "labs/07_hash_integrity/integrity.py"),
            ["Mostre diff de hashes na tela."],
        ),
        n(
            "dz-behavior",
            "dz-defense",
            "file",
            "analyzer.py",
            "Score por ações (exfil, encrypt, infect…).",
            "labs/08_behavioral_analyzer/analyzer.py",
            read(repo, "labs/08_behavioral_analyzer/analyzer.py"),
            ["Vereditos: BENIGN / SUSPICIOUS / MALICIOUS (simulado)."],
        ),
        n(
            "dz-yara",
            "dz-defense",
            "file",
            "pattern_scanner.py",
            "Scanner estilo YARA com regras textuais simples.",
            "labs/09_yara_like_scanner/pattern_scanner.py",
            read(repo, "labs/09_yara_like_scanner/pattern_scanner.py"),
            ["Introdução didática a matching de assinaturas."],
        ),
        n(
            "dz-demos",
            "dz-root",
            "module",
            "demos/",
            "Pipeline único da conferência.",
            "demos/run_all_sims.py",
            read(repo, "demos/run_all_sims.py"),
            ["python demos/run_all_sims.py", "Roda sims + defesa em sequência."],
        ),
        n(
            "dz-docs",
            "dz-root",
            "module",
            "docs/ + conference/",
            "Taxonomia, kill chain, outline e talking points.",
            "conference/outline.md",
            read(repo, "conference/outline.md"),
            ["Use outline.md como roteiro de 35–45 min."],
        ),
        n(
            "dz-disclaimer",
            "dz-root",
            "file",
            "DISCLAIMER.md",
            "Aviso ético e legal — mostre no início da palestra.",
            "DISCLAIMER.md",
            read(repo, "DISCLAIMER.md"),
            ["Sempre abrir a talk com este arquivo."],
        ),
    ]

    return {
        "slug": "danger-zone",
        "name": "DangerZone",
        "color": "#ef4444",
        "icon": "scanner",
        "stack": "Python · Labs educacionais",
        "summary": "Estudo defensivo de malware com VFS, telemetria e detecção — sem código ofensivo real.",
        "repoUrl": "https://github.com/CanonEngineer/DangerZone",
        "nodes": nodes,
    }


def main() -> None:
    repo = find_repo()
    project = build(repo)
    OUT.write_text(json.dumps(project, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK {project['name']}: {len(project['nodes'])} nós -> {OUT}")
    print(f"Fonte: {repo}")


if __name__ == "__main__":
    main()
