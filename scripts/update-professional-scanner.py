#!/usr/bin/env python3
"""Atualiza metadados e nós do Professional-Scanner no projects-data.json."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "scripts", "projects-data.json")

NEW_NODES = [
    {
        "id": "ps-autotest",
        "parent": "ps-root",
        "layer": "module",
        "title": "autoTest.js",
        "description": "Motor AutoTest L2/L3/L4: perfis, histórico, relatório de engenharia e export PDF/CSV.",
        "file": "autoTest.js",
        "screenshot": "docs/images/professional-scanner/autotest-results.png",
        "implementation": [
            "runAutoTest()",
            "perfis Canon / Integra",
            "data/autotest-history.json"
        ],
        "code": ""
    },
    {
        "id": "ps-autotest-ui",
        "parent": "ps-client",
        "layer": "function",
        "title": "renderAutoTestEngineeringBanner()",
        "description": "Banner EXECUTANDO animado, métricas PASS/AVISO/FALHA e cards em 3 colunas.",
        "file": "public/app.js",
        "screenshot": "docs/images/professional-scanner/autotest-running.png",
        "implementation": [
            "autotest-run-scroll",
            "loadAutoTestInterfaces()",
            "parseLegacyAutoTestSummary()"
        ],
        "code": ""
    },
    {
        "id": "ps-autotest-remote",
        "parent": "ps-autotest",
        "layer": "module",
        "title": "autoTestRemote.js",
        "description": "Execução remota estilo Veyon: pareamento, runner assinado e fila de jobs na LAN.",
        "file": "autoTestRemote.js",
        "screenshot": "docs/images/professional-scanner/autotest-remote.png",
        "implementation": [
            "enrollRemoteAgent()",
            "install-autotest-agent-service.ps1",
            "data/autotest-remote-keys/"
        ],
        "code": ""
    },
    {
        "id": "ps-oracle",
        "parent": "ps-root",
        "layer": "module",
        "title": "oracleUserLookup.js",
        "description": "Consulta usuários Oracle via SQL*Plus e ponte JDBC para correlacionar com AD.",
        "file": "oracleUserLookup.js",
        "implementation": [
            "oracleSqlPlusBridge.js",
            "scripts/oracle-bridge/OracleJdbcBridge.java",
            "GET /api/oracle/user"
        ],
        "code": ""
    },
    {
        "id": "ps-platform",
        "parent": "ps-root",
        "layer": "module",
        "title": "platformRoutes.js",
        "description": "Plataforma Canon: drift de rede, lifecycle de assets, NAC readiness, TLS e webhooks.",
        "file": "platformRoutes.js",
        "implementation": [
            "networkDrift.js",
            "assetLifecycle.js",
            "public/platform.js"
        ],
        "code": ""
    },
    {
        "id": "ps-auth",
        "parent": "ps-root",
        "layer": "module",
        "title": "canonAuth.js",
        "description": "Autenticação de sessão e RBAC para proteger endpoints sensíveis do scanner.",
        "file": "canonAuth.js",
        "implementation": [
            "canonRbac.js",
            "middleware requireAuth",
            "roles configuráveis"
        ],
        "code": ""
    },
]


def main():
    with open(DATA, encoding="utf-8") as f:
        projects = json.load(f)

    for project in projects:
        if project.get("slug") != "professional-scanner":
            continue

        project["stack"] = "Node.js + WebSocket + SNMP + AutoTest"
        project["summary"] = (
            "NetScan Canon v2: varredura, AD, AutoTest L2/L3/L4 local/remoto, "
            "Oracle, Plataforma Canon e monitor urgente de loop SNMP."
        )
        project["demoUrl"] = "https://github.com/CanonEngineer/Professional-Scanner#autotest-de-rede-1"
        project["screenshots"] = [
            "docs/images/professional-scanner/autotest-results.png",
            "docs/images/professional-scanner/autotest-running.png",
            "docs/images/professional-scanner/autotest-remote.png",
            "docs/images/professional-scanner/autotest-history.png",
        ]

        existing_ids = {n["id"] for n in project.get("nodes", [])}
        for node in project.get("nodes", []):
            if node["id"] == "ps-root":
                node["description"] = (
                    "NetScan Canon v2: discovery, enriquecimento AD, AutoTest, "
                    "Oracle, Plataforma Canon, ociosos e loop SNMP."
                )
            if node["id"] == "ps-client":
                node["description"] = (
                    "Dashboard: scan, ociosos, AD, Loop, AutoTest, Oracle e Plataforma Canon."
                )

        added = 0
        updated = 0
        for node in NEW_NODES:
            if node["id"] not in existing_ids:
                project.setdefault("nodes", []).append(node)
                added += 1
            else:
                for existing in project.get("nodes", []):
                    if existing["id"] == node["id"] and node.get("screenshot"):
                        existing["screenshot"] = node["screenshot"]
                        updated += 1

        print(f"Professional-Scanner: +{added} nós, {updated} screenshots, total {len(project['nodes'])}")
        break
    else:
        raise SystemExit("Projeto professional-scanner não encontrado")

    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(projects, f, ensure_ascii=False, indent=2)
        f.write("\n")


if __name__ == "__main__":
    main()
