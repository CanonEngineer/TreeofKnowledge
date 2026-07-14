/**
 * Regenera smarthome-project.json + rebuild projects.js (sem fill-full-code).
 * Node stand-in for gen-smarthome.py + build-projects.py --no-fill
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "smarthome-project.json");
const REPO = path.join(process.env.USERPROFILE || "", "Desktop", "SmartHomeIOT");
const LIMIT = 12000;

function readRel(rel, fallback = "") {
  const p = path.join(REPO, ...rel.split("/"));
  if (!fs.existsSync(p)) return fallback.trim();
  let text = fs.readFileSync(p, "utf8");
  if (text.length > LIMIT) text = text.slice(0, LIMIT) + "\n\n/* … truncado na árvore … */\n";
  return text;
}

function n(id, parent, layer, title, desc, file, code, impl) {
  return {
    id,
    parent,
    layer,
    title,
    description: desc,
    file,
    code: typeof code === "string" ? code.trim() : code,
    implementation: Array.isArray(impl) ? impl : [impl],
  };
}

function build() {
  const r = (rel, fb = "") => readRel(rel, fb);
  const nodes = [
    n("smi-root", null, "root", "SmartHomeIOT",
      "Bancada experimental IoT edge para doutorado: Arduino ↔ Raspberry, servos/portas, FastAPI, SQI e Research Lab.",
      "README.md", r("README.md", "# SmartHome IoT Platform"),
      [
        "Clone: https://github.com/CanonEngineer/SmartHomeIOT",
        "Local: .\\start.ps1 → http://127.0.0.1:8000",
        "Demo: https://canonengineer.github.io/SmartHomeIOT/demo/standalone.html",
      ]),
    n("smi-arch", "smi-root", "module", "Arquitetura L1–L5",
      "Camadas de engenharia: percepção, comunicação, edge, serviço e experimentação.",
      "docs/ARCHITECTURE.md", r("docs/ARCHITECTURE.md", "# Arquitetura L1-L5"),
      ["L1 Percepção/Atuação", "L2 MQTT/REST/WebSocket", "L3 Raspberry edge", "L4 FastAPI + SQLite + telemetria", "L5 Research Lab / UI"]),
    n("smi-protocol", "smi-root", "module", "Protocolo v1.0.0",
      "Contratos de mensagem house/* com envelope versionado.",
      "python_server/protocol.py", r("python_server/protocol.py", "PROTOCOL_VERSION = '1.0.0'"),
      ["TOPIC_SCHEMA house/*", "Envelope com message_id e qos", "docs/PROTOCOL.md"]),
    n("smi-backend", "smi-root", "module", "Backend FastAPI",
      "Serviço L4: estado, API REST, WebSocket, auth e research endpoints.",
      "python_server/app.py", r("python_server/app.py"),
      ["uvicorn app:app", "Static web/ em /static", "Lifespan inicia simulador"]),
    n("smi-app", "smi-backend", "file", "app.py",
      "Bootstrap FastAPI, CORS, MQTT bridge e lifespan do simulador.",
      "python_server/app.py", r("python_server/app.py"),
      ["include_router api + research", "FileResponse index.html", "health com protocol"]),
    n("smi-api", "smi-backend", "file", "api.py",
      "Rotas de atuação: LED, relé, servo, porta, cenários e WebSocket.",
      "python_server/api.py", r("python_server/api.py"),
      ["POST /api/door|/servo|/led", "WS /api/ws", "Logs e devices"]),
    n("smi-state", "smi-backend", "file", "state.py",
      "HouseState — fonte de verdade em runtime com versionamento e sync.",
      "python_server/state.py", r("python_server/state.py"),
      ["actuators + sensors + boards", "broadcast WebSocket", "integra telemetria"]),
    n("smi-telemetry", "smi-backend", "file", "telemetry.py",
      "TelemetryEngine: latência, skew Arduino↔Raspberry e Sync Quality Index.",
      "python_server/telemetry.py", r("python_server/telemetry.py"),
      ["SQI = 0.45 skew + 0.30 jitter + 0.25 reliability", "p50/p95", "series_tail"]),
    n("smi-research", "smi-backend", "file", "research_api.py",
      "API científica: overview, experimentos, export CSV/JSON e thesis-brief.",
      "python_server/research_api.py", r("python_server/research_api.py"),
      ["/api/research/experiments/run", "export.csv|json", "thesis-brief.md"]),
    n("smi-experiments", "smi-research", "file", "experiments.py",
      "Bancada reproduzível: sync_latency, actuator_response, fault_injection, E2E.",
      "python_server/experiments.py", r("python_server/experiments.py"),
      ["Hipóteses por ensaio", "Persiste experiments/exports/", "Métricas no resultado"]),
    n("smi-sim", "smi-backend", "file", "simulator.py",
      "Simulador de sensores e cenários welcome/garage/alarm/night/sync_test.",
      "python_server/simulator.py", r("python_server/simulator.py"),
      ["Drift senoidal de sensores", "Heartbeats Arduino/Raspberry", "Sem hardware"]),
    n("smi-db", "smi-backend", "file", "database.py",
      "SQLite + SQLAlchemy: users, devices, sensors, logs; bcrypt nativo.",
      "python_server/database.py", r("python_server/database.py"),
      ["init_db dispositivos padrão", "log_action auditoria", "admin/admin123"]),
    n("smi-models", "smi-db", "file", "models.py",
      "Modelos ORM User, Device, SensorReading, ActionLog.",
      "python_server/models.py", r("python_server/models.py"),
      ["DeclarativeBase", "timestamps UTC"]),
    n("smi-mqtt", "smi-backend", "file", "mqtt_bridge.py",
      "Ponte MQTT opcional (Mosquitto) — desligada por padrão em simulação.",
      "python_server/mqtt_bridge.py", r("python_server/mqtt_bridge.py"),
      ["MQTT_ENABLED=false default", "subscribe house/*", "publish comandos"]),
    n("smi-arduino", "smi-root", "module", "Firmware Arduino/ESP32",
      "Nó L1: sensores DHT/LDR/PIR e atuação LED/relé/servo via MQTT.",
      "arduino/SmartHomeNode/SmartHomeNode.ino", r("arduino/SmartHomeNode/SmartHomeNode.ino"),
      ["WiFi + PubSubClient", "Heartbeats house/sync", "arduino/PINOUT.md"]),
    n("smi-ino", "smi-arduino", "file", "SmartHomeNode.ino",
      "Loop de sensores e callback onMessage para house/led|relay|servo|door.",
      "arduino/SmartHomeNode/SmartHomeNode.ino", r("arduino/SmartHomeNode/SmartHomeNode.ino"),
      ["GPIO servos 18/19/21", "Relés ativos em LOW", "Publica temp/humidity/light/motion"]),
    n("smi-raspberry", "smi-root", "module", "Agente Raspberry Pi",
      "L3 edge: espelha comandos MQTT/API e envia heartbeat de sincronia.",
      "raspberry/agent.py", r("raspberry/agent.py"),
      ["USE_MQTT=0 cai para poll API", "heartbeat /api/heartbeat", "GPIO opcional"]),
    n("smi-agent", "smi-raspberry", "file", "agent.py",
      "Loop MQTT ou espelhamento via GET /api/status.",
      "raspberry/agent.py", r("raspberry/agent.py"),
      ["handle_command tópicos house/*", "threading heartbeat", "cleanup GPIO"]),
    n("smi-actuators", "smi-raspberry", "file", "actuators.py",
      "Atuadores locais LED/buzzer/relé/servo/porta (GPIO real ou stub).",
      "raspberry/actuators.py", r("raspberry/actuators.py"),
      ["RPi.GPIO se ARM", "Stub em PC", "Porta ligada ao ângulo do servo"]),
    n("smi-web", "smi-root", "module", "Simulador Web + Research Lab",
      "L5: planta da casa, placas, mecanismos e painel de métricas/experimentos.",
      "web/index.html", r("web/index.html"),
      ["WebSocket tempo real", "SVG: LED | RELÉ SALA | BUZZER", "Porta afastada do Arduino"]),
    n("smi-html", "smi-web", "file", "index.html",
      "Layout do laboratório visual e controles manuais.",
      "web/index.html", r("web/index.html"),
      ["Syne + IBM Plex Mono", "Botões LED/porta/cenário", "Canvas latência"]),
    n("smi-js", "smi-web", "file", "script.js",
      "Cliente WS/REST: aplica estado, gráficos e roda experimentos.",
      "web/script.js", r("web/script.js"),
      ["connectWs /api/ws", "applyState animação", "POST experiments/run"]),
    n("smi-css", "smi-web", "file", "style.css",
      "Tema de engenharia (teal/amber) e animações de porta/servo.",
      "web/style.css", r("web/style.css"),
      ["door-panel.open", "board-flash", "research metrics"]),
    n("smi-demo", "smi-web", "file", "docs/demo/standalone.html",
      "Demo standalone no GitHub Pages (sem backend).",
      "docs/demo/standalone.html", r("docs/demo/standalone.html", "<!-- standalone demo -->"),
      [
        "https://canonengineer.github.io/SmartHomeIOT/demo/standalone.html",
        "CSS/JS inline",
        "Layout conferência: LED · Relé · Buzzer",
      ]),
    n("smi-java", "smi-root", "module", "Dashboard Java",
      "Cliente desktop Swing consumindo a mesma API REST.",
      "java_client/src/main/java/smarthome/Dashboard.java",
      r("java_client/src/main/java/smarthome/Dashboard.java"),
      ["HttpClient Java 21", "Botões LED/porta/cenário", "Atualização periódica"]),
    n("smi-method", "smi-root", "module", "Metodologia experimental",
      "Perguntas de pesquisa, variáveis, ameaças à validade e entregáveis de tese.",
      "docs/METHODOLOGY.md", r("docs/METHODOLOGY.md"),
      ["Ensaios catalogados", "Export CSV/JSON", "SQI como indicador composto"]),
    n("smi-tests", "smi-root", "file", "tests/test_engineering.py",
      "Testes de protocolo, SQI, latência e máquina de estados.",
      "tests/test_engineering.py", r("tests/test_engineering.py"),
      ["python tests/test_engineering.py", "Reprodutibilidade"]),
    n("smi-start", "smi-root", "file", "start.ps1",
      "Bootstrap Windows: venv, deps e sobe o servidor.",
      "start.ps1", r("start.ps1"),
      ["python -m venv .venv", "pip install -r requirements.txt", "python app.py"]),
  ];

  return {
    slug: "smarthome-iot",
    name: "SmartHomeIOT",
    repoUrl: "https://github.com/CanonEngineer/SmartHomeIOT",
    color: "#7dd3c0",
    icon: "python",
    stack: "Python + Arduino + Raspberry + Java",
    summary:
      "Plataforma IoT de doutorado: sync Arduino↔Raspberry, servos/portas, FastAPI, SQI e Research Lab visual.",
    nodes,
  };
}

function rebuildProjectsJs() {
  const load = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, f), "utf8"));
  const cpe = load("cpe-project.json");
  const others = load("projects-data.json").filter(
    (p) => !["customize-veyon", "javascript-dropbox"].includes(p.slug)
  );
  const veyon = load("veyon-project.json");
  const dropbox = load("dropbox-project.json");
  const restaurant = load("restaurant-project.json");
  const extras = fs.existsSync(path.join(__dirname, "extra-projects.json"))
    ? load("extra-projects.json")
    : [];
  const dangerzone = fs.existsSync(path.join(__dirname, "dangerzone-project.json"))
    ? [load("dangerzone-project.json")]
    : [];
  const smarthome = [load("smarthome-project.json")];
  const smartferrari = fs.existsSync(path.join(__dirname, "smartferrari-project.json"))
    ? [load("smartferrari-project.json")]
    : [];

  const projects = [cpe, ...others.slice(0, 1), dropbox, restaurant, ...others.slice(1), veyon, ...extras, ...dangerzone, ...smarthome, ...smartferrari];
  const total = projects.reduce((s, p) => s + p.nodes.length, 0);
  const out = path.join(ROOT, "js", "data", "projects.js");
  const js = `/* Árvore do Conhecimento — ${total} nós */\nconst PROJECTS = ${JSON.stringify(projects, null, 2)};\n`;
  fs.writeFileSync(out, js, "utf8");
  for (const p of projects) console.log(`  ${p.name}: ${p.nodes.length} nós`);
  console.log(`Total: ${total} nós -> ${out}`);
}

if (!fs.existsSync(path.join(REPO, "python_server", "app.py"))) {
  console.error("SmartHomeIOT não encontrado em", REPO);
  process.exit(1);
}

const project = build();
fs.writeFileSync(OUT, JSON.stringify(project, null, 2), "utf8");
console.log(`SmartHomeIOT: ${project.nodes.length} nós -> ${OUT}`);
console.log(`Fonte: ${REPO}`);
rebuildProjectsJs();
