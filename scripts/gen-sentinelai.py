#!/usr/bin/env python3
"""Gera scripts/sentinelai-project.json — SentinelAI NMS platform."""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "sentinelai-project.json"

CANDIDATES = [
    Path.home() / "Desktop" / "SentinelAI",
    Path(__file__).resolve().parent.parent.parent / "SentinelAI",
]


def find_repo() -> Path | None:
    for p in CANDIDATES:
        if p.is_dir() and (p / "backend" / "app" / "main.py").is_file():
            return p
    return None


def read_file(repo: Path | None, rel: str, fallback: str = "", limit: int = 14000) -> str:
    if repo is None:
        return fallback.strip()
    path = repo / rel.replace("/", os.sep)
    if not path.is_file():
        return fallback.strip()
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return fallback.strip()
    if len(text) > limit:
        text = text[:limit] + "\n\n/* … truncado na árvore … */\n"
    return text


def n(nid, parent, layer, title, desc, file, code, impl):
    return {
        "id": nid,
        "parent": parent,
        "layer": layer,
        "title": title,
        "description": desc,
        "file": file,
        "code": code.strip() if isinstance(code, str) else code,
        "implementation": impl if isinstance(impl, list) else [impl],
    }


def build(repo: Path | None) -> dict:
    def r(rel: str, fb: str = "", limit: int = 14000) -> str:
        return read_file(repo, rel, fb, limit)

    nodes = [
        n(
            "sai-root",
            None,
            "root",
            "SentinelAI",
            "Plataforma NMS full-stack: discovery Nmap/SNMP, topologia 2D/3D, monitoramento, alertas e inventário persistente.",
            "README.md",
            r("README.md", "# SentinelAI\nNMS platform"),
            [
                "Repo: https://github.com/CanonEngineer/SentinelAI",
                "Local: docker compose up → http://localhost:5173",
                "API: http://localhost:8000/docs",
                "Login: admin / admin123",
            ],
        ),
        n(
            "sai-arch",
            "sai-root",
            "module",
            "Arquitetura C4",
            "Frontend React + FastAPI + Celery + PostgreSQL + Redis.",
            "docker-compose.yml",
            r("docker-compose.yml", "services: api, worker, discovery-worker, frontend"),
            ["api :8000", "frontend :5173", "discovery-worker fila discovery", "postgres + redis"],
        ),
        n(
            "sai-discovery-api",
            "sai-root",
            "module",
            "API Discovery",
            "Jobs assíncronos de scan, perfis nmap, stop e listagem.",
            "backend/app/api/routes/discovery.py",
            r("backend/app/api/routes/discovery.py"),
            ["POST /api/discovery", "GET /api/discovery/scan-defaults", "Ciclo job ID 1–100"],
        ),
        n(
            "sai-discovery-task",
            "sai-discovery-api",
            "file",
            "discovery_tasks.py",
            "Worker Celery: nmap → inventário → progresso em tempo real.",
            "backend/app/workers/discovery_tasks.py",
            r("backend/app/workers/discovery_tasks.py"),
            ["run_discovery_job", "run_snmp_poll", "run_scheduled_discovery"],
        ),
        n(
            "sai-nmap",
            "sai-discovery-task",
            "file",
            "nmap_scanner.py",
            "Scan SYN/connect, UDP, scripts, timing e perfis configuráveis.",
            "backend/app/engines/discovery/nmap_scanner.py",
            r("backend/app/engines/discovery/nmap_scanner.py"),
            ["scan_subnet_nmap", "ResolvedScanOptions", "ping verify fallback"],
        ),
        n(
            "sai-scan-options",
            "sai-discovery-task",
            "file",
            "scan_options.py",
            "Perfis quick, standard, deep, aggressive e custom.",
            "backend/app/engines/discovery/scan_options.py",
            r("backend/app/engines/discovery/scan_options.py"),
            ["inventory_full_subnet", "ping_verify", "max_inventory_hosts"],
        ),
        n(
            "sai-subnet",
            "sai-discovery-task",
            "file",
            "subnet_scanner.py",
            "ICMP ping em batches quando nmap indisponível.",
            "backend/app/engines/discovery/subnet_scanner.py",
            r("backend/app/engines/discovery/subnet_scanner.py"),
            ["ping_hosts", "scan_subnet async"],
        ),
        n(
            "sai-snmp",
            "sai-discovery-task",
            "file",
            "snmp_collector.py",
            "sysName, sysDescr, interfaces, CPU via SNMP.",
            "backend/app/engines/discovery/snmp_collector.py",
            r("backend/app/engines/discovery/snmp_collector.py"),
            ["collect_snmp_info", "infer_device_type"],
        ),
        n(
            "sai-inventory",
            "sai-discovery-task",
            "file",
            "inventory_service.py",
            "Inventário ativos + inativos em /24, asset history.",
            "backend/app/services/inventory_service.py",
            r("backend/app/services/inventory_service.py"),
            ["process_discovery_results", "upsert_inactive_host", "upsert_discovered_host"],
        ),
        n(
            "sai-discovery-svc",
            "sai-discovery-api",
            "file",
            "discovery_service.py",
            "Prune histórico, cancelamento e ciclo IDs 1–100.",
            "backend/app/services/discovery_service.py",
            r("backend/app/services/discovery_service.py"),
            ["cycle_discovery_job_ids_if_needed", "stop_discovery_job"],
        ),
        n(
            "sai-topology-api",
            "sai-root",
            "module",
            "API Topologia",
            "Grafo, links LLDP/CDP, layout, export PDF/VSDX.",
            "backend/app/api/routes/topology.py",
            r("backend/app/api/routes/topology.py"),
            ["GET /api/topology/graph", "auto-layout", "manual links"],
        ),
        n(
            "sai-topology-svc",
            "sai-topology-api",
            "file",
            "topology_service.py",
            "Montagem do grafo, grupos e camadas do mapa.",
            "backend/app/services/topology_service.py",
            r("backend/app/services/topology_service.py"),
            ["build_topology_graph", "sync links"],
        ),
        n(
            "sai-neighbor",
            "sai-topology-api",
            "file",
            "neighbor_collector.py",
            "Coleta LLDP/CDP via SNMP.",
            "backend/app/engines/topology/neighbor_collector.py",
            r("backend/app/engines/topology/neighbor_collector.py"),
            ["discover_neighbors"],
        ),
        n(
            "sai-devices-api",
            "sai-root",
            "module",
            "API Devices",
            "CRUD, CSV import, enrich, histórico.",
            "backend/app/api/routes/devices.py",
            r("backend/app/api/routes/devices.py"),
            ["GET/POST /api/devices", "import csv", "device history"],
        ),
        n(
            "sai-main",
            "sai-root",
            "file",
            "main.py",
            "Bootstrap FastAPI, CORS, rotas e migrações leves.",
            "backend/app/main.py",
            r("backend/app/main.py"),
            ["ensure_admin_user", "lifespan migrations"],
        ),
        n(
            "sai-models",
            "sai-root",
            "file",
            "models/__init__.py",
            "ORM: Device, DiscoveryJob, NetworkLink, Metric…",
            "backend/app/models/__init__.py",
            r("backend/app/models/__init__.py", "", 8000),
            ["discovery_jobs", "devices_inactive", "scan_options JSONB"],
        ),
        n(
            "sai-dashboard",
            "sai-root",
            "module",
            "Dashboard React",
            "Discovery UI, jobs, KPIs, scan options.",
            "frontend/src/pages/Dashboard.tsx",
            r("frontend/src/pages/Dashboard.tsx"),
            ["Escanear sub-rede", "Total/Ativos/Inativos", "banner progresso"],
        ),
        n(
            "sai-scan-options-ui",
            "sai-dashboard",
            "file",
            "DiscoveryScanOptions.tsx",
            "Painel de perfis nmap e opções avançadas.",
            "frontend/src/components/DiscoveryScanOptions.tsx",
            r("frontend/src/components/DiscoveryScanOptions.tsx"),
            ["quick", "standard", "deep", "aggressive", "custom"],
        ),
        n(
            "sai-job-progress",
            "sai-dashboard",
            "file",
            "DiscoveryJobProgress.tsx",
            "Barra de progresso e banner ativo do scan.",
            "frontend/src/components/DiscoveryJobProgress.tsx",
            r("frontend/src/components/DiscoveryJobProgress.tsx"),
            ["discoveryJobCounts", "DiscoveryJobActiveBanner"],
        ),
        n(
            "sai-topology-map",
            "sai-root",
            "module",
            "Topology Map 2D",
            "React Flow: editor, ELK layout, colaboração WS.",
            "frontend/src/pages/TopologyMap.tsx",
            r("frontend/src/pages/TopologyMap.tsx", "", 12000),
            ["drag-drop", "export PNG/SVG/PDF", "TrafficEdge"],
        ),
        n(
            "sai-map-3d",
            "sai-topology-map",
            "file",
            "Map3DView.tsx",
            "Vista 3D CSS do grafo com altura por status.",
            "frontend/src/components/map/Map3DView.tsx",
            r("frontend/src/components/map/Map3DView.tsx"),
            ["CSS 3D transforms", "links com tráfego"],
        ),
        n(
            "sai-api-client",
            "sai-root",
            "file",
            "client.ts",
            "Cliente HTTP tipado para toda a API.",
            "frontend/src/api/client.ts",
            r("frontend/src/api/client.ts", "", 10000),
            ["startDiscovery", "fetchTopologyGraph", "ScanOptionsPayload"],
        ),
        n(
            "sai-docker",
            "sai-root",
            "file",
            "docker-compose.yml",
            "Stack local: postgres, redis, api, workers, frontend.",
            "docker-compose.yml",
            r("docker-compose.yml"),
            ["discovery-worker queue", "NET_RAW cap", "healthchecks"],
        ),
        n(
            "sai-celery",
            "sai-root",
            "file",
            "celery_app.py",
            "Configuração Celery e filas.",
            "backend/app/workers/celery_app.py",
            r("backend/app/workers/celery_app.py"),
            ["celery", "discovery queues", "beat schedule"],
        ),
        n(
            "sai-alerts",
            "sai-root",
            "module",
            "Alert Engine",
            "Email, Telegram, Slack, Discord, Teams, webhook.",
            "backend/app/engines/alerts/channels.py",
            r("backend/app/engines/alerts/channels.py"),
            ["multicanal", "supressão manutenção"],
        ),
    ]

    return {
        "slug": "sentinelai",
        "name": "SentinelAI",
        "repoUrl": "https://github.com/CanonEngineer/SentinelAI",
        "demoUrl": "http://localhost:5173",
        "color": "#38bdf8",
        "icon": "network",
        "stack": "FastAPI + React + Celery + Nmap + SNMP",
        "summary": "NMS: discovery configurável, inventário /24 ativo+inativo, mapa topologia 2D/3D, monitoramento e alertas.",
        "nodes": nodes,
    }


def main() -> None:
    repo = find_repo()
    project = build(repo)
    OUT.write_text(json.dumps(project, ensure_ascii=False, indent=2), encoding="utf-8")
    src = str(repo) if repo else "(fallback embutido)"
    print(f"SentinelAI: {len(project['nodes'])} nós -> {OUT}")
    print(f"Fonte: {src}")


if __name__ == "__main__":
    main()
