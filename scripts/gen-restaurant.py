#!/usr/bin/env python3
"""Gera scripts/restaurant-project.json — JavaScriptRestaurantProject."""
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "restaurant-project.json")

def n(id, parent, layer, title, desc, file, code, impl):
    return {
        "id": id, "parent": parent, "layer": layer, "title": title,
        "description": desc, "file": file, "code": code.strip(),
        "implementation": impl if isinstance(impl, list) else [impl],
    }

NODES = [
n("jsr-root", None, "root", "JavaScriptRestaurantProject",
  "Restaurante Saboroso — site + painel admin com Express, EJS, MySQL, Redis e AdminLTE.",
  "app.js",
  "// Restaurante Saboroso\n// MySQL tb_menus, tb_reservations, tb_contacts\n// Admin /admin com AdminLTE",
  ["Clone o repo e npm install.", "Configure MySQL database saboroso e Redis.", "npm start → porta 3000."]),

n("jsr-backend", "jsr-root", "module", "Backend Express",
  "Servidor com sessão Redis, upload Formidable e rotas públicas/admin.",
  "app.js",
  "app.use(session({ store: new RedisStore({ host:'localhost', port:6379 }) }));\napp.use('/', indexRouter);\napp.use('/admin', adminRouter);",
  ["EJS view engine.", "express.static em public/.", "Middleware multipart para fotos do menu."]),

n("jsr-app", "jsr-backend", "file", "app.js",
  "Bootstrap: sessão Redis, parsers, static e routers.",
  "app.js",
  "var RedisStore = require('connect-redis')(session);\napp.use(session({ store: new RedisStore(...), secret:'p@ssw0rd' }));",
  ["Formidable salva em public/images/.", "Cookie-parser e morgan logger.", "Error handler renderiza error.ejs."]),

n("jsr-bin-www", "jsr-backend", "file", "bin/www",
  "HTTP server na porta 3000 com nodemon.",
  "bin/www",
  "var port = normalizePort(process.env.PORT || '3000');\nserver.listen(port);",
  ["npm start usa nodemon.", "Tratamento EADDRINUSE.", "Debug app:server."]),

n("jsr-formidable", "jsr-app", "function", "Middleware Formidable",
  "Parse multipart antes das rotas — upload de fotos do cardápio.",
  "app.js",
  "if (req.method === 'POST' && contentType.indexOf('multipart/form-data') > -1) {\n  form.parse(req, (err, fields, files) => { req.body = fields; req.files = files; next(); });\n}",
  ["uploadDir: public/images.", "keepExtensions: true.", "Disponível em rotas admin de menus."]),

n("jsr-session", "jsr-app", "function", "Sessão Redis",
  "express-session com connect-redis para painel admin.",
  "app.js",
  "app.use(session({ store: new RedisStore({ host:'localhost', port:6379 }), secret:'p@ssw0rd', resave:true }));",
  ["Redis na porta 6379.", "req.session.user após login.", "Logout deleta session.user."]),

n("jsr-db", "jsr-root", "module", "Banco MySQL",
  "Conexão mysql2 com database saboroso.",
  "inc/db.js",
  "const connection = mysql.createConnection({ host:'localhost', user:'user', database:'saboroso', multipleStatements:true });",
  ["Tabelas: tb_menus, tb_reservations, tb_contacts, tb_users, tb_emails.", "Promises nos módulos inc/.", "Pagination usa FOUND_ROWS()."]),

n("jsr-routes-public", "jsr-root", "module", "Rotas públicas",
  "Site do cliente: home, cardápio, reservas e contato.",
  "routes/index.js",
  "router.get('/', ...);\nrouter.get('/menus', ...);\nrouter.get('/reservations', ...);\nrouter.post('/contacts', ...);",
  ["EJS com background hero.", "Validação server-side nos POST.", "E-mails de notificação opcionais."]),

n("jsr-home", "jsr-routes-public", "function", "GET /",
  "Home com lista de menus em destaque.",
  "routes/index.js",
  "menus.getMenus().then(results => {\n  res.render('index', { title: 'Restaurante Saboroso!', menus: results, isHome: true });\n});",
  ["Template index.ejs.", "Flag isHome para navbar.", "Fotos em public/images/."]),

n("jsr-menus-page", "jsr-routes-public", "function", "GET /menus",
  "Página do cardápio completo com preços.",
  "routes/index.js",
  "res.render('menus', { title: 'Menus - Restaurante Saboroso!', h1: 'Saboreie nosso menu!', menus: results });",
  ["background images/img_bg_1.jpg.", "Loop EJS nos itens.", "Dados de tb_menus."]),

n("jsr-reservations-page", "jsr-routes-public", "function", "POST /reservations",
  "Formulário de reserva de mesa com validação.",
  "routes/index.js",
  "if(!req.body.name) reservations.render(req, res, 'Digite o nome');\nelse reservations.save(req.body).then(...);",
  ["Campos: name, email, people, date, time.", "Conversão data DD/MM/YYYY.", "Mensagem de sucesso no render."]),

n("jsr-contacts-page", "jsr-routes-public", "function", "POST /contacts",
  "Formulário de contato gravado em tb_contacts.",
  "routes/index.js",
  "contacts.save(req.body).then(() => contacts.render(req, res, null, 'Contato enviado com sucesso!'));",
  ["Valida name, email, message.", "background img_bg_3.jpg.", "Admin lista em /admin/contacts."]),

n("jsr-admin-routes", "jsr-root", "module", "Painel Admin",
  "AdminLTE: dashboard, CRUD menus, reservas, usuários.",
  "routes/admin.js",
  "router.get('/', admin.dashboard());\nrouter.post('/login', users.login);\nrouter.get('/menus', ...);",
  ["moment.locale('pt-BR').", "req.menus = admin.getMenus(req).", "Templates em views/admin/."]),

n("jsr-dashboard", "jsr-admin-routes", "function", "admin.dashboard()",
  "Contadores de contatos, menus, reservas e usuários.",
  "inc/admin.js",
  "SELECT (SELECT COUNT(*) FROM tb_contacts) AS nrcontacts, (SELECT COUNT(*) FROM tb_menus) AS nrmenus, ...",
  ["Cards no admin/index.ejs.", "AdminLTE boxes.", "Promise resolve results[0]."]),

n("jsr-admin-login", "jsr-admin-routes", "function", "POST /admin/login",
  "Autenticação por email/senha em tb_users.",
  "inc/users.js",
  "users.login(email, password).then(user => res.redirect('/admin')).catch(err => users.render(req, res, err.message));",
  ["Comparação password plain (legado).", "Sessão req.session.user.", "Redirect /admin/login se falhar."]),

n("jsr-menus-mod", "jsr-root", "module", "CRUD Cardápio",
  "Gerencia tb_menus com foto, título, descrição e preço.",
  "inc/menus.js",
  "getMenus() / save(fields, files) / delete(id)",
  ["Upload photo → public/images/.", "UPDATE ou INSERT conforme fields.id.", "Listagem paginada no admin."]),

n("jsr-menus-get", "jsr-menus-mod", "function", "getMenus()",
  "SELECT * FROM tb_menus ORDER BY title.",
  "inc/menus.js",
  "conn.query('SELECT * FROM tb_menus ORDER BY title', (err, results) => resolve(results));",
  ["Usado na home e /menus.", "Admin lista com edição.", "Cada item tem photo path."]),

n("jsr-menus-save", "jsr-menus-mod", "function", "save()",
  "INSERT/UPDATE com foto opcional via Formidable.",
  "inc/menus.js",
  "fields.photo = `images/${path.parse(files.photo.path).base}`;\nINSERT INTO tb_menus (title, description, price, photo) VALUES(?, ?, ?, ?)",
  ["Rejeita se novo item sem foto.", "queryPhoto dinâmico no UPDATE.", "Params title, description, price."]),

n("jsr-reservations-mod", "jsr-root", "module", "Reservas",
  "tb_reservations com paginação e moment.js.",
  "inc/reservations.js",
  "save(fields) / getReservations(req) / delete(id)",
  ["Data convertida de DD/MM/YYYY para MySQL.", "Classe Pagination.", "Admin confirma/exclui reservas."]),

n("jsr-reservations-save", "jsr-reservations-mod", "function", "save()",
  "Grava reserva com nome, email, pessoas, data e hora.",
  "inc/reservations.js",
  "INSERT INTO tb_reservations (name, email, people, date, time) VALUES(?, ?, ?, ?, ?)",
  ["UPDATE se fields.id > 0.", "Validação no router antes do save.", "Render com error/success."]),

n("jsr-pagination", "jsr-reservations-mod", "file", "Pagination.js",
  "Paginação SQL com FOUND_ROWS e navegação.",
  "inc/Pagination.js",
  "class Pagination { getPage(page) { conn.query([query, 'SELECT FOUND_ROWS() AS FOUND_ROWS'].join(';'), ...) } }",
  ["itemPerPage default 10.", "getNavigation() gera links.", "Usado em reservas e listagens admin."]),

n("jsr-users-mod", "jsr-root", "module", "Usuários Admin",
  "Login e CRUD de tb_users.",
  "inc/users.js",
  "login(email, password) / getUsers() / save(fields)",
  ["Render admin/login.ejs.", "Lista usuários no admin.", "Senha comparada diretamente."]),

n("jsr-contacts-mod", "jsr-root", "module", "Contatos",
  "Mensagens do formulário público.",
  "inc/contacts.js",
  "save(fields) / getContacts() / delete(id)",
  ["INSERT tb_contacts.", "ORDER BY register DESC.", "Admin visualiza e exclui."]),

n("jsr-emails-mod", "jsr-root", "module", "Lista de E-mails",
  "Newsletter / captura de e-mails.",
  "inc/emails.js",
  "getEmails() / save(req) / delete(id)",
  ["INSERT tb_emails (email).", "Validação Digite o e-mail.", "Admin gerencia lista."]),

n("jsr-admin-inc", "jsr-admin-routes", "file", "admin.js",
  "Sidebar AdminLTE e helper getParams.",
  "inc/admin.js",
  "getMenus(req) → [{ text:'Menu', href:'/admin/menus', icon:'cutlery' }, ...]",
  ["Marca active conforme req.url.", "getParams merge menus + data.", "dashboard() agrega COUNTs."]),

n("jsr-frontend", "jsr-root", "module", "Frontend EJS",
  "Templates públicos com hero e Bootstrap.",
  "views/",
  "index.ejs / menus.ejs / reservations.ejs / contacts.ejs",
  ["Imagens em public/images/.", "Partials header/footer.", "Tema Restaurante Saboroso."]),

n("jsr-adminlte", "jsr-admin-routes", "file", "AdminLTE",
  "Painel admin com tema AdminLTE e Bower.",
  "public/admin/",
  "dist/css/AdminLTE.min.css / dist/js/app.min.js",
  ["Sidebar com ícones Font Awesome.", "Skins skin-blue.", "Charts Flot opcionais."]),

n("jsr-moment", "jsr-reservations-mod", "function", "moment pt-BR",
  "Formatação de datas nas views admin.",
  "routes/admin.js",
  "moment.locale('pt-BR');",
  ["Exibe reservas formatadas.", "Locale brasileiro.", "Dependência moment ^2.29."]),

n("jsr-mysql-tables", "jsr-db", "file", "Schema MySQL",
  "Tabelas do restaurante saboroso.",
  "public/db/mysql.sql",
  "tb_menus | tb_reservations | tb_contacts | tb_users | tb_emails",
  ["menus: title, description, price, photo.", "reservations: people, date, time.", "Crie DB antes do npm start."]),

n("jsr-redis", "jsr-session", "file", "Redis",
  "Store de sessão para admin.",
  "app.js",
  "new RedisStore({ host:'localhost', port:6379 })",
  ["Instale Redis no Windows/Linux.", "Sessão persiste entre requests.", "Secret configurável em produção."]),

n("jsr-package", "jsr-backend", "file", "package.json",
  "Dependências: express, mysql2, ejs, formidable, moment.",
  "package.json",
  "\"dependencies\": { \"express\": \"~4.16.1\", \"mysql2\": \"^2.2.5\", \"connect-redis\": \"^3.3.3\", \"formidable\": \"^1.2.2\" }",
  ["npm start com nodemon.", "Nome interno saboroso.", "Private project."]),
]

PROJECT = {
    "slug": "javascript-restaurant",
    "name": "JavaScriptRestaurantProject",
    "repoUrl": "https://github.com/CanonEngineer/JavaScriptRestaurantProject",
    "color": "#f97316",
    "icon": "javascript",
    "stack": "Express + MySQL + Redis",
    "summary": "Restaurante Saboroso — cardápio, reservas, contato e painel AdminLTE com MySQL.",
    "nodes": NODES,
}

if __name__ == "__main__":
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(PROJECT, f, ensure_ascii=False, indent=2)
    print(f"JavaScriptRestaurantProject: {len(NODES)} nós -> {OUT}")
