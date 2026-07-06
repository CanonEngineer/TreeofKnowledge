#!/usr/bin/env python3
"""Gera scripts/dropbox-project.json — árvore JavaScriptDropBoxProject."""
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "dropbox-project.json")

def n(id, parent, layer, title, desc, file, code, impl):
    return {
        "id": id, "parent": parent, "layer": layer, "title": title,
        "description": desc, "file": file, "code": code.strip(),
        "implementation": impl if isinstance(impl, list) else [impl],
    }

NODES = [
n("jdb-root", None, "root", "JavaScriptDropBoxProject",
  "Clone Dropbox no browser — Express serve a SPA, Firebase Realtime DB + Storage, upload com barra de progresso.",
  "public/src/",
  "// HiperCloud — navegação SPA sem reload\n// Firebase Storage + Realtime Database\nwindow.app = new DropBoxController();",
  ["Clone o repo e npm install.", "Configure firebaseConfig no controller.", "npm start → porta 3000."]),

n("jdb-backend", "jdb-root", "module", "Backend Express",
  "Servidor Node com EJS, static em public/ e rotas legacy com Formidable.",
  "app.js",
  "var app = express();\napp.use(express.static(path.join(__dirname, 'public')));\napp.use('/', indexRouter);",
  ["Express 4 + cookie-parser.", "views/index.ejs renderiza o clone.", "Rotas /upload e /file para modo local legado."]),

n("jdb-app", "jdb-backend", "file", "app.js",
  "Bootstrap do Express: middlewares, views e routers.",
  "app.js",
  "app.set('view engine', 'ejs');\napp.use(logger('dev'));\napp.use(express.json());\napp.use(express.static(path.join(__dirname, 'public')));",
  ["Monte indexRouter em /.", "Error handler renderiza error.ejs.", "Export module.exports = app."]),

n("jdb-bin-www", "jdb-backend", "file", "bin/www",
  "HTTP server na porta 3000 com tratamento EADDRINUSE.",
  "bin/www",
  "var port = normalizePort(process.env.PORT || '3000');\nvar server = http.createServer(app);\nserver.listen(port);",
  ["normalizePort valida número.", "debug('app:server') no listen.", "Usado por npm start."]),

n("jdb-routes-mod", "jdb-backend", "module", "routes/index.js",
  "Rotas REST para home, upload multipart e delete de arquivos locais.",
  "routes/index.js",
  "router.get('/', ...);\nrouter.post('/upload', ...);\nrouter.get('/file', ...);\nrouter.delete('/file', ...);",
  ["formidable.IncomingForm com uploadDir ./upload.", "GET /file lê path da query.", "Versão cloud usa Firebase no client."]),

n("jdb-route-home", "jdb-routes-mod", "function", "GET /",
  "Renderiza index.ejs com layout Dropbox clone.",
  "routes/index.js",
  "router.get('/', function(req, res, next) {\n  res.render('index', { title: 'Express' });\n});",
  ["EJS injeta HTML da UI.", "Scripts Firebase no final da página.", "DropBoxController inicia no index.js."]),

n("jdb-route-upload", "jdb-routes-mod", "function", "POST /upload",
  "Upload local via Formidable (legado antes do Firebase).",
  "routes/index.js",
  "let form = new formidable.IncomingForm({ uploadDir: './upload', keepExtensions: true });\nform.parse(req, (err, fields, files) => { res.json({ files }); });",
  ["Multipart para pasta upload/.", "Retorna JSON com metadados.", "Substituído por Firebase Storage no client."]),

n("jdb-route-file-get", "jdb-routes-mod", "function", "GET /file",
  "Serve arquivo do disco por query ?path=.",
  "routes/index.js",
  "let path = './' + req.query.path;\nfs.readFile(path, (err, data) => res.status(200).end(data));",
  ["404 se não existir.", "Usado no modo local comentado.", "Cloud abre downloadURL direto."]),

n("jdb-route-delete", "jdb-routes-mod", "function", "DELETE /file",
  "Remove arquivo local via Formidable fields.",
  "routes/index.js",
  "form.parse(req, (err, fields) => {\n  fs.unlink('./' + fields.path, err => res.json({ fields }));\n});",
  ["fields.path do body multipart.", "Resposta JSON com key.", "Espelho do removeFile Firebase."]),

n("jdb-frontend", "jdb-root", "module", "Frontend SPA",
  "Interface estilo Dropbox com sidebar, breadcrumb e grid de arquivos.",
  "views/index.ejs",
  "<div id=\"browse-location\"></div>\n<ul id=\"list-of-files-and-directories\"></ul>\n<div id=\"react-snackbar-root\">...</div>",
  ["Bootstrap + dropbox-clone.css.", "Botões nova pasta, renomear, excluir.", "Input #files oculto para upload."]),

n("jdb-index-ejs", "jdb-frontend", "file", "views/index.ejs",
  "Template EJS com sidebar Hiperware e área de arquivos.",
  "views/index.ejs",
  "<nav class=\"col-md-2 sidebar\">...</nav>\n<main id=\"browse-location\">...</main>",
  ["Logo SVG estilo Dropbox.", "Inclui Firebase SDK.", "Carrega index.js no final."]),

n("jdb-index-js", "jdb-frontend", "file", "public/src/index.js",
  "Bootstrap do controller após DOM pronto.",
  "public/src/index.js",
  "window.app = new DropBoxController();",
  ["Uma linha instancia o app.", "Classe em controller/DropBoxController.js.", "Expõe global para debug."]),

n("jdb-dropbox-css", "jdb-frontend", "file", "dropbox-clone.css",
  "Estilos do grid, seleção múltipla e snackbar de upload.",
  "public/assets/css/dropbox-clone.css",
  ".selected { outline: 2px solid #0062ff; }\n.mc-progress-bar-fg { transition: width .2s; }",
  ["Tiles com preview SVG.", "Breadcrumb segmentado.", "Modal de progresso fixo no rodapé."]),

n("jdb-controller", "jdb-root", "module", "DropBoxController",
  "Classe central: Firebase, navegação, CRUD e seleção Ctrl/Shift.",
  "public/src/controller/DropBoxController.js",
  "class DropBoxController {\n  constructor() {\n    this.currentFolder = ['HiperCloud'];\n    this.connDatabase();\n    this.initEvents();\n    this.openFolder();\n  }\n}",
  ["currentFolder é pilha de paths.", "onselectionchange Event custom.", "Refs DOM no constructor."]),

n("jdb-conn-db", "jdb-controller", "function", "connDatabase()",
  "Inicializa Firebase App com config do projeto.",
  "public/src/controller/DropBoxController.js",
  "const firebaseConfig = { /* credenciais */ };\nfirebase.initializeApp(firebaseConfig);",
  ["Realtime Database + Storage.", "SDK carregado no EJS.", "Config não commitada no repo público."]),

n("jdb-firebase-ref", "jdb-controller", "function", "getFirebaseRef()",
  "Retorna ref do Realtime DB para o path atual.",
  "public/src/controller/DropBoxController.js",
  "getFirebaseRef(path) {\n  if (!path) path = this.currentFolder.join('/');\n  return firebase.database().ref(path);\n}",
  ["Join com '/'.", "Usado em push/set/on.", "off('value') ao trocar pasta."]),

n("jdb-navigation", "jdb-root", "module", "Navegação de pastas",
  "Breadcrumb, leitura reativa e duplo-clique para entrar em pastas.",
  "public/src/controller/DropBoxController.js",
  "openFolder() → renderNav() + readFiles()",
  ["SPA sem reload de página.", "lastFolder guarda listener anterior.", "Duplo-clique push no currentFolder."]),

n("jdb-open-folder", "jdb-navigation", "function", "openFolder()",
  "Troca de pasta: desliga listener antigo e recarrega lista.",
  "public/src/controller/DropBoxController.js",
  "openFolder() {\n  if (this.lastFolder) this.getFirebaseRef(this.lastFolder).off('value');\n  this.renderNav();\n  this.readFiles();\n}",
  ["Evita memory leak no on('value').", "Atualiza breadcrumb.", "Chamado ao clicar pasta ou breadcrumb."]),

n("jdb-render-nav", "jdb-navigation", "function", "renderNav()",
  "Monta breadcrumb clicável da pilha currentFolder.",
  "public/src/controller/DropBoxController.js",
  "span.innerHTML = `<a href=\"#\" data-path=\"${path.join('/')}\">${folderName}</a>`;",
  ["Último segmento sem link.", "SVG seta entre segmentos.", "Click trunca currentFolder."]),

n("jdb-read-files", "jdb-navigation", "function", "readFiles()",
  "Escuta Firebase value e renderiza grid de arquivos.",
  "public/src/controller/DropBoxController.js",
  "this.getFirebaseRef().on('value', snapshot => {\n  snapshot.forEach(item => {\n    this.listFilesEl.appendChild(this.getFileView(data, key));\n  });\n});",
  ["Limpa innerHTML a cada snapshot.", "Filtra itens com data.type.", "initEventsLi em cada <li>."]),

n("jdb-upload-mod", "jdb-root", "module", "Upload Firebase Storage",
  "Envio com barra de progresso, ETA e metadata downloadURL.",
  "public/src/controller/DropBoxController.js",
  "uploadTask(files) → uploadProgress() → push no Realtime DB",
  ["Formidable legado comentado no final.", "modalShow snackbar inferior.", "Promise.all para múltiplos arquivos."]),

n("jdb-upload-task", "jdb-upload-mod", "function", "uploadTask()",
  "fileRef.put(file) com state_changed e getDownloadURL.",
  "public/src/controller/DropBoxController.js",
  "let task = fileRef.put(file);\ntask.on('state_changed', snapshot => this.uploadProgress(...));\ntask.snapshot.ref.getDownloadURL().then(url => ref.updateMetadata({ customMetadata: { downloadURL: url } }));",
  ["child(file.name) no path atual.", "Resolve metadata após upload.", "push no DB com name, type, path, size."]),

n("jdb-upload-progress", "jdb-upload-mod", "function", "uploadProgress()",
  "Calcula % e tempo restante com base em bytesTransferred.",
  "public/src/controller/DropBoxController.js",
  "let porcent = parseInt((loaded / total) * 100);\nlet timeleft = ((100 - porcent) * timespent) / porcent;\nthis.progressBarEl.style.width = `${porcent}%`;",
  ["startUploadTime no onloadstart (ajax legado).", "nameFileEl mostra arquivo atual.", "formatTimeToHuman no timeleftEl."]),

n("jdb-format-time", "jdb-upload-mod", "function", "formatTimeToHuman()",
  "Converte ms restantes em texto PT-BR legível.",
  "public/src/controller/DropBoxController.js",
  "if (hours > 0) return `${hours} horas, ${minutes} minutos e ${seconds} segundos`;",
  ["Horas, minutos ou só segundos.", "Retorna '' se instantâneo.", "Exibido na snackbar de upload."]),

n("jdb-modal-show", "jdb-upload-mod", "function", "modalShow()",
  "Exibe/oculta snackbar de progresso (#react-snackbar-root).",
  "public/src/controller/DropBoxController.js",
  "modalShow(show = true) {\n  this.snackModalEl.style.display = show ? 'block' : 'none';\n}",
  ["Chamado no change do input files.", "uploadComplete(false) ao terminar.", "Desabilita btn-send durante upload."]),

n("jdb-crud", "jdb-root", "module", "CRUD arquivos e pastas",
  "Criar pasta, renomear, excluir recursivo no DB + Storage.",
  "public/src/controller/DropBoxController.js",
  "initEvents() → removeTask() → removeFolder() / removeFile()",
  ["prompt() para nome pasta/renomear.", "selectionchange controla botões.", "Promise.all em removeTask."]),

n("jdb-init-events", "jdb-crud", "function", "initEvents()",
  "Bind nova pasta, delete, rename e input de upload.",
  "public/src/controller/DropBoxController.js",
  "this.btnNewFolder.addEventListener('click', () => {\n  this.getFirebaseRef().push().set({ name, type: 'folder', path: ... });\n});",
  ["btnSendFile dispara inputFiles.click().", "change chama uploadTask.", "selectionchange listener na lista."]),

n("jdb-remove-task", "jdb-crud", "function", "removeTask()",
  "Deleta todos os itens selecionados com Promise.all.",
  "public/src/controller/DropBoxController.js",
  "this.getSelection().forEach(li => {\n  promises.push(file.type === 'folder' ? this.removeFolder(...) : this.removeFile(...));\n});",
  ["Remove child key no Realtime DB.", "Pasta recursiva antes do Storage.", "Erro logado no console."]),

n("jdb-remove-folder", "jdb-crud", "function", "removeFolder()",
  "Recursão: percorre snapshot e apaga subpastas/arquivos.",
  "public/src/controller/DropBoxController.js",
  "folderRef.on('value', snapshot => {\n  snapshot.forEach(item => {\n    if (data.type === 'folder') this.removeFolder(...);\n    else this.removeFile(...);\n  });\n  folderRef.remove();\n});",
  ["Promise por item filho.", "folderRef.off após leitura.", "Apaga nó pai no final."]),

n("jdb-remove-file", "jdb-crud", "function", "removeFile()",
  "firebase.storage().ref(ref).child(name).delete().",
  "public/src/controller/DropBoxController.js",
  "let fileRef = firebase.storage().ref(ref).child(name);\nreturn fileRef.delete();",
  ["Path = currentFolder + nome.", "Chamado na recursão.", "DB key removido em removeTask."]),

n("jdb-selection", "jdb-root", "module", "Seleção Ctrl / Shift",
  "Lógica de multi-select estilo explorador de arquivos.",
  "public/src/controller/DropBoxController.js",
  "initEventsLi(li) — click, dblclick, ctrl, shift",
  ["CustomEvent selectionchange.", "getSelection() retorna .selected.", "Toggle botões rename/delete."]),

n("jdb-get-selection", "jdb-selection", "function", "getSelection()",
  "querySelectorAll('.selected') na lista de arquivos.",
  "public/src/controller/DropBoxController.js",
  "getSelection() {\n  return this.listFilesEl.querySelectorAll('.selected');\n}",
  ["Usado em removeTask e rename.", "Case 0/1/N no selectionchange.", "Renomear só com 1 item."]),

n("jdb-init-events-li", "jdb-selection", "function", "initEventsLi()",
  "Click com Ctrl toggle; Shift seleciona intervalo; dblclick abre.",
  "public/src/controller/DropBoxController.js",
  "if (e.shiftKey) { /* indexStart..indexEnd */ }\nif (!e.ctrlKey) { clear selected }\nli.classList.toggle('selected');",
  ["dblclick pasta → openFolder.", "dblclick arquivo → window.open(path).", "dispatchEvent selectionchange."]),

n("jdb-icons", "jdb-root", "module", "Ícones por MIME type",
  "SVG inline para pasta, imagem, PDF, Office, áudio e vídeo.",
  "public/src/controller/DropBoxController.js",
  "getFileIconView(file) — switch(file.type)",
  ["folder → SVG azul Dropbox.", "image/jpeg, application/pdf, etc.", "default → ícone genérico."]),

n("jdb-get-file-icon", "jdb-icons", "function", "getFileIconView()",
  "Switch por MIME retornando template SVG 160×160.",
  "public/src/controller/DropBoxController.js",
  "switch (file.type) {\n  case 'folder': return `<svg>...</svg>`;\n  case 'image/jpeg': ...\n  case 'application/pdf': ...\n}",
  ["Word, Excel, PowerPoint mapeados.", "audio/mp3 e video/mp4.", "HTML string injetado no <li>."]),

n("jdb-get-file-view", "jdb-icons", "function", "getFileView()",
  "Cria <li> com dataset.file JSON e ícone + nome.",
  "public/src/controller/DropBoxController.js",
  "li.dataset.key = key;\nli.dataset.file = JSON.stringify(file);\nli.innerHTML = `${this.getFileIconView(file)}<div class=\"name\">${file.name}</div>`;",
  ["initEventsLi antes de append.", "Nome centralizado abaixo do ícone.", "key do Firebase no dataset."]),

n("jdb-ajax", "jdb-backend", "function", "ajax()",
  "XHR Promise com upload.onprogress (modo local legado).",
  "public/src/controller/DropBoxController.js",
  "ajax(url, method, formData, onprogress, onloadstart) {\n  return new Promise((resolve, reject) => { ... });\n}",
  ["Usado no uploadTask comentado.", "JSON.parse na response.", "Espelha API fetch moderna."]),

n("jdb-firebase-storage", "jdb-upload-mod", "file", "Firebase Storage",
  "Blob storage na nuvem com downloadURL em customMetadata.",
  "Firebase Console → Storage",
  "fileRef.put(file) → getDownloadURL() → updateMetadata({ customMetadata: { downloadURL } })",
  ["Regras de segurança no console.", "Path espelha currentFolder.", "URL aberta em nova aba no dblclick."]),
]

PROJECT = {
    "slug": "javascript-dropbox",
    "name": "JavaScriptDropBoxProject",
    "repoUrl": "https://github.com/CanonEngineer/JavaScriptDropBoxProject",
    "color": "#eab308",
    "icon": "javascript",
    "stack": "Express + Firebase",
    "summary": "Clone Dropbox — Firebase Storage, barra de progresso, seleção Ctrl/Shift e ícones por MIME.",
    "nodes": NODES,
}

if __name__ == "__main__":
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(PROJECT, f, ensure_ascii=False, indent=2)
    print(f"JavaScriptDropBoxProject: {len(NODES)} nós -> {OUT}")
