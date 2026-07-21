#!/usr/bin/env python3
"""
Reconstrói a árvore Professional-Scanner com TODOS os arquivos-fonte.
Preserva nós de função existentes (scan engine, UI) e adiciona cada módulo/arquivo.
"""
from __future__ import annotations

import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "scripts", "projects-data.json")

# Nós de função / detalhe já validados — mantidos para navegação fina
PRESERVE_IDS = {
    "ps-root", "ps-static", "ps-ws",
    "ps-enrich", "ps-history", "ps-ad-audit", "ps-vm-vlan", "ps-detect-vm",
    "ps-loop", "ps-loop-api",
    "ps-parse-target", "ps-ping", "ps-os-ttl", "ps-dns", "ps-mac", "ps-vendor",
    "ps-tcp-scan", "ps-concurrent", "ps-detect-dmz", "ps-device-type",
    "ps-export-xlsx", "ps-api-results",
    "ps-client", "ps-handle-msg", "ps-loop-modal",
    "ps-map", "ps-render-3d",
    "ps-autotest-ui",
}

def node(nid, parent, layer, title, file, desc, impl=None, screenshot=None):
    o = {
        "id": nid,
        "parent": parent,
        "layer": layer,
        "title": title,
        "description": desc,
        "file": file,
        "implementation": impl or [],
        "code": "",
    }
    if screenshot:
        o["screenshot"] = screenshot
    return o


# Grupos + arquivos completos (cada arquivo do repo v2)
FILE_NODES = [
    # ── Backend / núcleo ──
    node("ps-grp-core", "ps-root", "module", "Núcleo backend",
         "server.js",
         "Motor Express, WebSocket, varredura e orquestração de módulos.",
         ["server.js", "hostEnrichment.js", "hostHistory.js", "vmVlanStrategy.js"]),
    node("ps-server-file", "ps-grp-core", "file", "server.js",
         "server.js",
         "Arquivo completo — Express, WebSocket, scan TCP/UDP/ICMP, rotas API."),
    node("ps-host-enrichment-file", "ps-grp-core", "file", "hostEnrichment.js",
         "hostEnrichment.js",
         "Enriquecimento AD, SNMP, TLS, HTTP, impressoras, fingerprint."),
    node("ps-host-history-file", "ps-grp-core", "file", "hostHistory.js",
         "hostHistory.js",
         "Histórico persistente de IPs ociosos."),
    node("ps-vm-vlan-file", "ps-grp-core", "file", "vmVlanStrategy.js",
         "vmVlanStrategy.js",
         "Detecção de virtualização e mapeamento VLAN."),
    node("ps-scan-xlsx", "ps-grp-core", "file", "scanReportXlsx.js",
         "scanReportXlsx.js",
         "Export Excel varredura, IPs ociosos e mapa ALA."),
    node("ps-canon-report-theme", "ps-grp-core", "file", "canonReportTheme.js",
         "canonReportTheme.js",
         "Tema visual compartilhado (PDF/Excel Canon)."),
    node("ps-canon-report-pdf", "ps-grp-core", "file", "canonReportPdf.js",
         "canonReportPdf.js",
         "Helpers PDF relatórios Canon."),
    node("ps-canon-report-excel", "ps-grp-core", "file", "canonReportExcel.js",
         "canonReportExcel.js",
         "Helpers Excel relatórios Canon."),
    node("ps-mac-vendor-file", "ps-grp-core", "file", "macVendor.js",
         "macVendor.js",
         "Base OUI → fabricante (scan + inventário)."),

    node("ps-ad-file", "ps-root", "file", "adUserAudit.js",
         "adUserAudit.js",
         "Auditoria AD: sync, saídas, departamentos, grupos, lookup live."),

    node("ps-loop-file", "ps-root", "file", "loopDetection.js",
         "loopDetection.js",
         "Monitor SNMP urgente de loop multi-vendor."),

    # ── AutoTest ──
    node("ps-grp-autotest", "ps-root", "module", "AutoTest L2/L3/L4",
         "autoTest.js",
         "Diagnóstico de conectividade local e remoto.",
         ["autoTest.js", "autoTestNetwork.js", "autoTestRemote.js"]),
    node("ps-autotest", "ps-grp-autotest", "file", "autoTest.js",
         "autoTest.js",
         "Motor AutoTest: perfis, histórico, engenharia, run local.",
         screenshot="docs/images/professional-scanner/autotest-results.png"),
    node("ps-autotest-network", "ps-grp-autotest", "file", "autoTestNetwork.js",
         "autoTestNetwork.js",
         "Testes subnet, IP duplicado, HTTP, Wi-Fi scan."),
    node("ps-autotest-pdf", "ps-grp-autotest", "file", "autoTestPdf.js",
         "autoTestPdf.js",
         "Export PDF do relatório de engenharia."),
    node("ps-autotest-csv", "ps-grp-autotest", "file", "autoTestCsv.js",
         "autoTestCsv.js",
         "Export CSV dos passos AutoTest."),
    node("ps-autotest-xlsx", "ps-grp-autotest", "file", "autoTestXlsx.js",
         "autoTestXlsx.js",
         "Export Excel AutoTest (tema Canon)."),
    node("ps-autotest-remote", "ps-grp-autotest", "file", "autoTestRemote.js",
         "autoTestRemote.js",
         "Fila de jobs e registro de agentes remotos.",
         screenshot="docs/images/professional-scanner/autotest-remote.png"),
    node("ps-autotest-remote-sec", "ps-grp-autotest", "file", "autoTestRemoteSecurity.js",
         "autoTestRemoteSecurity.js",
         "Assinatura HMAC, pareamento persistido e profileSnapshot nos jobs."),
    node("ps-autotest-remote-auth", "ps-grp-autotest", "file", "autoTestRemoteAuth.js",
         "autoTestRemoteAuth.js",
         "Login AD remoto (HCFMB/UNESP) — sessão separada do Canon para execução remota."),
    node("ps-rate-limit", "ps-grp-auth", "file", "rateLimit.js",
         "rateLimit.js",
         "Rate limit por IP/rota em endpoints sensíveis (login, pareamento, jobs)."),
    node("ps-autotest-runner", "ps-grp-autotest", "file", "autotestRemoteRunner.js",
         "autotestRemoteRunner.js",
         "Runner do agente Windows: poll, execute, complete."),

    # ── Oracle ──
    node("ps-grp-oracle", "ps-root", "module", "Oracle lookup",
         "oracleUserLookup.js",
         "Consulta usuários Oracle correlacionados ao AD."),
    node("ps-oracle", "ps-grp-oracle", "file", "oracleUserLookup.js",
         "oracleUserLookup.js",
         "Lookup Oracle via SQL*Plus / oracledb."),
    node("ps-oracle-bridge", "ps-grp-oracle", "file", "oracleSqlPlusBridge.js",
         "oracleSqlPlusBridge.js",
         "Ponte PowerShell SQL*Plus."),
    node("ps-oracle-java", "ps-grp-oracle", "file", "OracleJdbcBridge.java",
         "scripts/oracle-bridge/OracleJdbcBridge.java",
         "Ponte JDBC Java para Oracle."),

    # ── Plataforma Canon ──
    node("ps-grp-platform", "ps-root", "module", "Plataforma Canon",
         "platformRoutes.js",
         "Drift, correlação, NAC, CMDB, TLS, webhooks, relatórios."),
    node("ps-platform", "ps-grp-platform", "file", "platformRoutes.js",
         "platformRoutes.js",
         "Rotas /api/platform/* e montagem dos submódulos."),
    node("ps-platform-config", "ps-grp-platform", "file", "platformConfig.js",
         "platformConfig.js",
         "Sites, feature flags, config persistente."),
    node("ps-platform-hooks", "ps-grp-platform", "file", "platformHooks.js",
         "platformHooks.js",
         "Hooks pós-scan e integração com varredura."),
    node("ps-network-drift", "ps-grp-platform", "file", "networkDrift.js",
         "networkDrift.js",
         "Drift de rede vs baseline."),
    node("ps-asset-correlation", "ps-grp-platform", "file", "assetCorrelation.js",
         "assetCorrelation.js",
         "Correlação IP + MAC + switch + AD."),
    node("ps-asset-lifecycle", "ps-grp-platform", "file", "assetLifecycle.js",
         "assetLifecycle.js",
         "CMDB — estados de lifecycle dos assets."),
    node("ps-nac-readiness", "ps-grp-platform", "file", "nacReadiness.js",
         "nacReadiness.js",
         "Score de prontidão NAC."),
    node("ps-tls-cert", "ps-grp-platform", "file", "tlsCertScan.js",
         "tlsCertScan.js",
         "Varredura de certificados TLS."),
    node("ps-deep-fp", "ps-grp-platform", "file", "deepFingerprint.js",
         "deepFingerprint.js",
         "Fingerprint profundo de serviços."),
    node("ps-passive", "ps-grp-platform", "file", "passiveDiscovery.js",
         "passiveDiscovery.js",
         "Descoberta passiva / snapshot ARP."),
    node("ps-scheduled", "ps-grp-platform", "file", "scheduledReports.js",
         "scheduledReports.js",
         "Relatórios agendados e scheduler."),
    node("ps-webhook", "ps-grp-platform", "file", "webhookDispatcher.js",
         "webhookDispatcher.js",
         "Dispatch HTTP para webhooks configurados."),
    node("ps-canon-agent", "ps-grp-platform", "file", "canonAgent.js",
         "canonAgent.js",
         "Ingestão de relatórios do agente Canon."),
    node("ps-ala-mapping", "ps-grp-platform", "file", "alaMapping.js",
         "alaMapping.js",
         "Mapeamento ALA hospitalar."),

    # ── Inventário UNESP ──
    node("ps-grp-inventory", "ps-root", "module", "Inventário Corporativo UNESP",
         "inventory.js",
         "Inventário persistente: merge scan + AD + histórico + portas/MAC/SNMP.",
         ["inventory.js", "inventoryRoutes.js", "switchMacLookup.js", "inventoryXlsx.js"]),
    node("ps-inventory", "ps-grp-inventory", "file", "inventory.js",
         "inventory.js",
         "Core: merge incremental, enrich AD/MAC/portas/SNMP, sync async."),
    node("ps-switch-mac-lookup", "ps-grp-inventory", "file", "switchMacLookup.js",
         "switchMacLookup.js",
         "IP→MAC via SNMP ipNetToMedia — gateway padrão e switches Loop Monitor.",
         ["buildSnmpIpMacIndex()", "discoverDefaultGateways()", "queryIpNetToMedia()"]),
    node("ps-inventory-routes", "ps-grp-inventory", "file", "inventoryRoutes.js",
         "inventoryRoutes.js",
         "API /api/inventory/* — sync, resolve AD, export."),
    node("ps-inventory-xlsx", "ps-grp-inventory", "file", "inventoryXlsx.js",
         "inventoryXlsx.js",
         "Export Excel inventário UNESP."),
    node("ps-inventory-pdf", "ps-grp-inventory", "file", "inventoryPdf.js",
         "inventoryPdf.js",
         "Export PDF inventário."),
    node("ps-inventory-csv", "ps-grp-inventory", "file", "inventoryCsv.js",
         "inventoryCsv.js",
         "Export CSV inventário."),
    node("ps-inventory-ui-js", "ps-grp-inventory", "file", "public/inventory.js",
         "public/inventory.js",
         "UI modal inventário: tabela centralizada, sync AD, feedback MAC SNMP."),
    node("ps-inventory-ui-css", "ps-grp-inventory", "file", "public/inventory.css",
         "public/inventory.css",
         "Estilos modal inventário — colunas centradas, portas/serviços largas."),

    # ── Auth ──
    node("ps-grp-auth", "ps-root", "module", "Autenticação Canon",
         "canonAuth.js",
         "Login PBKDF2 com escopos dashboard (boot/memória) e modals (sessionStorage + disco).",
         ["canonAuth.js", "canonRbac.js", "data/canon-sessions.json"]),
    node("ps-auth", "ps-grp-auth", "file", "canonAuth.js",
         "canonAuth.js",
         "requireAuth(scope), login(username, password, scope), persistência só sessões modals."),
    node("ps-auth-boot-ui", "ps-grp-auth", "function", "bootCanonApp()",
         "public/app.js",
         "Login boot obrigatório no F5; token dashboard só em memória; gate ociosos/exports.",
         ["installCanonFetch()", "gateProtectedArea()", "canonBootToken"]),
    node("ps-auth-modals-ui", "ps-grp-auth", "function", "gateCanonModalsArea()",
         "public/app.js",
         "Login modals compartilhado: Oracle, AD, Loop, AutoTest local, Inventário, Plataforma.",
         ["canonModalToken", "sessionStorage", "openInventoryModalDirect"]),
    node("ps-rbac", "ps-grp-auth", "file", "canonRbac.js",
         "canonRbac.js",
         "RBAC Plataforma — permissões por role."),

    # ── Frontend public/ ──
    node("ps-grp-public", "ps-root", "module", "Frontend (public/)",
         "public/index.html",
         "Dashboard, modais, mapa 3D, plataforma."),
    node("ps-app-file", "ps-grp-public", "file", "public/app.js",
         "public/app.js",
         "Cliente principal: WS, scan, auth dois níveis (boot + modals), AD, loop, AutoTest, Oracle."),
    node("ps-index-html", "ps-grp-public", "file", "public/index.html",
         "public/index.html",
         "HTML dashboard, modais sticky e branding Canon."),
    node("ps-style-css", "ps-grp-public", "file", "public/style.css",
         "public/style.css",
         "Tema Canon, modais padronizados, branding animado, loop modal sticky."),
    node("ps-platform-js", "ps-grp-public", "file", "public/platform.js",
         "public/platform.js",
         "UI Plataforma Canon — abas Drift, NAC, CMDB…"),
    node("ps-platform-css", "ps-grp-public", "file", "public/platform.css",
         "public/platform.css",
         "Estilos do modal Plataforma."),
    node("ps-map-file", "ps-grp-public", "file", "public/map.js",
         "public/map.js",
         "Mapa topológico 3D force-graph."),
    node("ps-map-html", "ps-grp-public", "file", "public/map.html",
         "public/map.html",
         "Página dedicada do mapa de rede."),
    node("ps-port-presets", "ps-grp-public", "file", "public/portPresets.js",
         "public/portPresets.js",
         "Presets de portas Integra / well-known."),

    # ── Scripts PowerShell / Java ──
    node("ps-grp-scripts", "ps-root", "module", "Scripts (scripts/)",
         "scripts/install-autotest-agent-service.ps1",
         "Instalação agente, Oracle bridge, help."),
    node("ps-script-install-agent", "ps-grp-scripts", "file",
         "install-autotest-agent-service.ps1",
         "scripts/install-autotest-agent-service.ps1",
         "Instala serviço Windows do agente AutoTest."),
    node("ps-script-remote-agent", "ps-grp-scripts", "file",
         "autotest-remote-agent.ps1",
         "scripts/autotest-remote-agent.ps1",
         "Wrapper PowerShell do agente remoto."),
    node("ps-script-remote-help", "ps-grp-scripts", "file",
         "autotest-remote-help.ps1",
         "scripts/autotest-remote-help.ps1",
         "Diagnóstico e help do agente."),
    node("ps-script-canon-agent", "ps-grp-scripts", "file",
         "canon-agent.ps1",
         "scripts/canon-agent.ps1",
         "Script agente relatórios Plataforma."),

    # ── Testes ──
    node("ps-grp-tests", "ps-root", "module", "Testes",
         "test-platform.js",
         "Testes automatizados da plataforma."),
    node("ps-test-platform", "ps-grp-tests", "file", "test-platform.js",
         "test-platform.js",
         "Suite Node test — npm test."),
    node("ps-test-legacy", "ps-grp-tests", "file", "test.js",
         "test.js",
         "Testes legados / utilitários."),

    # ── Config ──
    node("ps-package-json", "ps-root", "file", "package.json",
         "package.json",
         "Dependências npm e scripts npm start / test."),
    node("ps-package-agent-json", "ps-grp-scripts", "file", "package.agent.json",
         "package.agent.json",
         "Manifesto npm do bundle do agente AutoTest remoto."),
]

# Reassign preserved function nodes to clearer parents where needed
PARENT_OVERRIDES = {
    "ps-static": "ps-grp-core",
    "ps-ws": "ps-grp-core",
    "ps-parse-target": "ps-grp-core",
    "ps-ping": "ps-grp-core",
    "ps-os-ttl": "ps-grp-core",
    "ps-dns": "ps-grp-core",
    "ps-mac": "ps-grp-core",
    "ps-vendor": "ps-grp-core",
    "ps-tcp-scan": "ps-grp-core",
    "ps-concurrent": "ps-grp-core",
    "ps-detect-dmz": "ps-grp-core",
    "ps-device-type": "ps-grp-core",
    "ps-export-xlsx": "ps-grp-core",
    "ps-api-results": "ps-grp-core",
    "ps-enrich": "ps-grp-core",
    "ps-history": "ps-grp-core",
    "ps-ad-audit": "ps-root",
    "ps-vm-vlan": "ps-grp-core",
    "ps-detect-vm": "ps-grp-core",
    "ps-loop": "ps-root",
    "ps-loop-api": "ps-root",
    "ps-client": "ps-grp-public",
    "ps-handle-msg": "ps-grp-public",
    "ps-loop-modal": "ps-grp-public",
    "ps-autotest-ui": "ps-grp-public",
    "ps-map": "ps-grp-public",
    "ps-render-3d": "ps-grp-public",
}


def main():
    with open(DATA, encoding="utf-8") as f:
        projects = json.load(f)

    for project in projects:
        if project.get("slug") != "professional-scanner":
            continue

        old_nodes = project.get("nodes", [])
        preserved = [n for n in old_nodes if n["id"] in PRESERVE_IDS]

        for n in preserved:
            if n["id"] in PARENT_OVERRIDES:
                n["parent"] = PARENT_OVERRIDES[n["id"]]

        # Update root description
        for n in preserved:
            if n["id"] == "ps-root":
                n["description"] = (
                    "NetScan Canon v2.4 — auth em fases (#18 etapas 0–5): escopos dashboard/modals, "
                    "backend, AD, loop, AutoTest remoto AD, Inventário UNESP, Oracle, Plataforma e UI."
                )
            if n["id"] == "ps-client":
                n["description"] = (
                    "Módulo UI public/app.js — branding Canon animado, login remoto AD e modais sticky."
                )
            if n["id"] == "ps-loop-modal":
                n["description"] = (
                    "Modal Loop Rede sticky — layout flex sem barra vertical na borda; scroll interno na área de conteúdo."
                )
            if n["id"] == "ps-autotest-ui":
                n["description"] = (
                    "UI AutoTest: cards L2/L3/L4, login AD remoto acima do modal, revogar agente, poll cancelável."
                )

        by_id = {n["id"]: n for n in preserved}

        for fn in FILE_NODES:
            if fn["id"] in by_id:
                # Atualiza metadados, preserva code preenchido depois pelo fill
                existing = by_id[fn["id"]]
                for k in ("parent", "layer", "title", "description", "file", "implementation"):
                    existing[k] = fn[k]
                if fn.get("screenshot"):
                    existing["screenshot"] = fn["screenshot"]
            else:
                by_id[fn["id"]] = fn

        project["nodes"] = list(by_id.values())
        project["stack"] = "Node.js + WebSocket + SNMP + AutoTest + Platform + AD Remote Auth"
        project["summary"] = (
            "NetScan Canon v2.4 — auth Canon em fases (dashboard boot + modals), AutoTest remoto AD, "
            "rate limit, inventário UNESP SNMP MAC, scan, AD, Oracle, Plataforma e UI."
        )
        project["demoUrl"] = (
            "https://github.com/CanonEngineer/Professional-Scanner/blob/main/docs/DOCUMENTATION.md"
        )

        print(f"Professional-Scanner: {len(project['nodes'])} nós na árvore")
        files = {n["file"] for n in project["nodes"] if n.get("file")}
        print(f"  Arquivos únicos referenciados: {len(files)}")
        break
    else:
        raise SystemExit("Projeto professional-scanner não encontrado")

    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(projects, f, ensure_ascii=False, indent=2)
        f.write("\n")


if __name__ == "__main__":
    main()
