#!/usr/bin/env python3
"""Gera scripts/veyon-project.json — árvore CustomizeVeyonProject."""
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "veyon-project.json")

def n(id, parent, layer, title, desc, file, code, impl):
    return {
        "id": id, "parent": parent, "layer": layer, "title": title,
        "description": desc, "file": file, "code": code.strip(),
        "implementation": impl if isinstance(impl, list) else [impl],
    }

NODES = [
n("cv-root", None, "root", "CustomizeVeyonProject",
  "Veyon 4.10.4 customizado CiMED/HCFMB — UI HiDPI, logs SHA-256 em UNC, anti-tampering e deploy portátil.",
  "veyon-4.10.4-src (1)/veyon-4.10.4/",
  "// Fork Veyon 4.10.4 + Veyon_Custom/\n// Logs: \\\\172.20.100.36\\vnc_veyon$\\veyon\\\n// Marca: Veyon CIMED",
  ["Clone CustomizeVeyonProject com submódulo veyon-4.10.4-src.", "Build CMake/MSVC no Windows.", "Distribua via pasta Veyon_Custom/."]),

n("cv-ui", "cv-root", "module", "Interface CIMED HiDPI",
  "Diálogos escuros com chrome CIMED, ícones vetoriais e suporte a 125%/150% DPI.",
  "core/src/CimedDialogStyle.cpp",
  "namespace CimedDialogStyle { QWidget* buildDialogShell(...); QString dialogStyleSheet(); }",
  ["Todos os diálogos custom passam por CimedDialogStyle.", "Ícones desenhados com QPainter — sem assets PNG.", "devicePixelRatio do monitor primário define nitidez."]),

n("cv-cimed-style", "cv-ui", "file", "CimedDialogStyle.cpp",
  "Chrome compartilhado: shell, stylesheet, ícones e botões CIMED.",
  "core/src/CimedDialogStyle.cpp",
  "const QColor IconCyan( 34, 211, 238 );\nQLabel* createIconLabel( const QPixmap& pixmap, int logicalSize, QWidget* parent );",
  ["Centraliza paleta cyan/slate dos diálogos.", "applyButtonIcon padroniza QPushButton 16×16.", "drawUserGlyph / drawLockGlyph para ícones inline."]),

n("cv-icon-dpr", "cv-cimed-style", "function", "iconDevicePixelRatio()",
  "Lê devicePixelRatio da tela primária para ícones nítidos em HiDPI.",
  "core/src/CimedDialogStyle.cpp",
  "qreal iconDevicePixelRatio() {\n  if (auto* screen = QGuiApplication::primaryScreen())\n    return std::max(1.0, screen->devicePixelRatio());\n  return 1.0;\n}",
  ["Evita ícones borrados em monitores 125%/150%.", "Fallback 1.0 se não houver tela.", "Usado ao rasterizar pixmaps dos diálogos."]),

n("cv-dialog-shell", "cv-cimed-style", "function", "buildDialogShell()",
  "Monta QDialog com header CIMED, área de conteúdo e rodapé de ações.",
  "core/src/CimedDialogStyle.cpp",
  "QWidget* buildDialogShell( QDialog* dialog, const QString& title,\n  const QPixmap& titleIcon, QWidget* content, QWidget* actions );",
  ["Frameless + stylesheet escuro.", "Título com ícone à esquerda.", "Botões OK/Cancelar no rodapé."]),

n("cv-password-dialog", "cv-ui", "file", "PasswordDialog.cpp",
  "Senha VNC com visual CIMED e validação integrada ao fluxo remoto.",
  "core/src/PasswordDialog.cpp",
  "PasswordDialog::PasswordDialog( QWidget* parent )\n  : QDialog( parent ) { /* CimedDialogStyle shell */ }",
  ["Substitui QMessageBox nativo.", "Usa buildDialogShell + dialogStyleSheet.", "Retorna senha digitada ao plugin RemoteAccess."]),

n("cv-host-input", "cv-ui", "file", "CimedHostInputDialog.cpp",
  "Entrada de host/IP para conexão remota com UI CIMED.",
  "core/src/CimedHostInputDialog.cpp",
  "CimedHostInputDialog::CimedHostInputDialog( QWidget* parent )\n  : QDialog( parent ) { /* host + botões */ }",
  ["QLineEdit para hostname ou IP.", "Validação antes de iniciar sessão.", "Chamado por RemoteAccessFeaturePlugin."]),

n("cv-desktop-access", "cv-ui", "file", "DesktopAccessConfirmDialog.cpp",
  "Confirmação de acesso à área de trabalho do aluno com branding CIMED.",
  "core/src/DesktopAccessConfirmDialog.cpp",
  "DesktopAccessConfirmDialog::execForAccess( QWidget* parent, const QString& teacherName );",
  ["Exibido no cliente quando professor solicita controle.", "Texto em PT-BR com dados do solicitante.", "Aceitar/recusar com ícones CIMED."]),

n("cv-brand", "cv-root", "module", "Marca e suporte CIMED",
  "Rótulo Veyon CIMED, hostname, usuário AD e textos da bandeja.",
  "core/src/ComputerSupportInfo.cpp",
  "class ComputerSupportInfo { static QString productLabel(); static QString idleTrayHoverHtml(); };",
  ["Centraliza strings de produto e suporte.", "Consulta AD via PlatformUserFunctions.", "HTML formatado para tooltip da bandeja."]),

n("cv-support-info", "cv-brand", "file", "ComputerSupportInfo.cpp",
  "Metadados da estação: hostname, IP, login AD e nome completo.",
  "core/src/ComputerSupportInfo.cpp",
  "QString ComputerSupportInfo::hostname() {\n  return QHostInfo::localHostName();\n}",
  ["hostname() e localIpv4() para logs.", "adUserName() via queryCurrentUserProperty.", "productLabel() retorna \"Veyon CIMED\"."]),

n("cv-product-label", "cv-support-info", "function", "productLabel()",
  "Nome do produto exibido em diálogos, bandeja e relatórios.",
  "core/src/ComputerSupportInfo.cpp",
  "QString ComputerSupportInfo::productLabel() {\n  return QStringLiteral( \"Veyon CIMED\" );\n}",
  ["Substitui branding genérico Veyon.", "Usado em idleTrayHoverText/Html.", "Aparece no ComputerSupportInfoDialog."]),

n("cv-idle-hover", "cv-support-info", "function", "idleTrayHoverHtml()",
  "Tooltip HTML da bandeja em repouso com dados da máquina e suporte.",
  "core/src/ComputerSupportInfo.cpp",
  "QString ComputerSupportInfo::idleTrayHoverHtml() {\n  return QStringLiteral( \"<b>%1</b><br/>%2 (%3)<br/>%4\" )\n    .arg( productLabel().toHtmlEscaped(), hostname(), localIpv4(), adUserName() );\n}",
  ["Rich text para QLabel na bandeja.", "Par idleTrayHoverText() para versão plain.", "Atualizado ao passar mouse no ícone."]),

n("cv-support-dialog", "cv-brand", "file", "ComputerSupportInfoDialog.cpp",
  "Diálogo F9 com informações de suporte técnico e contatos CiMED.",
  "core/src/ComputerSupportInfoDialog.cpp",
  "ComputerSupportInfoDialog::ComputerSupportInfoDialog( QWidget* parent );",
  ["Atalho F9 no worker da bandeja.", "Lista hostname, IP, usuário AD.", "Chrome CIMED via CimedDialogStyle."]),

n("cv-logs", "cv-root", "module", "Logs de acesso com integridade",
  "Escrita em UNC, linhas com SHA-256, validação diária e lookup AD.",
  "core/src/AccessLogWriter.cpp",
  "class AccessLogWriter {\n  static QString networkAccessLogPath();\n  static QString lineWithHash( const QString& message );\n};",
  ["Logs só na rede — não em disco local.", "Cada linha termina com marcador + hash.", "Validação às 15h e no startup."]),

n("cv-access-writer", "cv-logs", "file", "AccessLogWriter.cpp",
  "Writer principal: leitura/escrita UNC, hashes, alertas e agendador.",
  "core/src/AccessLogWriter.cpp",
  "bool AccessLogWriter::writeLogFileContent( const QString& filePath, const QString& content ) {\n  ensureParentDirectoryExists( filePath );\n  /* QFile WriteOnly + TamperLogProtector batch */\n}",
  ["tryReadLogFileContent com decode UTF-8/ANSI.", "recordTamperAlert evita duplicatas.", "scheduleDailyAccessLogValidation às 15:00."]),

n("cv-network-path", "cv-access-writer", "function", "networkAccessLogPath()",
  "Caminho UNC do log principal acessos_veyon.log.",
  "core/src/AccessLogWriter.cpp",
  "QString AccessLogWriter::networkAccessLogPath() {\n  return QDir( AccessLogPermissions::networkAccessLogDirectoryPath() )\n    .filePath( QStringLiteral( \"acessos_veyon.log\" ) );\n}",
  ["Combina diretório UNC + nome do arquivo.", "Espelho usado por TamperLogProtector.", "Nunca grava em %ProgramFiles%."]),

n("cv-line-hash", "cv-access-writer", "function", "lineWithHash()",
  "Anexa marcador e SHA-256 hex à mensagem de log.",
  "core/src/AccessLogWriter.cpp",
  "QString AccessLogWriter::lineWithHash( const QString& message ) {\n  return message + HashMarker() + sha256Hex( message );\n}",
  ["sha256Hex usa QCryptographicHash::Sha256.", "Validação compara hash recalculado.", "Tampering quebra a verificação."]),

n("cv-access-permissions", "cv-logs", "file", "AccessLogPermissions.cpp",
  "Define paths UNC fixos do compartilhamento vnc_veyon$.",
  "core/src/AccessLogPermissions.cpp",
  "QString AccessLogPermissions::networkLogDirectoryPath() {\n  return QStringLiteral( \"\\\\\\\\172.20.100.36\\\\vnc_veyon$\\\\veyon\" );\n}",
  ["UNC hardcoded para ambiente CiMED.", "Subpastas acessos_veyon e acessos_veyon_ad.", "Isolamento por share SMB."]),

n("cv-network-unc", "cv-access-permissions", "function", "networkLogDirectoryPath()",
  "Raiz UNC \\\\172.20.100.36\\vnc_veyon$\\veyon para todos os logs.",
  "core/src/AccessLogPermissions.cpp",
  "return QStringLiteral( \"\\\\172.20.100.36\\vnc_veyon$\\veyon\" );",
  ["Servidor de arquivos da rede hospitalar.", "Acesso via conta de serviço / GPO.", "Documentado no README e relatório técnico."]),

n("cv-access-recorder", "cv-logs", "file", "AccessLogRecorder.cpp",
  "Registra eventos de sessão remota em português com contexto AD.",
  "core/src/AccessLogRecorder.cpp",
  "void AccessLogRecorder::logOutboundAccessSuccess(\n  const QString& destinationHost, const QString& destinationIp );",
  ["Mensagens dd/MM/yyyy às HH:mm:ss.", "Origem = hostname/IP local.", "Usuário via ComputerSupportInfo::adUserName()."]),

n("cv-outbound-log", "cv-access-recorder", "function", "logOutboundAccessSuccess()",
  "Grava acesso remoto iniciado desta estação para outro host.",
  "core/src/AccessLogRecorder.cpp",
  "const auto mensagem = QStringLiteral(\n  \"Em %1 foi identificado acesso remoto via Veyon originado do equipamento %2 (%3)...\" );\nAccessLogWriter::appendNetworkAccessLogLine( lineWithHash( mensagem ) );",
  ["shouldRecordAccess filtra loopback/localhost.", "Texto jurídico em PT-BR.", "Append atômico via AccessLogWriter."]),

n("cv-inbound-disabled", "cv-access-recorder", "function", "logInboundAccessSuccess()",
  "Inbound desabilitado — veyon-server (SYSTEM) não grava UNC em todos os hosts.",
  "core/src/AccessLogRecorder.cpp",
  "void AccessLogRecorder::logInboundAccessSuccess(...) {\n  Q_UNUSED( originHost ); /* CIMED: inbound logging disabled */\n}",
  ["Evita falhas silenciosas em serviço SYSTEM.", "Outbound cobre professor→aluno.", "Documentado como decisão de arquitetura."]),

n("cv-ad-lookup", "cv-logs", "file", "AccessLogAdLookup_win.cpp",
  "Lookup LDAP do displayName do usuário de domínio para logs.",
  "core/src/AccessLogAdLookup_win.cpp",
  "QString accessLogLookupDomainUserDisplayName( const QString& loginName ) {\n  /* DsGetDcName + ldap_search_s displayName */\n}",
  ["ldapEscapeFilterValue sanitiza filtro.", "Fallback se AD indisponível.", "Chamado em currentAdUserFullName()."]),

n("cv-tamper", "cv-root", "module", "Proteção anti-tampering",
  "Monitora alterações nos logs de rede, alerta e exige senha admin.",
  "core/src/TamperLogProtector.cpp",
  "class TamperLogProtector : public QObject {\n  void checkProtectedFile( const QString& path, ... );\n};",
  ["Poll timer compara backup em memória.", "reportUnauthorizedChange grava alerta.", "Senha SHA-256 em AdminPasswordHash."]),

n("cv-tamper-protector", "cv-tamper", "file", "TamperLogProtector.cpp",
  "Watcher de integridade com batch protegido durante escritas legítimas.",
  "core/src/TamperLogProtector.cpp",
  "TamperLogProtector::TamperLogProtector( FeatureWorkerManager& m, QObject* parent ) {\n  refreshBackups();\n  auto* pollTimer = new QTimer( this );\n  connect( pollTimer, &QTimer::timeout, this, [this]() { checkNetworkAccessFile(); } );\n}",
  ["isAccessLogPath valida paths UNC.", "setWatcherSuppressed durante writes.", "writeTamperResponse em acessos_tamper_response.txt."]),

n("cv-tamper-backup", "cv-tamper-protector", "function", "refreshBackups()",
  "Carrega snapshot dos logs de rede para comparação posterior.",
  "core/src/TamperLogProtector.cpp",
  "void TamperLogProtector::refreshBackups() {\n  if ( AccessLogWriter::tryReadLogFileContent( networkAccessLogPath(), content ) )\n    m_networkAccessBackup = content;\n}",
  ["Executado no construtor e após writes.", "Dois arquivos: acessos_veyon e _ad.", "Base para detectar edição manual."]),

n("cv-tamper-check", "cv-tamper-protector", "function", "checkProtectedFile()",
  "Compara conteúdo atual com backup; dispara alerta se divergir.",
  "core/src/TamperLogProtector.cpp",
  "void TamperLogProtector::checkProtectedFile( const QString& filePath,\n  const QString& backup, const QString& label ) {\n  /* read + compare + reportUnauthorizedChange */\n}",
  ["Ignora durante beginProtectedBatch.", "Notifica SystemTrayIcon.", "recordTamperAlert no AccessLogWriter."]),

n("cv-tamper-password", "cv-tamper", "file", "TamperLogPasswordDialog.cpp",
  "Diálogo de senha para autorizar manutenção nos logs tamperados.",
  "core/src/TamperLogPasswordDialog.cpp",
  "bool TamperLogPasswordDialog::attemptAuthentication( const QString& password );",
  ["Compara SHA-256 com AdminPasswordHash.", "UI CIMED com CimedDialogStyle.", "IPC via SystemTrayIcon server."]),

n("cv-tamper-auth", "cv-tamper-password", "function", "attemptAuthentication()",
  "Valida senha admin contra hash SHA-256 embutido.",
  "core/src/TamperLogProtector.cpp",
  "constexpr auto AdminPasswordHash = \"8ab2cdcbd95fabaab0ef54a74c84a08b3e8c95c511f50c4992e9a8cac3c63863\";\nreturn passwordSha256Hex( password ) == QLatin1String( AdminPasswordHash );",
  ["Hash fixo — não plaintext em disco.", "Libera batch protegido se OK.", "Falha mantém watcher ativo."]),

n("cv-tray", "cv-root", "module", "Bandeja do sistema HiDPI",
  "Ícones multi-DPI, hover CIMED, F9 suporte e servidor de senha tamper.",
  "core/src/SystemTrayIcon.cpp",
  "class SystemTrayIcon : public QWidget {\n  void ensureSessionWorker( FeatureWorkerManager& );\n};",
  ["Worker dedicado por sessão Windows.", "Estados: Monitoring, Connected, Active.", "devicePixelRatios 1.0–2.0."]),

n("cv-tray-icon", "cv-tray", "file", "SystemTrayIcon.cpp",
  "Implementação da bandeja com renderização vetorial e overlay.",
  "core/src/SystemTrayIcon.cpp",
  "QIcon buildStatusIcon( SystemTrayIcon::StatusIndicator status, const QImage& overlayIcon );",
  ["QLocalServer para TamperLogPassword.", "Hover panel com idleTrayHoverHtml.", "ensureSessionWorker no server start."]),

n("cv-tray-render", "cv-tray-icon", "function", "renderTrayStatusPixmap()",
  "Desenha pixmap do estado da bandeja com gradiente e glyph central.",
  "core/src/SystemTrayIcon.cpp",
  "QPixmap renderTrayStatusPixmap( StatusIndicator status, int logicalSize, qreal devicePixelRatio ) {\n  QPixmap pixmap( logicalSize * dpr, logicalSize * dpr );\n  pixmap.setDevicePixelRatio( dpr );\n  /* QPainter radial gradient + icon */\n}",
  ["Cores por status (verde=c monitoring).", "Antialiasing em QPainter.", "Tamanhos 16–128 lógicos."]),

n("cv-tray-hidpi", "cv-tray-icon", "function", "buildStatusIcon()",
  "Gera QIcon com múltiplos devicePixelRatio para Windows 125%/150%.",
  "core/src/SystemTrayIcon.cpp",
  "QList<qreal> devicePixelRatios = {1.0, 1.25, 1.5, 1.75, 2.0};\nfor ( const auto dpr : devicePixelRatios )\n  for ( const auto size : {16, 20, 22, 24, 32, 48, 64, 128} )\n    icon.addPixmap( renderTrayStatusPixmap( status, size, dpr ) );",
  ["Adiciona DPR da tela se ausente na lista.", "Overlay do professor só no DPR atual.", "Corrige ícone borrado na bandeja Win11."]),

n("cv-server", "cv-root", "module", "veyon-server",
  "Inicialização do serviço com proteção de logs e worker da bandeja.",
  "server/src/ComputerControlServer.cpp",
  "class ComputerControlServer { bool start(); };",
  ["Roda como serviço Windows.", "Integra VNC proxy + FeatureWorkerManager.", "Tooltip idle via ComputerSupportInfo."]),

n("cv-control-server", "cv-server", "file", "ComputerControlServer.cpp",
  "Servidor de controle com hooks CIMED no startup.",
  "server/src/ComputerControlServer.cpp",
  "bool ComputerControlServer::start() {\n  AccessLogWriter::startTamperedLogProtection( m_featureWorkerManager, this );\n  AccessLogWriter::validateAccessLogsOnStartup();\n  VeyonCore::builtinFeatures().systemTrayIcon().ensureSessionWorker( m_featureWorkerManager );\n}",
  ["startTamperedLogProtection instancia TamperLogProtector.", "validateAccessLogsOnStartup na subida.", "scheduleDailyAccessLogValidation às 15h."]),

n("cv-server-tooltip", "cv-control-server", "function", "updateTrayToolTip()",
  "Tooltip da bandeja usa idleTrayHoverText quando sem sessão ativa.",
  "server/src/ComputerControlServer.cpp",
  "toolTip = ComputerSupportInfo::idleTrayHoverText();",
  ["Substitui texto genérico Veyon.", "Atualizado a cada mudança de estado.", "Inclui hostname e usuário AD."]),

n("cv-plugins", "cv-root", "module", "Plugins customizados",
  "RemoteAccess com diálogos CIMED e textos de suporte.",
  "plugins/remoteaccess/RemoteAccessFeaturePlugin.cpp",
  "class RemoteAccessFeaturePlugin : public QObject, public PluginInterface { ... };",
  ["Plugin de acesso remoto VNC.", "Usa CimedHostInputDialog e PasswordDialog.", "Mensagens com idleTrayHoverText."]),

n("cv-remote-plugin", "cv-plugins", "file", "RemoteAccessFeaturePlugin.cpp",
  "Fluxo de conexão remota com UI CIMED e logs outbound.",
  "plugins/remoteaccess/RemoteAccessFeaturePlugin.cpp",
  "CimedHostInputDialog hostDialog( parent );\nPasswordDialog passwordDialog( parent );\nAccessLogRecorder::logOutboundAccessSuccess( host, ip );",
  ["Coleta host antes da senha.", "Registra sucesso via AccessLogRecorder.", "Notificação com branding CIMED."]),

n("cv-deploy", "cv-root", "module", "Deploy Veyon_Custom",
  "Pacote portátil pronto para GPO/SCCM nas estações CiMED.",
  "Veyon_Custom/",
  "Veyon_Custom/\n  veyon-master.exe\n  veyon-worker.exe\n  plugins/\n  qt/",
  ["Build Release copiado para Veyon_Custom/.", "Inclui DLLs Qt e plugins.", "README documenta fases restore-*."]),

n("cv-compile", "cv-root", "file", "Compilação win64",
  "CMake + Ninja (MSYS2): qt-cmake e alvo windows-binaries — gera DLLs e EXEs CIMED.",
  ".ci/windows/build.sh",
  "#!/usr/bin/env bash\nninja windows-binaries",
  ["Abra MSYS2 MinGW 64-bit.", "cd veyon-4.10.4-src (1)/veyon-4.10.4", "Execute .ci/windows/build.sh ou qt-cmake em build-win64 + ninja.", "Copie artefatos para Veyon_Custom com copy_binary_to_veyon_custom.ps1."]),

n("cv-installers-dual", "cv-deploy", "file", "Instaladores lab + posto",
  "NSIS: gera os dois setup.exe win64 (laboratório com Master e posto/aluno sem Master).",
  "scripts/build_veyon_custom_installer.ps1",
  "powershell -File scripts\\build_veyon_custom_installer.ps1 -Architecture win64-dual",
  ["Requer NSIS (makensis) e pasta Veyon_Custom com binários.", "Executa sanitize + payload + makensis para lab e posto.", "Saída: dist\\Veyon-CIMED-1.0-win64-setup.exe e dist\\...-posto-setup.exe.", "GPO silencioso: setup.exe /S"]),

n("cv-veyon-custom", "cv-deploy", "file", "Veyon_Custom/",
  "Layout de instalação portátil sem installer MSI.",
  "Veyon_Custom/",
  "| Fase | Tag restore | Entrega |\n| UI+DPI | restore-pos-etapa5-dpi | Telas CIMED + bandeja |\n| Logs rede | este ciclo | UNC 172.20.100.36 |",
  ["Copiar pasta inteira para destino.", "Configurar GPO para autostart worker.", "Tags git restore-* para rollback."]),

n("cv-docs", "cv-deploy", "file", "docs/",
  "Relatórios PDF/MD: técnico executivo e estrutura de código.",
  "docs/RELATORIO-TECNICO-PROJETO-CIMED.pdf",
  "docs/\n  PROJETO-CIMED.md\n  RELATORIO-ESTRUTURA-CODIGO-CIMED.pdf\n  imagens/bandeja-todos-estados.png",
  ["Mapa visual em PROJETO-CIMED.md.", "PDF executivo ≤5 páginas.", "Fluxogramas Mermaid no README."]),
]

PROJECT = {
    "slug": "customize-veyon",
    "name": "CustomizeVeyonProject",
    "repoUrl": "https://github.com/CanonEngineer/CustomizeVeyonProject",
    "color": "#ef4444",
    "icon": "cpp",
    "stack": "Qt/C++ Veyon 4.10.4",
    "summary": "Veyon CIMED/HCFMB — UI HiDPI, logs SHA-256 em UNC, anti-tampering e deploy portátil.",
    "nodes": NODES,
}

if __name__ == "__main__":
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(PROJECT, f, ensure_ascii=False, indent=2)
    print(f"CustomizeVeyonProject: {len(NODES)} nós -> {OUT}")
