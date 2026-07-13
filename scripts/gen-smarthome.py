#!/usr/bin/env python3
"""Gera scripts/smarthome-project.json — SmartHomeIOT (doutorado / IoT edge)."""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "smarthome-project.json"

# Fonte local do projeto (Desktop) ou clone SmartHomeIOT
CANDIDATES = [
    Path.home() / "Desktop" / "ArduínoProject",
    Path.home() / "Desktop" / "ArduinoProject",
    Path.home() / "Desktop" / "SmartHomeIOT",
]


def find_repo() -> Path | None:
    for p in CANDIDATES:
        if p.is_dir() and (p / "python_server" / "app.py").is_file():
            return p
    return None


def read_file(repo: Path | None, rel: str, fallback: str = "", limit: int = 12000) -> str:
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


def build(repo: Path | None) -> dict:
    r = lambda rel, fb="": read_file(repo, rel, fb)

    nodes = [
        n(
            "smi-root",
            None,
            "root",
            "SmartHomeIOT",
            "Bancada experimental IoT edge para doutorado: Arduino ↔ Raspberry, servos/portas, FastAPI, SQI e Research Lab.",
            "README.md",
            r("README.md", "# SmartHome IoT Platform\nArduino + Raspberry + FastAPI + Research Lab"),
            [
                "Clone: https://github.com/CanonEngineer/SmartHomeIOT",
                "Local: .\\start.ps1 → http://127.0.0.1:8000",
                "Demo: docs/demo/standalone.html",
            ],
        ),
        n(
            "smi-arch",
            "smi-root",
            "module",
            "Arquitetura L1–L5",
            "Camadas de engenharia: percepção, comunicação, edge, serviço e experimentação.",
            "docs/ARCHITECTURE.md",
            r("docs/ARCHITECTURE.md", "# Arquitetura L1-L5"),
            [
                "L1 Percepção/Atuação",
                "L2 MQTT/REST/WebSocket",
                "L3 Raspberry edge",
                "L4 FastAPI + SQLite + telemetria",
                "L5 Research Lab / UI",
            ],
        ),
        n(
            "smi-protocol",
            "smi-root",
            "module",
            "Protocolo v1.0.0",
            "Contratos de mensagem house/* com envelope versionado.",
            "python_server/protocol.py",
            r("python_server/protocol.py", "PROTOCOL_VERSION = '1.0.0'"),
            ["TOPIC_SCHEMA house/*", "Envelope com message_id e qos", "docs/PROTOCOL.md"],
        ),
        n(
            "smi-backend",
            "smi-root",
            "module",
            "Backend FastAPI",
            "Serviço L4: estado, API REST, WebSocket, auth e research endpoints.",
            "python_server/app.py",
            r("python_server/app.py"),
            ["uvicorn app:app", "Static web/ em /static", "Lifespan inicia simulador"],
        ),
        n(
            "smi-app",
            "smi-backend",
            "file",
            "app.py",
            "Bootstrap FastAPI, CORS, MQTT bridge e lifespan do simulador.",
            "python_server/app.py",
            r("python_server/app.py"),
            ["include_router api + research", "FileResponse index.html", "health com protocol"],
        ),
        n(
            "smi-api",
            "smi-backend",
            "file",
            "api.py",
            "Rotas de atuação: LED, relé, servo, porta, cenários e WebSocket.",
            "python_server/api.py",
            r("python_server/api.py"),
            ["POST /api/door|/servo|/led", "WS /api/ws", "Logs e devices"],
        ),
        n(
            "smi-state",
            "smi-backend",
            "file",
            "state.py",
            "HouseState — fonte de verdade em runtime com versionamento e sync.",
            "python_server/state.py",
            r("python_server/state.py"),
            ["actuators + sensors + boards", "broadcast WebSocket", "integra telemetria"],
        ),
        n(
            "smi-telemetry",
            "smi-backend",
            "file",
            "telemetry.py",
            "TelemetryEngine: latência, skew Arduino↔Raspberry e Sync Quality Index.",
            "python_server/telemetry.py",
            r("python_server/telemetry.py"),
            ["SQI = 0.45 skew + 0.30 jitter + 0.25 reliability", "p50/p95", "series_tail"],
        ),
        n(
            "smi-research",
            "smi-backend",
            "file",
            "research_api.py",
            "API científica: overview, experimentos, export CSV/JSON e thesis-brief.",
            "python_server/research_api.py",
            r("python_server/research_api.py"),
            ["/api/research/experiments/run", "export.csv|json", "thesis-brief.md"],
        ),
        n(
            "smi-experiments",
            "smi-research",
            "file",
            "experiments.py",
            "Bancada reproduzível: sync_latency, actuator_response, fault_injection, E2E.",
            "python_server/experiments.py",
            r("python_server/experiments.py"),
            ["Hipóteses por ensaio", "Persiste experiments/exports/", "Métricas no resultado"],
        ),
        n(
            "smi-sim",
            "smi-backend",
            "file",
            "simulator.py",
            "Simulador de sensores e cenários welcome/garage/alarm/night/sync_test.",
            "python_server/simulator.py",
            r("python_server/simulator.py"),
            ["Drift senoidal de sensores", "Heartbeats Arduino/Raspberry", "Sem hardware"],
        ),
        n(
            "smi-db",
            "smi-backend",
            "file",
            "database.py",
            "SQLite + SQLAlchemy: users, devices, sensors, logs; bcrypt nativo.",
            "python_server/database.py",
            r("python_server/database.py"),
            ["init_db dispositivos padrão", "log_action auditoria", "admin/admin123"],
        ),
        n(
            "smi-models",
            "smi-db",
            "file",
            "models.py",
            "Modelos ORM User, Device, SensorReading, ActionLog.",
            "python_server/models.py",
            r("python_server/models.py"),
            ["DeclarativeBase", "timestamps UTC"],
        ),
        n(
            "smi-mqtt",
            "smi-backend",
            "file",
            "mqtt_bridge.py",
            "Ponte MQTT opcional (Mosquitto) — desligada por padrão em simulação.",
            "python_server/mqtt_bridge.py",
            r("python_server/mqtt_bridge.py"),
            ["MQTT_ENABLED=false default", "subscribe house/*", "publish comandos"],
        ),
        n(
            "smi-arduino",
            "smi-root",
            "module",
            "Firmware Arduino/ESP32",
            "Nó L1: sensores DHT/LDR/PIR e atuação LED/relé/servo via MQTT.",
            "arduino/SmartHomeNode/SmartHomeNode.ino",
            r("arduino/SmartHomeNode/SmartHomeNode.ino"),
            ["WiFi + PubSubClient", "Heartbeats house/sync", "arduino/PINOUT.md"],
        ),
        n(
            "smi-ino",
            "smi-arduino",
            "file",
            "SmartHomeNode.ino",
            "Loop de sensores e callback onMessage para house/led|relay|servo|door.",
            "arduino/SmartHomeNode/SmartHomeNode.ino",
            r("arduino/SmartHomeNode/SmartHomeNode.ino"),
            ["GPIO servos 18/19/21", "Relés ativos em LOW", "Publica temp/humidity/light/motion"],
        ),
        n(
            "smi-raspberry",
            "smi-root",
            "module",
            "Agente Raspberry Pi",
            "L3 edge: espelha comandos MQTT/API e envia heartbeat de sincronia.",
            "raspberry/agent.py",
            r("raspberry/agent.py"),
            ["USE_MQTT=0 cai para poll API", "heartbeat /api/heartbeat", "GPIO opcional"],
        ),
        n(
            "smi-agent",
            "smi-raspberry",
            "file",
            "agent.py",
            "Loop MQTT ou espelhamento via GET /api/status.",
            "raspberry/agent.py",
            r("raspberry/agent.py"),
            ["handle_command tópicos house/*", "threading heartbeat", "cleanup GPIO"],
        ),
        n(
            "smi-actuators",
            "smi-raspberry",
            "file",
            "actuators.py",
            "Atuadores locais LED/buzzer/relé/servo/porta (GPIO real ou stub).",
            "raspberry/actuators.py",
            r("raspberry/actuators.py"),
            ["RPi.GPIO se ARM", "Stub em PC", "Porta ligada ao ângulo do servo"],
        ),
        n(
            "smi-web",
            "smi-root",
            "module",
            "Simulador Web + Research Lab",
            "L5: planta da casa, placas, mecanismos e painel de métricas/experimentos.",
            "web/index.html",
            r("web/index.html"),
            ["WebSocket tempo real", "SVG casa + servos/portas", "Experimentos no painel"],
        ),
        n(
            "smi-html",
            "smi-web",
            "file",
            "index.html",
            "Layout do laboratório visual e controles manuais.",
            "web/index.html",
            r("web/index.html"),
            ["Syne + IBM Plex Mono", "Botões LED/porta/cenário", "Canvas latência"],
        ),
        n(
            "smi-js",
            "smi-web",
            "file",
            "script.js",
            "Cliente WS/REST: aplica estado, gráficos e roda experimentos.",
            "web/script.js",
            r("web/script.js"),
            ["connectWs /api/ws", "applyState animação", "POST experiments/run"],
        ),
        n(
            "smi-css",
            "smi-web",
            "file",
            "style.css",
            "Tema de engenharia (teal/amber) e animações de porta/servo.",
            "web/style.css",
            r("web/style.css"),
            ["door-panel.open", "board-flash", "research metrics"],
        ),
        n(
            "smi-demo",
            "smi-web",
            "file",
            "docs/demo/standalone.html",
            "Demo standalone para GitHub Pages / htmlpreview sem backend.",
            "docs/demo/standalone.html",
            r("docs/demo/standalone.html", "<!-- standalone demo -->"),
            ["CSS/JS inline", "Simulação no browser", "Botão do README"],
        ),
        n(
            "smi-java",
            "smi-root",
            "module",
            "Dashboard Java",
            "Cliente desktop Swing consumindo a mesma API REST.",
            "java_client/src/main/java/smarthome/Dashboard.java",
            r("java_client/src/main/java/smarthome/Dashboard.java"),
            ["HttpClient Java 21", "Botões LED/porta/cenário", "Atualização periódica"],
        ),
        n(
            "smi-method",
            "smi-root",
            "module",
            "Metodologia experimental",
            "Perguntas de pesquisa, variáveis, ameaças à validade e entregáveis de tese.",
            "docs/METHODOLOGY.md",
            r("docs/METHODOLOGY.md"),
            ["Ensaios catalogados", "Export CSV/JSON", "SQI como indicador composto"],
        ),
        n(
            "smi-tests",
            "smi-root",
            "file",
            "tests/test_engineering.py",
            "Testes de protocolo, SQI, latência e máquina de estados.",
            "tests/test_engineering.py",
            r("tests/test_engineering.py"),
            ["python tests/test_engineering.py", "Reprodutibilidade"],
        ),
        n(
            "smi-start",
            "smi-root",
            "file",
            "start.ps1",
            "Bootstrap Windows: venv, deps e sobe o servidor.",
            "start.ps1",
            r("start.ps1"),
            ["python -m venv .venv", "pip install -r requirements.txt", "python app.py"],
        ),
    ]

    return {
        "slug": "smarthome-iot",
        "name": "SmartHomeIOT",
        "repoUrl": "https://github.com/CanonEngineer/SmartHomeIOT",
        "color": "#7dd3c0",
        "icon": "python",
        "stack": "Python + Arduino + Raspberry + Java",
        "summary": "Plataforma IoT de doutorado: sync Arduino↔Raspberry, servos/portas, FastAPI, SQI e Research Lab visual.",
        "nodes": nodes,
    }


def main() -> None:
    repo = find_repo()
    project = build(repo)
    OUT.write_text(json.dumps(project, ensure_ascii=False, indent=2), encoding="utf-8")
    src = str(repo) if repo else "(fallback embutido)"
    print(f"SmartHomeIOT: {len(project['nodes'])} nós -> {OUT}")
    print(f"Fonte: {src}")


if __name__ == "__main__":
    main()
