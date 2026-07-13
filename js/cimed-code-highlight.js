/* Destaca em vermelho trechos de customização CIMED (estudo no Tree of Knowledge) */
const CimedCodeHighlight = (() => {
  const FULL_CUSTOM_FILE = /(?:^|[\\/])(?:Cimed|AccessLog|TamperLog|ComputerSupport)/i;

  const LINE_MARKERS = [
    /Cimed/i,
    /\bCIMED\b/,
    /cimed-/i,
    /AccessLog/i,
    /TamperLog/i,
    /ComputerSupportInfo/i,
    /BuildSignature/i,
    /VersionAlert/i,
    /ShowVersionAlert/i,
    /showVersionAlert/i,
    /172\.20\.100\.36/,
    /vnc_veyon/i,
    /acessos_veyon/i,
    /alertas_versao/i,
    /idleTrayHover/i,
    /productLabel\s*\(/,
    /productVersion\s*\(/,
    /networkAccessLog/i,
    /AdminPasswordHash/,
    /startTamperedLogProtection/,
    /validateAccessLogsOnStartup/,
    /isSentinelAlertHost/,
    /handleInboundClientSignature/,
    /protocolToken\s*\(/,
    /isHomologated\s*\(/,
    /CimedDialogStyle/,
    /CimedHostInputDialog/,
    /CimedVersion/
  ];

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isFullCustomFile(filePath) {
    return FULL_CUSTOM_FILE.test(filePath || '');
  }

  function isCustomLine(line) {
    return LINE_MARKERS.some((re) => re.test(line));
  }

  function shouldHighlightProject(slug) {
    return slug === 'customize-veyon';
  }

  /**
   * Converte código em HTML com linhas de customização em vermelho.
   * Arquivos 100% CIMED: quase todas as linhas úteis em vermelho.
   * Arquivos mistos (ex.: SystemTrayIcon.cpp): só linhas CIMED.
   */
  function toHighlightedHtml(code, filePath) {
    if (!code) return '';
    const fullCustom = isFullCustomFile(filePath);
    const lines = String(code).split('\n');

    return lines.map((line) => {
      const escaped = escapeHtml(line);
      const blank = !line.trim();
      const mark = !blank && (fullCustom || isCustomLine(line));
      if (mark) {
        return '<span class="code-cimed">' + escaped + '</span>';
      }
      return escaped;
    }).join('\n');
  }

  function renderInto(codeEl, code, filePath, projectSlug) {
    if (!codeEl) return;
    if (shouldHighlightProject(projectSlug)) {
      codeEl.innerHTML = toHighlightedHtml(code, filePath);
      codeEl.classList.add('code-with-cimed');
    } else {
      codeEl.textContent = code || '';
      codeEl.classList.remove('code-with-cimed');
    }
  }

  return {
    shouldHighlightProject,
    isFullCustomFile,
    toHighlightedHtml,
    renderInto
  };
})();
