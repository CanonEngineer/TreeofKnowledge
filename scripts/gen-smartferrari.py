#!/usr/bin/env python3
"""Gera scripts/smartferrari-project.json — árvore SmartFerrariIOT."""
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "smartferrari-project.json")


def n(id, parent, layer, title, desc, file, code, impl):
    return {
        "id": id,
        "parent": parent,
        "layer": layer,
        "title": title,
        "description": desc,
        "file": file,
        "code": code.strip(),
        "implementation": impl if isinstance(impl, list) else [impl],
    }


NODES = [
n("sf-root", None, "root", "SmartFerrariIOT",
  "Lab de pós em Engenharia da Computação: gêmeo digital Ferrari, sync Arduino↔Raspberry, HIL/QoS, Web Audio e Research Lab (Demo GitHub Pages + local :8001).",
  "README.md",
  "// SmartFerrariIOT\n// Demo: https://canonengineer.github.io/SmartFerrariIOT/demo/standalone.html\n// Local: http://127.0.0.1:8001\n// Repo: https://github.com/CanonEngineer/SmartFerrariIOT",
  [
    "Clone: https://github.com/CanonEngineer/SmartFerrariIOT",
    "Demo online: https://canonengineer.github.io/SmartFerrariIOT/demo/standalone.html",
    "Local: .\\start.ps1 → http://127.0.0.1:8001 (admin / ferrari123)",
  ]),

# --- Server ---
n("sf-server", "sf-root", "module", "python_server",
  "Orquestração FastAPI :8001 — estado, MQTT, telemetria SQI, research API.",
  "python_server/",
  "# FastAPI app + twin + HIL + security",
  ["Crie venv e pip install -r requirements.txt.", "python app.py na pasta python_server.", "Porta 8001 (SmartHomeIOT usa 8000)."]),

n("sf-app", "sf-server", "file", "app.py",
  "Entry point FastAPI: lifespan MQTT, rotas API/research, static web.",
  "python_server/app.py",
  "app = FastAPI(title=settings.app_name, lifespan=lifespan)",
  ["Monta /static a partir de web/.", "Inclui api_router e research_router.", "Health em /health."]),

n("sf-api", "sf-server", "file", "api.py",
  "REST + WebSocket: atuadores, login, status; rejeita INV com 409.",
  "python_server/api.py",
  "@router.websocket(\"/ws\")\nasync def websocket_endpoint(websocket: WebSocket): ...",
  ["WS /api/ws transmite snapshot.", "InvariantViolation → HTTP 409 / evento WS.", "Assina payloads MQTT com HMAC."]),

n("sf-state", "sf-server", "file", "state.py",
  "Estado vivo da Ferrari: atuadores, sensores, broadcast, HIL timed.",
  "python_server/state.py",
  "class FerrariState:\n  async def set_engine(self, on: bool): ...",
  ["_timed aplica guard + energia + HIL.", "set_horn auto-off após 0.45s.", "broadcast notifica listeners WS."]),

n("sf-twin", "sf-server", "file", "statemachine.py",
  "Gêmeo formal SECURE→SPORT com invariantes INV-01…06.",
  "python_server/statemachine.py",
  "class DigitalTwin:\n  def guard(self, action, params=None): ...",
  ["INV-02 bloqueia motor com alarme.", "last_rejected guarda violações.", "Modo derivado de actuators/sensors."]),

n("sf-hil", "sf-server", "file", "hil.py",
  "Fault injection: delay_ms, loss_rate, métricas QoS.",
  "python_server/hil.py",
  "class HILEngine:\n  async def apply(self, name, coro_factory): ...",
  ["Configure via POST /api/research/hil.", "delivery_ratio = delivered/sent.", "consistency eventual sob delay/loss."]),

n("sf-security", "sf-server", "file", "security.py",
  "HMAC de comandos + cadeia hash de auditoria verificável.",
  "python_server/security.py",
  "class AuditChain:\n  def append(self, action, payload): ...",
  ["sign_payload / verify_payload.", "verify_chain() no Research Lab.", "Tip exibido no snapshot."]),

n("sf-energy", "sf-server", "file", "energy.py",
  "Modelo P_motor/P_total/ΔE_bat e combustível documentado.",
  "python_server/energy.py",
  "P_HEADLIGHT_W = 120.0\nP0_ENGINE_W = 200.0\nK_RPM = 0.08",
  ["Sport multiplica motor ×1.35.", "Atualiza battery/fuel no tick.", "Equações no to_dict()."]),

n("sf-research", "sf-server", "file", "research_api.py",
  "Endpoints Lab: HIL, audit, visão, paper-pack LaTeX, experimentos.",
  "python_server/research_api.py",
  "@router.post(\"/paper-pack\")\ndef paper_pack(): ...",
  ["Exporta experiments/exports/paper_pack.tex.", "vision/event arma tracking/engine.", "overview agrega twin+energy+hil."]),

n("sf-telemetry", "sf-server", "file", "telemetry.py",
  "SQI e estatísticas de latência de comando.",
  "python_server/telemetry.py",
  "class Telemetry:\n  def record_command(self, name, latency_ms): ...",
  ["SQI combina skew, jitter, reliability.", "summary() alimenta Research Lab.", "Séries limitadas em deque."]),

n("sf-mqtt", "sf-server", "file", "mqtt_bridge.py",
  "Bridge MQTT ferrari/* com fallback simulação se broker ausente.",
  "python_server/mqtt_bridge.py",
  "class MqttBridge:\n  def publish(self, topic, payload): ...",
  ["Desabilita graciosamente sem Mosquitto.", "Assinaturas HMAC nos payloads.", "Heartbeat Arduino/Raspberry."]),

n("sf-paper", "sf-server", "file", "paperpack.py",
  "Gera figuras/tabelas LaTeX a partir de experimentos e QoS.",
  "python_server/paperpack.py",
  "def build_paper_pack(...): ...",
  ["Usado na banca/paper pack.", "Inclui HIL e audit tip.", "Download via /api/research/paper-pack.tex."]),

# --- Web ---
n("sf-web", "sf-root", "module", "web",
  "Digital Twin UI: SVG SF90, áudio, visão, Research Lab.",
  "web/",
  "<!-- Ferrari Lab UI -->",
  ["Servido em /static e /.", "Ctrl+F5 após mudanças.", "Web Audio exige gesto do usuário."]),

n("sf-index", "sf-web", "file", "index.html",
  "Layout Lab: stage SVG, comandos, HIL, espectro, visão.",
  "web/index.html",
  "<svg id=\"ferrari-svg\" viewBox=\"0 0 960 560\">",
  ["Portas motorista/passageiro + Abrir Ambas.", "IDs animáveis: door, spoiler, wheels.", "Canvas spectrum e qos-chart."]),

n("sf-script", "sf-web", "file", "script.js",
  "WS client, applyState, animações e botões de campo.",
  "web/script.js",
  "function applyState(state, telemetry) { ... }",
  ["engine-on dispara spin das rodas (SMIL).", "Horn/alarme com feedback imediato.", "Classes sport-on, climate-on, locked, alarm-on."]),

n("sf-audio", "sf-web", "file", "audio.js",
  "Web Audio: buzina dual-tone, sirene, ronco RPM, clique de trava.",
  "web/audio.js",
  "const FerrariAudio = (() => { function horn() { ... } })();",
  ["Analyser para espectro no Lab.", "setAlarm com LFO sirene.", "resume() após interação."]),

n("sf-vision", "sf-web", "file", "vision.js",
  "Webcam leve: gesto de partida e QR track na pit lane.",
  "web/vision.js",
  "const FerrariVision = (() => { ... })();",
  ["jsQR para QR \"track\".", "POST /api/research/vision/event.", "Debounce no script principal."]),

n("sf-style", "sf-web", "file", "style.css",
  "UI lab carbon/rosso — tipografia Archivo, painéis e animações.",
  "web/style.css",
  ":root { --rosso: #d40000; --font-display: \"Archivo Narrow\"; }",
  ["Sem strobes no alarme (indicador estático).", "Rodas via #car.engine-on .rim-spokes.", "Portas borboleta com cubic-bezier."]),

# --- Edge ---
n("sf-arduino", "sf-root", "module", "arduino",
  "Firmware nó Ferrari — L1 atuadores/sensores.",
  "arduino/FerrariNode/",
  "// FerrariNode.ino",
  ["Publique em FerrariNode via Arduino IDE.", "Tópicos ferrari/* alinhados ao protocolo.", "Heartbeat para SQI."]),

n("sf-ino", "sf-arduino", "file", "FerrariNode.ino",
  "Sketch principal do nó Arduino Ferrari.",
  "arduino/FerrariNode/FerrariNode.ino",
  "void loop() {\n  // sync + actuators\n}",
  ["Mapeie pinos a portas/farol/motor.", "Envie RPM/speed quando disponível.", "Mantenha sync_pulse periódico."]),

n("sf-pi", "sf-root", "module", "raspberry",
  "Agent hub Raspberry — bridge e heartbeat.",
  "raspberry/",
  "# raspberry agent",
  ["pip install -r raspberry/requirements.txt.", "Rode agent.py no Pi.", "Conecte ao mesmo broker MQTT."]),

n("sf-agent", "sf-pi", "file", "agent.py",
  "Loop do hub: sync, telemetria e comandos downstream.",
  "raspberry/agent.py",
  "# Raspberry hub agent",
  ["Publica ferrari/sync.", "Repassa comandos ao Arduino.", "Status ONLINE na UI."]),

n("sf-actuators", "sf-pi", "file", "actuators.py",
  "Abstração de atuadores no lado Raspberry.",
  "raspberry/actuators.py",
  "# actuators helpers",
  ["Isola GPIO/serial do agent.", "Espelha estado do twin.", "Facilita HIL em bancada."]),

# --- Docs / demo / start ---
n("sf-demo", "sf-root", "file", "docs/demo/standalone.html",
  "Demo standalone no GitHub Pages (sem backend) — abre no celular ou qualquer browser.",
  "docs/demo/standalone.html",
  "<!-- Ferrari Lab Demo — GitHub Pages -->",
  [
    "https://canonengineer.github.io/SmartFerrariIOT/demo/standalone.html",
    "Publicado via .github/workflows/deploy-pages.yml",
    "Backend completo local: .\\start.ps1 → :8001",
  ]),

n("sf-start", "sf-root", "file", "start.ps1",
  "Bootstrap Windows: venv, deps e sobe Lab em :8001.",
  "start.ps1",
  "Write-Host \"Ferrari Lab: http://127.0.0.1:8001\"\n& .\\.venv\\Scripts\\python.exe app.py",
  [
    "Execute na raiz do projeto.",
    "Instala requirements automaticamente.",
    "Local: http://127.0.0.1:8001 · Demo: https://canonengineer.github.io/SmartFerrariIOT/demo/standalone.html",
  ]),

n("sf-protocol", "sf-root", "file", "protocol.py",
  "Versão de protocolo e QoS MQTT do Ferrari IoT.",
  "python_server/protocol.py",
  "PROTOCOL_VERSION = \"1.0.0\"",
  ["Documentado em docs/PROTOCOL.md.", "Alinha Arduino/Pi/servidor.", "Exibido em /api/status."]),

n("sf-tests", "sf-root", "file", "test_engineering.py",
  "Testes de engenharia do lab (invariantes / SQI).",
  "tests/test_engineering.py",
  "# pytest engineering suite",
  ["Rode na raiz com pytest.", "Valide INV e telemetria.", "Use antes da demonstração."]),
]

PROJECT = {
    "slug": "smartferrari-iot",
    "name": "SmartFerrariIOT",
    "repoUrl": "https://github.com/CanonEngineer/SmartFerrariIOT",
    "demoUrl": "https://canonengineer.github.io/SmartFerrariIOT/demo/standalone.html?v=2026-07-14",
    "color": "#e10600",
    "icon": "python",
    "stack": "FastAPI · MQTT · Web Audio",
    "summary": "Gêmeo digital Ferrari + Arduino↔Raspberry, HIL/QoS, invariantes e Demo Lab no GitHub Pages — pós em Engenharia da Computação.",
    "nodes": NODES,
}


def main():
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(PROJECT, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Wrote {OUT} ({len(NODES)} nodes)")


if __name__ == "__main__":
    main()
