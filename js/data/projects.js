/* Árvore do Conhecimento — dados dos 7 projetos CanonEngineer */
const PROJECTS = [
  {
    slug: 'canon-python-ecommerce',
    name: 'CanonPythonEcommerce',
    repoUrl: 'https://github.com/CanonEngineer/CanonPythonEcommerce',
    color: '#38bdf8',
    icon: 'python',
    stack: 'Django 5',
    summary: 'E-commerce completo com carrinho, PayPal, contas e pedidos.',
    nodes: [
      { id: 'cpe-root', parent: null, layer: 'root', title: 'CanonPythonEcommerce', file: 'greatkart/', description: 'Projeto Django de e-commerce — raiz com apps accounts, store, carts, orders.', code: '# greatkart — projeto principal\nINSTALLED_APPS = [\n  "accounts", "store", "carts",\n  "orders", "category"\n]', implementation: ['Clone o repositório e crie o venv.', 'Configure settings.py com banco e MEDIA.', 'Execute migrate e runserver na porta 8000.'] },
      { id: 'cpe-urls', parent: 'cpe-root', layer: 'module', title: 'URLs Central', file: 'greatkart/urls.py', description: 'Roteia todas as apps: store, cart, accounts, orders. Admin honeypot em /admin/.', code: `urlpatterns = [
    path('admin/', include('admin_honeypot.urls')),
    path('securelogin/', admin.site.urls),
    path('', views.home, name='home'),
    path('store/', include('store.urls')),
    path('cart/', include('carts.urls')),
    path('accounts/', include('accounts.urls')),
    path('orders/', include('orders.urls')),
]`, implementation: ['Crie greatkart/urls.py com include() para cada app.', 'Proteja o admin real em /securelogin/.', 'Sirva MEDIA com static() em DEBUG.'] },
      { id: 'cpe-accounts', parent: 'cpe-root', layer: 'module', title: 'Accounts', file: 'accounts/views.py', description: 'Registro com ativação por e-mail, login e merge de carrinho anônimo.', code: `def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = Account.objects.create_user(...)
            profile = UserProfile()
            profile.user_id = user.id
            profile.save()
            # Envia e-mail de ativação
            send_email.send()
            return redirect('/accounts/login/?command=verification')`, implementation: ['Crie modelo Account estendendo AbstractBaseUser.', 'Use default_token_generator para link de ativação.', 'Template account_verification_email.html no e-mail.'] },
      { id: 'cpe-store', parent: 'cpe-root', layer: 'module', title: 'Store', file: 'store/views.py', description: 'Listagem por categoria, detalhe do produto, busca e avaliações.', code: `def store(request, category_slug=None):
    if category_slug != None:
        categories = get_object_or_404(Category, slug=category_slug)
        products = Product.objects.filter(category=categories, is_available=True)
    else:
        products = Product.objects.filter(is_available=True)
    paginator = Paginator(products, 6)
    return render(request, 'store/store.html', context)`, implementation: ['Model Product com slug e FK para Category.', 'Paginator com 6 itens por página.', 'Template store.html com loop de produtos.'] },
      { id: 'cpe-search', parent: 'cpe-store', layer: 'function', title: 'Busca', file: 'store/views.py', description: 'Busca produtos por nome ou descrição usando Q objects.', code: `def search(request):
    keyword = request.GET['keyword']
    products = Product.objects.filter(
        Q(description__icontains=keyword) |
        Q(product_name__icontains=keyword)
    )
    return render(request, 'store/store.html', context)`, implementation: ['Adicione campo de busca no navbar.', 'Use Q() para OR entre campos.', 'Reutilize template store.html.'] },
      { id: 'cpe-carts', parent: 'cpe-root', layer: 'module', title: 'Carts', file: 'carts/views.py', description: 'Carrinho com sessão para anônimos e usuário logado, variações de produto.', code: `def _cart_id(request):
    cart = request.session.session_key
    if not cart:
        cart = request.session.create()
    return cart

def add_cart(request, product_id):
    if current_user.is_authenticated:
        # adiciona com variações ao CartItem do usuário
    else:
        # usa session_key como cart_id`, implementation: ['Model Cart com cart_id da sessão.', 'CartItem com M2M para Variation.', 'Incrementa quantity se variação já existe.'] },
      { id: 'cpe-orders', parent: 'cpe-root', layer: 'module', title: 'Orders', file: 'orders/views.py', description: 'Checkout PayPal, grava Payment, move itens do carrinho e reduz estoque.', code: `def payments(request):
    body = json.loads(request.body)
    order = Order.objects.get(user=request.user, is_ordered=False)
    payment = Payment(
        payment_id=body['transID'],
        amount_paid=order.order_total,
        status=body['status'],
    )
    payment.save()
    order.is_ordered = True
    order.save()
    # Move cart items → OrderProduct
    # Reduz stock e limpa carrinho
    return JsonResponse(data)`, implementation: ['Integre PayPal SDK no frontend.', 'Endpoint payments recebe JSON do PayPal.', 'Envie e-mail order_receive_email após sucesso.'] },
      { id: 'cpe-category', parent: 'cpe-root', layer: 'file', title: 'Category', file: 'category/models.py', description: 'Categorias com slug para URLs amigáveis na loja.', code: `class Category(models.Model):
    category_name = models.CharField(max_length=50)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(max_length=255)
    cat_image = models.ImageField(upload_to='photos/categories')`, implementation: ['App category com modelo Category.', 'Slug gerado no save() ou admin.', 'FK em Product para Category.'] }
    ]
  },
  {
    slug: 'food-online-django',
    name: 'FoodOnlineDjango',
    repoUrl: 'https://github.com/CanonEngineer/FoodOnlineDjango',
    color: '#f97316',
    icon: 'django',
    stack: 'Django + PostGIS',
    summary: 'Marketplace multi-vendor com RazorPay, roles Vendor/Customer.',
    nodes: [
      { id: 'fod-root', parent: null, layer: 'root', title: 'FoodOnlineDjango', file: 'foodOnline/', description: 'Plataforma de delivery multi-restaurante com papéis Vendor e Customer.', code: '# Apps: accounts, vendor, menu, marketplace, orders\n# PostGIS para localização de entrega', implementation: ['Configure PostGIS no settings DATABASES.', 'Crie superuser e registre vendors.', 'Configure RZP_KEY_ID e RZP_KEY_SECRET.'] },
      { id: 'fod-roles', parent: 'fod-root', layer: 'module', title: 'Roles RBAC', file: 'accounts/views.py', description: 'Decorators que restringem Vendor (role=1) e Customer (role=2).', code: `def check_role_vendor(user):
    if user.role == 1:
        return True
    raise PermissionDenied

def check_role_customer(user):
    if user.role == 2:
        return True
    raise PermissionDenied`, implementation: ['Campo role no modelo User customizado.', 'Use @user_passes_test(check_role_vendor).', 'Redirecione com PermissionDenied se role errado.'] },
      { id: 'fod-register', parent: 'fod-root', layer: 'function', title: 'Registro', file: 'accounts/views.py', description: 'Cria usuário Customer com create_user e envia verificação.', code: `def registerUser(request):
    form = UserForm(request.POST)
    if form.is_valid():
        user = User.objects.create_user(
            first_name=..., email=..., password=...
        )
        user.role = User.CUSTOMER
        user.save()
        send_verification_email(request, user)`, implementation: ['UserForm com validação de senha.', 'detectUser() redireciona por role após login.', 'E-mail com token de verificação.'] },
      { id: 'fod-vendor', parent: 'fod-root', layer: 'module', title: 'Vendor', file: 'vendor/models.py', description: 'Perfil de restaurante com slug, horário e aprovação.', code: `class Vendor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    vendor_name = models.CharField(max_length=50)
    vendor_slug = models.SlugField(max_length=100, unique=True)
    is_approved = models.BooleanField(default=False)`, implementation: ['OneToOne User ↔ Vendor.', 'VendorForm no registro de restaurante.', 'Admin aprova is_approved antes de listar.'] },
      { id: 'fod-menu', parent: 'fod-root', layer: 'module', title: 'Menu', file: 'menu/models.py', description: 'Categorias e FoodItem vinculados ao vendor.', code: `class FoodItem(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    food_title = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_available = models.BooleanField(default=True)`, implementation: ['CRUD de menu no dashboard do vendor.', 'Upload de imagem em ImageField.', 'Filtre por vendor no queryset.'] },
      { id: 'fod-marketplace', parent: 'fod-root', layer: 'module', title: 'Marketplace', file: 'marketplace/context_processors.py', description: 'Carrinho global e cálculo de taxas por vendor.', code: `def cart_counter(request):
    cart_count = 0
    if request.user.is_authenticated:
        try:
            cart = Cart.objects.get(user=request.user)
            cart_count = cart.quantity()
        except:
            cart_count = 0
    return dict(cart_count=cart_count)`, implementation: ['Context processor em TEMPLATES.', 'Model Cart com método quantity().', 'Badge no navbar com cart_count.'] },
      { id: 'fod-orders', parent: 'fod-root', layer: 'module', title: 'Orders', file: 'orders/views.py', description: 'place_order agrupa por vendor, calcula taxas e integra RazorPay.', code: `client = razorpay.Client(auth=(RZP_KEY_ID, RZP_KEY_SECRET))

@login_required
def place_order(request):
    cart_items = Cart.objects.filter(user=request.user)
    vendors_id = list(set(i.fooditem.vendor.id for i in cart_items))
    # Calcula subtotal e tax_data por vendor
    # Cria Order com total_data JSON`, implementation: ['pip install razorpay.', 'order_total_by_vendor() soma por restaurante.', 'Frontend abre checkout RazorPay com order_id.'] },
      { id: 'fod-payment', parent: 'fod-orders', layer: 'function', title: 'RazorPay', file: 'orders/views.py', description: 'Confirma pagamento RazorPay e notifica vendors.', code: `def payment(request):
    payment_id = request.GET.get('payment_id')
    # Verifica assinatura RazorPay
    payment = Payment(payment_id=payment_id, ...)
    payment.save()
    send_notification(mail_subject, template, context)`, implementation: ['Verifique signature no callback.', 'Atualize Order.status para paid.', 'send_notification() para cada vendor.'] }
    ]
  },
  {
    slug: 'js-dropbox',
    name: 'JavaScriptDropBoxProject',
    repoUrl: 'https://github.com/CanonEngineer/JavaScriptDropBoxProject',
    color: '#eab308',
    icon: 'javascript',
    stack: 'Express + Firebase',
    summary: 'Clone Dropbox no browser com Firebase Realtime Database.',
    nodes: [
      { id: 'jdb-root', parent: null, layer: 'root', title: 'JavaScriptDropBoxProject', file: 'public/src/', description: 'Armazenamento em nuvem estilo Dropbox com Express e Firebase.', code: '// Express serve public/\n// DropBoxController gerencia arquivos no Firebase', implementation: ['npm install express firebase.', 'Configure firebaseConfig no controller.', 'node app.js na porta 3000.'] },
      { id: 'jdb-controller', parent: 'jdb-root', layer: 'module', title: 'DropBoxController', file: 'public/src/controller/DropBoxController.js', description: 'Classe principal: navegação de pastas, upload, rename e delete.', code: `class DropBoxController {
  constructor() {
    this.currentFolder = ['HiperCloud'];
    this.connDatabase();
    this.initEvents();
    this.openFolder();
  }
  connDatabase() {
    firebase.initializeApp(firebaseConfig);
  }
}`, implementation: ['Instancie no index.js após DOM ready.', 'currentFolder é pilha de navegação.', 'bind events nos botões da UI.'] },
      { id: 'jdb-upload', parent: 'jdb-controller', layer: 'function', title: 'Upload', file: 'DropBoxController.js', description: 'Envia arquivo ao Firebase Storage com barra de progresso.', code: `uploadTask.on('state_changed',
  (snapshot) => {
  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
  this.progressBarEl.style.width = progress + '%';
  },
  (error) => { console.error(error); },
  () => { this.updateFirebaseDatabase(...) }
);`, implementation: ['Input type=file com change listener.', 'firebase.storage().ref(path).put(file).', 'Atualize Realtime DB com metadata após upload.'] },
      { id: 'jdb-folder', parent: 'jdb-controller', layer: 'function', title: 'openFolder', file: 'DropBoxController.js', description: 'Lista arquivos e pastas da pasta atual no Firebase.', code: `openFolder() {
  const path = this.currentFolder.join('/');
  const ref = this.getFirebaseRef(path);
  ref.on('value', snapshot => {
    this.listFilesEl.innerHTML = '';
    snapshot.forEach(item => {
      this.renderItem(item.val(), item.key);
    });
  });
}`, implementation: ['getFirebaseRef() retorna database ref.', 'Renderize ícone por type folder/file.', 'Duplo-clique em pasta chama push na currentFolder.'] },
      { id: 'jdb-delete', parent: 'jdb-controller', layer: 'function', title: 'removeFolder', file: 'DropBoxController.js', description: 'Remove pasta recursivamente do Firebase.', code: `removeFolder(ref, name) {
  return new Promise((resolve, reject) => {
    let folderRef = this.getFirebaseRef(ref + '/' + name);
    folderRef.on('value', snapshot => {
      snapshot.forEach(item => {
        if (data.type === 'folder') {
          this.removeFolder(ref + '/' + name, data.name);
        }
      });
      folderRef.remove().then(resolve);
    });
  });
}`, implementation: ['Recursão para subpastas.', 'folderRef.remove() após limpar filhos.', 'Confirme com modal antes de deletar.'] },
      { id: 'jdb-rename', parent: 'jdb-controller', layer: 'function', title: 'Rename', file: 'DropBoxController.js', description: 'Renomeia arquivo ou pasta selecionado.', code: `renameItem(oldName, newName) {
  const path = this.currentFolder.join('/');
  const ref = this.getFirebaseRef(path + '/' + oldName);
  ref.once('value').then(snapshot => {
    const data = snapshot.val();
    data.name = newName;
    this.getFirebaseRef(path + '/' + newName).set(data);
    ref.remove();
  });
}`, implementation: ['getSelection() retorna itens .selected.', 'Copie dados para nova ref e remova antiga.', 'Atualize listagem com openFolder().'] },
      { id: 'jdb-express', parent: 'jdb-root', layer: 'file', title: 'Express Server', file: 'routes/index.js', description: 'Servidor Node que entrega a SPA e rotas de usuário.', code: `app.use(express.static('public'));
app.use('/users', require('./users'));`, implementation: ['express.static para public/.', 'Rota users para autenticação básica.', 'Deploy em Heroku ou VPS.'] }
    ]
  },
  {
    slug: 'js-users',
    name: 'JavaScriptUsersProject',
    repoUrl: 'https://github.com/CanonEngineer/JavaScriptUsersProject',
    color: '#22c55e',
    icon: 'javascript',
    stack: 'ES6 + localStorage',
    summary: 'CRUD de usuários com foto em Base64 no localStorage.',
    nodes: [
      { id: 'jus-root', parent: null, layer: 'root', title: 'JavaScriptUsersProject', file: '/', description: 'Sistema de cadastro de usuários 100% frontend com AdminLTE.', code: '// MVC: User (model), UserController, Utils\n// Persistência: localStorage', implementation: ['Abra index.html no browser.', 'Não precisa de servidor backend.', 'Dados ficam em localStorage users.'] },
      { id: 'jus-model', parent: 'jus-root', layer: 'module', title: 'User Model', file: 'models/User.js', description: 'Modelo com getters/setters e serialização JSON.', code: `class User {
  constructor(...fields) { }
  get name() { return this._name; }
  set name(value) { this._name = value; }
  loadFromJSON(data) {
    for (let i in data) this[i] = data[i];
  }
  static getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
  }
  save() {
    let users = User.getUsers();
    users.push(this.getObject());
    localStorage.setItem('users', JSON.stringify(users));
  }
}`, implementation: ['Propriedades com underscore (_name).', 'getObject() retorna plain object.', 'getUsers() lê array do localStorage.'] },
      { id: 'jus-controller', parent: 'jus-root', layer: 'module', title: 'UserController', file: 'controllers/UserController.js', description: 'Orquestra formulários create/update, tabela e eventos.', code: `class UserController {
  constructor(formIdCreate, formIdUpdate, tableId) {
    this.formEl = document.getElementById(formIdCreate);
    this.tableEl = document.getElementById(tableId);
    this.onSubmit();
    this.onEdit();
    this.selectAll();
  }
}`, implementation: ['Passe IDs dos forms e table no construtor.', 'Chame no DOMContentLoaded.', 'Métodos onSubmit, onEdit, selectAll.'] },
      { id: 'jus-create', parent: 'jus-controller', layer: 'function', title: 'onSubmit', file: 'UserController.js', description: 'Cria usuário com foto convertida para Base64.', code: `onSubmit() {
  this.formEl.addEventListener('submit', e => {
    e.preventDefault();
    let values = this.getValues(this.formEl);
    this.getPhoto(this.formEl).then(content => {
      values.photo = content;
      let user = new User();
      user.loadFromJSON(values);
      user.save();
      this.addLine(user);
      this.updateCount();
      this.formEl.reset();
    });
  });
}`, implementation: ['getValues() lê FormData.', 'getPhoto() usa FileReader readAsDataURL.', 'addLine() insere <tr> na tabela.'] },
      { id: 'jus-edit', parent: 'jus-controller', layer: 'function', title: 'onEdit', file: 'UserController.js', description: 'Atualiza usuário existente com Object.assign merge.', code: `onEdit() {
  this.formUpdateEl.addEventListener('submit', event => {
    let index = this.formUpdateEl.dataset.trIndex;
    let tr = this.tableEl.rows[index];
    let userOld = JSON.parse(tr.dataset.user);
    let result = Object.assign({}, userOld, values);
    user.loadFromJSON(result);
    user.save();
    this.getTr(user, tr);
  });
}`, implementation: ['dataset.trIndex guarda índice da linha.', 'dataset.user tem JSON do usuário.', 'showPanelCreate() após salvar.'] },
      { id: 'jus-photo', parent: 'jus-root', layer: 'function', title: 'getPhoto', file: 'classes/Utils.js', description: 'Converte File input em string Base64 para armazenar.', code: `static getPhoto(el) {
  return new Promise((resolve, reject) => {
    let file = el.querySelector('[type=file]').files[0];
    if (file) {
      let reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else resolve('');
  });
}`, implementation: ['FileReader readAsDataURL.', 'Resolve string data:image/...;base64,...', 'Exiba em <img src={photo}> na tabela.'] },
      { id: 'jus-delete', parent: 'jus-controller', layer: 'function', title: 'Delete', file: 'UserController.js', description: 'Remove linha da tabela e atualiza localStorage.', code: `deleteUser(tr) {
    let users = User.getUsers();
    users.splice(tr.sectionRowIndex, 1);
    localStorage.setItem('users', JSON.stringify(users));
    tr.remove();
    this.updateCount();
  }`, implementation: ['Botão delete em cada <tr>.', 'splice pelo índice da linha.', 'updateCount() no badge do header.'] }
    ]
  },
  {
    slug: 'js-restful-api',
    name: 'JavaScriptRestfulApiProject',
    repoUrl: 'https://github.com/CanonEngineer/JavaScriptRestfulApiProject',
    color: '#8b5cf6',
    icon: 'node',
    stack: 'Express + NeDB',
    summary: 'API REST de usuários com NeDB e validação.',
    nodes: [
      { id: 'jra-root', parent: null, layer: 'root', title: 'JavaScriptRestfulApiProject', file: '/', description: 'API REST com Express, consign e banco NeDB embarcado.', code: '// app.js com consign carregando routes/ e utils/\n// NeDB users.db autoload', implementation: ['npm install express nedb consign.', 'node app.js.', 'Teste com Postman ou curl.'] },
      { id: 'jra-routes', parent: 'jra-root', layer: 'module', title: 'Users Routes', file: 'routes/users.js', description: 'CRUD completo GET/POST/PUT/DELETE em /users.', code: `let db = new NeDB({ filename: 'users.db', autoload: true });

route.get((req, res) => {
  db.find({}).sort({ name: 1 }).exec((err, users) => {
    res.json({ users });
  });
});

route.post((req, res) => {
  if (!app.utils.validator.user(app, req, res)) return;
  db.insert(req.body, (err, user) => {
    res.status(200).json(user);
  });
});`, implementation: ['consign carrega routes/users.js.', 'app.route() do Express 4.', 'NeDB persiste em users.db.'] },
      { id: 'jra-get-id', parent: 'jra-routes', layer: 'function', title: 'GET /:id', file: 'routes/users.js', description: 'Busca um usuário pelo _id do NeDB.', code: `routeId.get((req, res) => {
  db.findOne({ _id: req.params.id }).exec((err, user) => {
    if (err) app.utils.error.send(err, req, res);
    else res.status(200).json(user);
  });
});`, implementation: ['Rota /users/:id com app.route().', 'findOne com _id do NeDB.', 'Retorne 404 se user null.'] },
      { id: 'jra-validator', parent: 'jra-root', layer: 'module', title: 'Validator', file: 'utils/validator.js', description: 'Valida nome obrigatório e e-mail válido no POST/PUT.', code: `user: (app, req, res) => {
  req.assert('_name', 'O nome é obrigatório.').notEmpty();
  req.assert('_email', 'O e-mail está inválido.').notEmpty().isEmail();
  let errors = req.validationErrors();
  if (errors) {
    app.utils.error.send(errors, req, res);
    return false;
  }
  return true;
}`, implementation: ['express-validator ou validatorjs.', 'Chame antes de db.insert/update.', 'error.send retorna JSON 400.'] },
      { id: 'jra-error', parent: 'jra-root', layer: 'file', title: 'Error Handler', file: 'utils/error.js', description: 'Padroniza respostas de erro da API.', code: `send: (err, req, res) => {
  res.status(400).json({
    error: err
  });
}`, implementation: ['Centralize erros em utils/error.js.', 'Status 400 para validação.', '500 para erros de banco.'] },
      { id: 'jra-put', parent: 'jra-routes', layer: 'function', title: 'PUT /:id', file: 'routes/users.js', description: 'Atualiza usuário existente no NeDB.', code: `routeId.put((req, res) => {
  if (!app.utils.validator.user(app, req, res)) return;
  db.update({ _id: req.params.id }, req.body, {}, (err, n) => {
    res.status(200).json({ updated: n });
  });
});`, implementation: ['Valide body antes de update.', 'db.update com _id do params.', 'Retorne quantidade de docs alterados.'] },
      { id: 'jra-delete', parent: 'jra-routes', layer: 'function', title: 'DELETE /:id', file: 'routes/users.js', description: 'Remove usuário do banco NeDB.', code: `routeId.delete((req, res) => {
  db.remove({ _id: req.params.id }, {}, (err, n) => {
    res.status(200).json({ removed: n });
  });
});`, implementation: ['DELETE em /users/:id.', 'db.remove com _id.', 'Confirme n > 0 no response.'] }
    ]
  },
  {
    slug: 'professional-scanner',
    name: 'Professional-Scanner',
    repoUrl: 'https://github.com/CanonEngineer/Professional-Scanner',
    color: '#06b6d4',
    icon: 'scanner',
    stack: 'Node.js + WebSocket',
    summary: 'Scanner de rede profissional com mapa 3D e export XLSX.',
    nodes: [
      { id: 'ps-root', parent: null, layer: 'root', title: 'Professional-Scanner', file: 'server.js', description: 'Scanner de rede com WebSocket, ping, port scan e export Excel.', code: `const express = require('express');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;`, implementation: ['npm install express ws exceljs.', 'node server.js.', 'Acesse http://localhost:3000.'] },
      { id: 'ps-ws', parent: 'ps-root', layer: 'module', title: 'WebSocket Server', file: 'server.js', description: 'Comunicação em tempo real entre servidor e dashboard.', code: `wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.action === 'startScan') {
      startScan(ws, data.target, data.options);
    }
  });
});`, implementation: ['Broadcast logs e resultados via ws.send.', 'Cliente reconecta em 3s se cair.', 'JSON com type: log|result|progress.'] },
      { id: 'ps-scan', parent: 'ps-root', layer: 'function', title: 'startScan', file: 'server.js', description: 'Varre range de IPs com concorrência configurável.', code: `async function startScan(ws, target, options) {
  const ips = expandTarget(target);
  const concurrency = options.concurrency || 50;
  const queue = [...ips];
  const workers = Array(concurrency).fill().map(async () => {
    while (queue.length) {
      const ip = queue.shift();
      const result = await scanHost(ip, options);
      ws.send(JSON.stringify({ type: 'result', data: result }));
    }
  });
  await Promise.all(workers);
}`, implementation: ['expandTarget() parse CIDR ou range.', 'Worker pool com concurrency limit.', 'scanHost faz ping + port scan.'] },
      { id: 'ps-export', parent: 'ps-root', layer: 'function', title: 'Export XLSX', file: 'server.js', description: 'Exporta resultados para Excel com colunas profissionais.', code: `app.post('/export-xlsx', async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Scan');
  worksheet.columns = [
    { header: 'IP', key: 'ip', width: 18 },
    { header: 'Hostname', key: 'hostname', width: 24 },
    { header: 'MAC', key: 'mac', width: 20 },
    { header: 'Portas Abertas', key: 'ports', width: 48 }
  ];
  await workbook.xlsx.write(res);
});`, implementation: ['POST com body.results array.', 'ExcelJS formata header bold.', 'Download automático no browser.'] },
      { id: 'ps-client', parent: 'ps-root', layer: 'module', title: 'Dashboard Client', file: 'public/app.js', description: 'UI com WebSocket, tabela de resultados e progresso.', code: `function connectWebSocket() {
  socket = new WebSocket(wsUrl);
  socket.onopen = () => {
    connectionBadge.textContent = 'Conectado';
  };
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleServerMessage(data);
  };
}`, implementation: ['connectWebSocket() no load.', 'handleServerMessage switch por type.', 'Atualize tabela e stats em tempo real.'] },
      { id: 'ps-map', parent: 'ps-root', layer: 'module', title: 'Mapa 3D', file: 'public/map.js', description: 'Visualização topológica dos hosts escaneados.', code: `async function refreshTopology() {
  const response = await fetch('/api/scan-results');
  const json = await response.json();
  latestResults = json.results || [];
  render3DMap(latestResults);
}

function render3DMap(results) {
  // Cria nós por subnet e links host→subnet
  results.forEach(host => { /* build nodes */ });
}`, implementation: ['GET /api/scan-results retorna snapshot.', 'Agrupe hosts por subnet.', 'Export PNG/SVG do canvas.'] },
      { id: 'ps-api', parent: 'ps-root', layer: 'file', title: 'Scan API', file: 'server.js', description: 'Endpoint REST para últimos resultados do scan.', code: `app.get('/api/scan-results', (req, res) => {
  res.json({
    updated: Date.now(),
    results: lastScanSnapshot
  });
});`, implementation: ['lastScanSnapshot atualizado no scan.', 'map.js consome este endpoint.', 'Cache em memória (sem DB).'] }
    ]
  },
  {
    slug: 'customize-veyon',
    name: 'CustomizeVeyonProject',
    comingSoon: true,
    repoUrl: 'https://github.com/CanonEngineer/CustomizeVeyonProject',
    color: '#ef4444',
    icon: 'cpp',
    stack: 'Qt/C++ Veyon 4.10.4',
    summary: 'Veyon customizado CIMED/HCFMB — mapeamento amanhã.',
    nodes: [
      { id: 'cv-root', parent: null, layer: 'root', title: 'CustomizeVeyonProject', file: 'veyon-4.10.4-src/', description: 'Veyon 4.10.4 customizado para CiMED/HCFMB — controle remoto hospitalar.', code: '// Customizações Canon:\n// TamperLogProtector, UI CIMED, logs rede\n// Veyon_Custom/ deploy portátil', implementation: ['Clone com submódulo veyon-4.10.4-src.', 'Build com CMake no Windows.', 'Deploy via pasta Veyon_Custom/.'] },
      { id: 'cv-tamper', parent: 'cv-root', layer: 'module', title: 'TamperLogProtector', file: 'core/src/TamperLogProtector.cpp', description: 'Monitora logs de acesso e detecta adulteração com SHA-256.', code: `constexpr auto AdminPasswordHash = "8ab2cdcbd95fabaab0ef54a74c84a08b3e8c95c511f50c4992e9a8cac3c63863";

QString passwordSha256Hex(const QString& password) {
  return QString::fromLatin1(
    QCryptographicHash::hash(password.toUtf8(), QCryptographicHash::Sha256).toHex());
}

void TamperLogProtector::checkNetworkAccessFile() {
  checkProtectedFile(networkPath, backup, QStringLiteral("rede acessos_veyon"));
}`, implementation: ['Poll timer verifica hashes dos logs.', 'Backup local antes de cada escrita.', 'Alerta único se hash divergir.'] },
      { id: 'cv-password', parent: 'cv-tamper', layer: 'function', title: 'Senha Admin', file: 'TamperLogProtector.cpp', description: 'Verifica senha SHA-256 para liberar edição de logs protegidos.', code: `bool TamperLogProtector::verifyAdminPassword(const QString& password) {
  return passwordSha256Hex(password) == QLatin1String(AdminPasswordHash);
}`, implementation: ['Hash SHA-256 da senha admin.', 'Compare com constante AdminPasswordHash.', 'Dialog solicita senha antes de editar log.'] },
      { id: 'cv-dialog', parent: 'cv-root', layer: 'module', title: 'TamperLogPasswordDialog', file: 'core/src/TamperLogPasswordDialog.cpp', description: 'Dialog estilo CIMED para autenticação de administrador.', code: `auto* brandLabel = new QLabel(QStringLiteral("VEYON CIMED"), brandPanel);
// Estilização CIMED com CimedDialogStyle
connect(authenticateButton, &QPushButton::clicked,
  this, &TamperLogPasswordDialog::attemptAuthentication);`, implementation: ['Use CimedDialogStyle para chrome visual.', 'attemptAuthentication chama verifyAdminPassword.', 'Fecha dialog se senha correta.'] },
      { id: 'cv-cimed-style', parent: 'cv-root', layer: 'file', title: 'CimedDialogStyle', file: 'core/src/CimedDialogStyle.cpp', description: 'Estilo visual compartilhado para todos os dialogs CIMED.', code: `QString CimedDialogStyle::brandedTitle() {
  const QString title = QStringLiteral("CIMED");
  return title;
}
// Aplica paleta, bordas e fontes institucionais`, implementation: ['Header com logo CIMED.', 'Cores institucionais #0c2344.', 'Reutilize em todos os QDialogs custom.'] },
      { id: 'cv-logs', parent: 'cv-root', layer: 'module', title: 'AccessLogWriter', file: 'core/src/AccessLogWriter.cpp', description: 'Escreve logs somente na rede UNC vnc_veyon$.', code: `QString networkLogPath() {
  return QDir(networkShare).filePath(
    QStringLiteral("acessos_veyon.log"));
}
QString networkAdLogPath() {
  return QDir(networkShare).filePath(
    QStringLiteral("acessos_veyon_ad.log"));
}`, implementation: ['UNC: \\\\172.20.100.36\\vnc_veyon$\\veyon\\', 'Sem espelhamento local de logs.', 'Worker escreve, server valida.'] },
      { id: 'cv-tray', parent: 'cv-root', layer: 'module', title: 'SystemTrayIcon', file: 'core/src/SystemTrayIcon.h', description: 'Bandeja HiDPI com ícones para 125%/150% DPI.', code: `void requestTamperLogPasswordDialog(FeatureWorkerManager&);
static void notifyTamperLogPasswordRequest();
static bool notifyTamperLogPasswordRequestOnce();
// Ícones HiDPI para estados: monitorando, acesso, alerta`, implementation: ['Ícones @2x para DPI 125/150%.', 'notifyTamperLogPasswordRequestOnce evita duplicação.', 'F9 estável durante sessão VNC.'] },
      { id: 'cv-desktop', parent: 'cv-root', layer: 'file', title: 'DesktopAccessConfirm', file: 'core/src/DesktopAccessConfirmDialog.cpp', description: 'Confirmação de acesso remoto com visual CIMED.', code: `// DesktopAccessConfirmDialog.cpp
// CIMED styled desktop access confirmation dialog
// Exibe quem está acessando e pede confirmação do usuário`, implementation: ['Dialog modal antes de permitir VNC.', 'Mostra hostname do administrador.', 'Botões Permitir/Negar estilo CIMED.'] },
      { id: 'cv-brand', parent: 'cv-root', layer: 'function', title: 'ComputerSupportInfo', file: 'core/src/ComputerSupportInfo.cpp', description: 'Retorna nome da marca Veyon CIMED no sistema.', code: `QString ComputerSupportInfo::supportSoftwareName() {
  return QStringLiteral("Veyon CIMED");
}`, implementation: ['Substitui "Veyon" por "Veyon CIMED".', 'Aparece em About e bandeja.', 'Compile no veyon-core.dll.'] }
    ]
  }
];
