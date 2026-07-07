/* Árvore do Conhecimento — 213 nós */
const PROJECTS = [
  {
    "slug": "canon-python-ecommerce",
    "name": "CanonPythonEcommerce",
    "repoUrl": "https://github.com/CanonEngineer/CanonPythonEcommerce",
    "color": "#38bdf8",
    "icon": "python",
    "stack": "Django 5",
    "summary": "E-commerce completo — 6 apps, PayPal, honeypot admin, reviews.",
    "nodes": [
      {
        "id": "cpe-root",
        "parent": null,
        "layer": "root",
        "title": "CanonPythonEcommerce",
        "description": "E-commerce Django — GreatKart com 6 apps customizadas.",
        "file": "greatkart/",
        "code": "# Apps: category, accounts, store, carts, orders\nAUTH_USER_MODEL = accounts.Account",
        "implementation": [
          "Clone o repo e configure .env com decouple.",
          "python manage.py migrate && runserver.",
          "Acesse /store/ para a loja."
        ]
      },
      {
        "id": "cpe-greatkart",
        "parent": "cpe-root",
        "layer": "module",
        "title": "greatkart",
        "description": "Pacote central: settings, URLs, home e honeypot admin.",
        "file": "greatkart/",
        "code": "INSTALLED_APPS = ['category','accounts','store','carts','orders','admin_honeypot']",
        "implementation": [
          "Configure INSTALLED_APPS e AUTH_USER_MODEL.",
          "Registre context processors.",
          "Proteja admin em /securelogin/."
        ]
      },
      {
        "id": "cpe-settings",
        "parent": "cpe-greatkart",
        "layer": "file",
        "title": "settings.py",
        "description": "Secrets via decouple, sessão 1h, SMTP e SQLite.",
        "file": "greatkart/settings.py",
        "code": "SECRET_KEY = config('SECRET_KEY')\nSESSION_EXPIRE_SECONDS = 3600\nAUTH_USER_MODEL = 'accounts.Account'",
        "implementation": [
          "Crie .env com SECRET_KEY e EMAIL_*.",
          "Configure SESSION_TIMEOUT_REDIRECT.",
          "Defina MEDIA_URL e STATIC_URL."
        ]
      },
      {
        "id": "cpe-urls",
        "parent": "cpe-greatkart",
        "layer": "file",
        "title": "urls.py",
        "description": "Roteador raiz com honeypot e includes das apps.",
        "file": "greatkart/urls.py",
        "code": "path('admin/', include('admin_honeypot.urls')),\npath('securelogin/', admin.site.urls),\npath('store/', include('store.urls')),",
        "implementation": [
          "Monte urlpatterns com include() por app.",
          "Sirva media com static() em DEBUG.",
          "Nomeie rotas com name=."
        ]
      },
      {
        "id": "cpe-home",
        "parent": "cpe-greatkart",
        "layer": "function",
        "title": "home()",
        "description": "Home lista produtos ativos com reviews.",
        "file": "greatkart/views.py",
        "code": "def home(request):\n    products = Product.objects.filter(is_available=True).order_by('created_date')\n    return render(request, 'home.html', context)",
        "implementation": [
          "Filtre is_available=True.",
          "Carregue ReviewRating status=True.",
          "Renderize home.html."
        ]
      },
      {
        "id": "cpe-accounts",
        "parent": "cpe-root",
        "layer": "module",
        "title": "accounts",
        "description": "Auth customizada: Account, perfil, ativação e dashboard.",
        "file": "accounts/",
        "code": "USERNAME_FIELD = 'email'  # Account model",
        "implementation": [
          "Modelo Account com email único.",
          "Views register/login/activate.",
          "Templates de verificação."
        ]
      },
      {
        "id": "cpe-account-model",
        "parent": "cpe-accounts",
        "layer": "file",
        "title": "Account",
        "description": "User customizado com MyAccountManager.",
        "file": "accounts/models.py",
        "code": "class Account(AbstractBaseUser):\n    email = models.EmailField(unique=True)\n    is_active = models.BooleanField(default=False)\n    USERNAME_FIELD = 'email'",
        "implementation": [
          "Crie MyAccountManager.",
          "Defina USERNAME_FIELD=email.",
          "UserProfile OneToOne."
        ]
      },
      {
        "id": "cpe-register",
        "parent": "cpe-accounts",
        "layer": "function",
        "title": "register()",
        "description": "Cadastro + perfil + e-mail de ativação.",
        "file": "accounts/views.py",
        "code": "user = Account.objects.create_user(...)\nprofile = UserProfile(); profile.user_id = user.id; profile.save()",
        "implementation": [
          "RegistrationForm valida POST.",
          "Cria UserProfile com foto default.",
          "Envia link activate/<uid>/<token>/."
        ]
      },
      {
        "id": "cpe-login",
        "parent": "cpe-accounts",
        "layer": "function",
        "title": "login()",
        "description": "Login por email e merge de carrinho anônimo.",
        "file": "accounts/views.py",
        "code": "user = auth.authenticate(email=email, password=password)\n# mescla CartItem da sessão com user",
        "implementation": [
          "authenticate(email=...).",
          "Compare variações do carrinho.",
          "auth.login e redirect dashboard."
        ]
      },
      {
        "id": "cpe-dashboard",
        "parent": "cpe-accounts",
        "layer": "function",
        "title": "dashboard()",
        "description": "Painel do cliente com pedidos e perfil.",
        "file": "accounts/views.py",
        "code": "@login_required\ndef dashboard(request):\n    orders = Order.objects.filter(user=request.user, is_ordered=True)",
        "implementation": [
          "Proteja com @login_required.",
          "Liste Order is_ordered=True.",
          "Template dashboard.html."
        ]
      },
      {
        "id": "cpe-category",
        "parent": "cpe-root",
        "layer": "module",
        "title": "category",
        "description": "Categorias com slug e menu global.",
        "file": "category/",
        "code": "class Category(models.Model):\n    slug = models.SlugField(unique=True)",
        "implementation": [
          "Model Category com slug.",
          "get_url() reverse products_by_category.",
          "Context processor menu_links."
        ]
      },
      {
        "id": "cpe-menu-links",
        "parent": "cpe-category",
        "layer": "function",
        "title": "menu_links()",
        "description": "Injeta categorias no navbar.",
        "file": "category/context_processors.py",
        "code": "def menu_links(request):\n    return dict(links=Category.objects.all())",
        "implementation": [
          "Registre em settings TEMPLATES.",
          "Template usa loop links.",
          "Atualize ao criar categoria."
        ]
      },
      {
        "id": "cpe-store",
        "parent": "cpe-root",
        "layer": "module",
        "title": "store",
        "description": "Catálogo, detalhe, busca e reviews.",
        "file": "store/",
        "code": "urlpatterns: store, product_detail, search, submit_review",
        "implementation": [
          "Models Product, Variation, ReviewRating.",
          "Paginação 6 itens.",
          "Galeria ProductGallery."
        ]
      },
      {
        "id": "cpe-product-model",
        "parent": "cpe-store",
        "layer": "file",
        "title": "Product",
        "description": "Produto com variações e média de reviews.",
        "file": "store/models.py",
        "code": "class Product(models.Model):\n    slug = models.SlugField(unique=True)\n    def averageReview(self): ...",
        "implementation": [
          "FK para Category.",
          "Variation cor/tamanho.",
          "ReviewRating com status."
        ]
      },
      {
        "id": "cpe-product-detail",
        "parent": "cpe-store",
        "layer": "function",
        "title": "product_detail()",
        "description": "Detalhe com galeria, reviews e in_cart.",
        "file": "store/views.py",
        "code": "single_product = Product.objects.get(category__slug=..., slug=...)\nin_cart = CartItem.objects.filter(...).exists()",
        "implementation": [
          "Slugs duplos na URL.",
          "Verifica compra anterior.",
          "Render product_detail.html."
        ]
      },
      {
        "id": "cpe-search",
        "parent": "cpe-store",
        "layer": "function",
        "title": "search()",
        "description": "Busca por nome ou descrição.",
        "file": "store/views.py",
        "code": "products = Product.objects.filter(Q(description__icontains=keyword) | Q(product_name__icontains=keyword))",
        "implementation": [
          "Campo keyword no GET.",
          "Use Q objects OR.",
          "Reutilize store.html."
        ]
      },
      {
        "id": "cpe-review",
        "parent": "cpe-store",
        "layer": "function",
        "title": "submit_review()",
        "description": "Avaliação por estrelas pós-compra.",
        "file": "store/views.py",
        "code": "ReviewRating.objects.create(product=..., user=..., rating=..., review=...)",
        "implementation": [
          "Só se orderproduct exists.",
          "Form ReviewForm.",
          "Redirect HTTP_REFERER."
        ]
      },
      {
        "id": "cpe-carts",
        "parent": "cpe-root",
        "layer": "module",
        "title": "carts",
        "description": "Carrinho sessão/usuário com variações.",
        "file": "carts/",
        "code": "def _cart_id(request): return request.session.session_key or request.session.create()",
        "implementation": [
          "Cart + CartItem models.",
          "M2M variations.",
          "counter context processor."
        ]
      },
      {
        "id": "cpe-add-cart",
        "parent": "cpe-carts",
        "layer": "function",
        "title": "add_cart()",
        "description": "Adiciona produto com variações.",
        "file": "carts/views.py",
        "code": "variation = Variation.objects.get(product=product, variation_category__iexact=key)\nitem.quantity += 1",
        "implementation": [
          "POST com cor/tamanho.",
          "Incrementa se variação igual.",
          "Redirect cart."
        ]
      },
      {
        "id": "cpe-cart-counter",
        "parent": "cpe-carts",
        "layer": "function",
        "title": "counter()",
        "description": "Badge de quantidade no navbar.",
        "file": "carts/context_processors.py",
        "code": "for cart_item in cart_items: cart_count += cart_item.quantity",
        "implementation": [
          "Registre context processor.",
          "Diferencia user vs sessão.",
          "Exiba cart_count no template."
        ]
      },
      {
        "id": "cpe-orders",
        "parent": "cpe-root",
        "layer": "module",
        "title": "orders",
        "description": "Checkout PayPal, Payment e estoque.",
        "file": "orders/",
        "code": "class Order(models.Model): order_number, order_total, is_ordered",
        "implementation": [
          "Models Payment, Order, OrderProduct.",
          "place_order + payments.",
          "E-mail confirmação."
        ]
      },
      {
        "id": "cpe-place-order",
        "parent": "cpe-orders",
        "layer": "function",
        "title": "place_order()",
        "description": "Cria pedido pendente antes do PayPal.",
        "file": "orders/views.py",
        "code": "tax = (2 * total)/100\norder.order_number = current_date + str(data.id)",
        "implementation": [
          "Valida carrinho não vazio.",
          "Taxa 2%.",
          "Render payments.html."
        ]
      },
      {
        "id": "cpe-payments",
        "parent": "cpe-orders",
        "layer": "function",
        "title": "payments()",
        "description": "Confirma PayPal e limpa carrinho.",
        "file": "orders/views.py",
        "code": "payment = Payment(payment_id=body['transID'], ...)\nproduct.stock -= item.quantity",
        "implementation": [
          "JSON do PayPal SDK.",
          "Copia para OrderProduct.",
          "JsonResponse order_number."
        ]
      }
    ]
  },
  {
    "slug": "food-online-django",
    "name": "FoodOnlineDjango",
    "repoUrl": "https://github.com/CanonEngineer/FoodOnlineDjango",
    "color": "#f97316",
    "icon": "django",
    "stack": "Django + PostGIS",
    "summary": "Marketplace multi-vendor com RazorPay, roles Vendor/Customer e busca geoespacial.",
    "nodes": [
      {
        "id": "fod-root",
        "parent": null,
        "layer": "root",
        "title": "FoodOnlineDjango",
        "description": "Plataforma multi-vendor de delivery com Django 5, PostGIS e RazorPay.",
        "file": "foodOnline/",
        "code": "INSTALLED_APPS = ['accounts','vendor','menu','marketplace','customers','orders']\nAUTH_USER_MODEL = 'accounts.User'",
        "implementation": [
          "Clone o repo e configure .env com decouple.",
          "Configure PostGIS no DATABASES.",
          "python manage.py migrate && runserver."
        ]
      },
      {
        "id": "fod-settings",
        "parent": "fod-root",
        "layer": "module",
        "title": "foodOnline/settings.py",
        "description": "Secrets via decouple, PostGIS, context processors e middleware customizado.",
        "file": "foodOnline/settings.py",
        "code": "SECRET_KEY = config('SECRET_KEY')\nDATABASES = {\n    'default': {\n        'ENGINE': 'django.contrib.gis.db.backends.postgis',\n        'NAME': config('DB_NAME'),\n    }\n}\nAUTH_USER_MODEL = 'accounts.User'",
        "implementation": [
          "Crie .env com DB_NAME, DB_USER, DB_PASSWORD.",
          "Registre context processors do marketplace.",
          "Adicione RequestObjectMiddleware."
        ]
      },
      {
        "id": "fod-urls",
        "parent": "fod-settings",
        "layer": "file",
        "title": "urls.py",
        "description": "Roteador raiz: accounts, vendor, marketplace, cart, checkout e orders.",
        "file": "foodOnline/urls.py",
        "code": "urlpatterns = [\n    path('admin/', admin.site.urls),\n    path('', views.home, name='home'),\n    path('', include('accounts.urls')),\n    path('vendor/', include('vendor.urls')),\n    path('cart/', MarketplaceViews.cart, name='cart'),\n    path('orders/', include('orders.urls')),\n]",
        "implementation": [
          "Inclua marketplace.urls e orders.urls.",
          "Sirva MEDIA com static() em DEBUG.",
          "Rota search e checkout no marketplace."
        ]
      },
      {
        "id": "fod-accounts",
        "parent": "fod-root",
        "layer": "module",
        "title": "accounts",
        "description": "Auth customizada com roles Vendor (1) e Customer (2).",
        "file": "accounts/",
        "code": "USERNAME_FIELD = 'email'\nVENDOR = 1\nCUSTOMER = 2",
        "implementation": [
          "Modelo User com UserManager.",
          "UserProfile com PointField PostGIS.",
          "Views de registro, login e ativação."
        ]
      },
      {
        "id": "fod-user-model",
        "parent": "fod-accounts",
        "layer": "file",
        "title": "User",
        "description": "User customizado com email único e campo role.",
        "file": "accounts/models.py",
        "code": "class User(AbstractBaseUser):\n    VENDOR = 1\n    CUSTOMER = 2\n    email = models.EmailField(max_length=100, unique=True)\n    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICE)\n    USERNAME_FIELD = 'email'",
        "implementation": [
          "UserManager com create_user/create_superuser.",
          "USERNAME_FIELD = email.",
          "is_active=False até ativação por e-mail."
        ]
      },
      {
        "id": "fod-roles",
        "parent": "fod-accounts",
        "layer": "function",
        "title": "check_role_vendor()",
        "description": "Decorators RBAC que restringem dashboards por role.",
        "file": "accounts/views.py",
        "code": "def check_role_vendor(user):\n    if user.role == 1:\n        return True\n    else:\n        raise PermissionDenied",
        "implementation": [
          "check_role_customer para role=2.",
          "Use @user_passes_test nos dashboards.",
          "detectUser() redireciona após login."
        ]
      },
      {
        "id": "fod-register-user",
        "parent": "fod-accounts",
        "layer": "function",
        "title": "registerUser()",
        "description": "Cadastro de Customer com create_user e e-mail de verificação.",
        "file": "accounts/views.py",
        "code": "user = User.objects.create_user(\n    first_name=first_name, last_name=last_name,\n    username=username, email=email, password=password)\nuser.role = User.CUSTOMER\nuser.save()\nsend_verification_email(request, user, mail_subject, email_template)",
        "implementation": [
          "UserForm valida POST.",
          "Template account_verification_email.html.",
          "Redirect após sucesso para registerUser."
        ]
      },
      {
        "id": "fod-register-vendor",
        "parent": "fod-accounts",
        "layer": "function",
        "title": "registerVendor()",
        "description": "Cadastro de restaurante: User + Vendor + slug único.",
        "file": "accounts/views.py",
        "code": "user.role = User.VENDOR\nvendor = v_form.save(commit=False)\nvendor.user = user\nvendor.vendor_slug = slugify(vendor_name)+'-'+str(user.id)\nvendor.user_profile = user_profile\nvendor.save()",
        "implementation": [
          "VendorForm com license ImageField.",
          "Associa UserProfile ao Vendor.",
          "Aguarda is_approved no admin."
        ]
      },
      {
        "id": "fod-activate",
        "parent": "fod-accounts",
        "layer": "function",
        "title": "activate()",
        "description": "Ativa conta via uid/token do e-mail.",
        "file": "accounts/views.py",
        "code": "uid = urlsafe_base64_decode(uidb64).decode()\nuser = User._default_manager.get(pk=uid)\nif user is not None and default_token_generator.check_token(user, token):\n    user.is_active = True\n    user.save()",
        "implementation": [
          "Link activate/<uidb64>/<token>/.",
          "Mensagem de sucesso no redirect.",
          "Invalid link redireciona myAccount."
        ]
      },
      {
        "id": "fod-vendor",
        "parent": "fod-root",
        "layer": "module",
        "title": "vendor",
        "description": "Perfil de restaurante, horários e aprovação admin.",
        "file": "vendor/",
        "code": "class Vendor(models.Model):\n    vendor_slug = models.SlugField(unique=True)\n    is_approved = models.BooleanField(default=False)",
        "implementation": [
          "OneToOne User e UserProfile.",
          "OpeningHour por dia da semana.",
          "E-mail ao mudar is_approved."
        ]
      },
      {
        "id": "fod-vendor-model",
        "parent": "fod-vendor",
        "layer": "file",
        "title": "Vendor",
        "description": "Modelo Vendor com slug e verificação de horário.",
        "file": "vendor/models.py",
        "code": "def is_open(self):\n    today = date.today().isoweekday()\n    current_opening_hours = OpeningHour.objects.filter(vendor=self, day=today)\n    for i in current_opening_hours:\n        if current_time > start and current_time < end:\n            is_open = True",
        "implementation": [
          "is_open() compara from_hour/to_hour.",
          "save() envia admin_approval_email.",
          "FK para OpeningHour."
        ]
      },
      {
        "id": "fod-menu",
        "parent": "fod-root",
        "layer": "module",
        "title": "menu",
        "description": "Categorias e itens de comida por vendor.",
        "file": "menu/",
        "code": "class Category(models.Model):\n    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)\n    category_name = models.CharField(max_length=50)",
        "implementation": [
          "CRUD no dashboard do vendor.",
          "Slug único por FoodItem.",
          "ImageField em foodimages/."
        ]
      },
      {
        "id": "fod-fooditem",
        "parent": "fod-menu",
        "layer": "file",
        "title": "FoodItem",
        "description": "Item do cardápio com preço e disponibilidade.",
        "file": "menu/models.py",
        "code": "class FoodItem(models.Model):\n    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)\n    food_title = models.CharField(max_length=50)\n    price = models.DecimalField(max_digits=10, decimal_places=2)\n    is_available = models.BooleanField(default=True)",
        "implementation": [
          "FK vendor e category.",
          "Upload image em foodimages/.",
          "Filtre is_available no marketplace."
        ]
      },
      {
        "id": "fod-marketplace",
        "parent": "fod-root",
        "layer": "module",
        "title": "marketplace",
        "description": "Listagem, carrinho AJAX e busca geoespacial.",
        "file": "marketplace/",
        "code": "class Cart(models.Model):\n    user = models.ForeignKey(User, on_delete=models.CASCADE)\n    fooditem = models.ForeignKey(FoodItem, on_delete=models.CASCADE)\n    quantity = models.PositiveIntegerField()",
        "implementation": [
          "add_to_cart retorna JsonResponse.",
          "search() usa PostGIS distance_lte.",
          "checkout pré-preenche OrderForm."
        ]
      },
      {
        "id": "fod-cart-counter",
        "parent": "fod-marketplace",
        "layer": "function",
        "title": "get_cart_counter()",
        "description": "Context processor com badge de quantidade no navbar.",
        "file": "marketplace/context_processors.py",
        "code": "def get_cart_counter(request):\n    cart_count = 0\n    if request.user.is_authenticated:\n        cart_items = Cart.objects.filter(user=request.user)\n        for cart_item in cart_items:\n            cart_count += cart_item.quantity\n    return dict(cart_count=cart_count)",
        "implementation": [
          "Registre em TEMPLATES context_processors.",
          "get_cart_amounts calcula taxas.",
          "Badge no navbar."
        ]
      },
      {
        "id": "fod-add-cart",
        "parent": "fod-marketplace",
        "layer": "function",
        "title": "add_to_cart()",
        "description": "Adiciona item via AJAX incrementando quantity.",
        "file": "marketplace/views.py",
        "code": "if request.headers.get('x-requested-with') == 'XMLHttpRequest':\n    chkCart = Cart.objects.get(user=request.user, fooditem=fooditem)\n    chkCart.quantity += 1\n    chkCart.save()\n    return JsonResponse({'status': 'Success', 'cart_counter': get_cart_counter(request)})",
        "implementation": [
          "Requer usuário autenticado.",
          "Cria Cart se não existir.",
          "decrease_cart e delete_cart complementam."
        ]
      },
      {
        "id": "fod-search",
        "parent": "fod-marketplace",
        "layer": "function",
        "title": "search()",
        "description": "Busca vendors por keyword e raio PostGIS.",
        "file": "marketplace/views.py",
        "code": "pnt = GEOSGeometry('POINT(%s %s)' % (longitude, latitude))\nvendors = Vendor.objects.filter(\n    user_profile__location__distance_lte=(pnt, D(km=radius))\n).annotate(distance=Distance('user_profile__location', pnt))",
        "implementation": [
          "Google Maps API no frontend.",
          "Filtra FoodItem por food_title.",
          "Annotate distance e ordena."
        ]
      },
      {
        "id": "fod-orders",
        "parent": "fod-root",
        "layer": "module",
        "title": "orders",
        "description": "Checkout multi-vendor, Payment e OrderedFood.",
        "file": "orders/",
        "code": "class Order(models.Model):\n    order_number = models.CharField(max_length=20)\n    tax_data = models.JSONField(blank=True, null=True)\n    is_ordered = models.BooleanField(default=False)",
        "implementation": [
          "total_data JSON por vendor.",
          "generate_order_number().",
          "E-mails confirmação e vendor."
        ]
      },
      {
        "id": "fod-place-order",
        "parent": "fod-orders",
        "layer": "function",
        "title": "place_order()",
        "description": "Cria pedido pendente agrupando taxas por vendor.",
        "file": "orders/views.py",
        "code": "client = razorpay.Client(auth=(RZP_KEY_ID, RZP_KEY_SECRET))\norder.tax_data = json.dumps(tax_data)\norder.total_data = json.dumps(total_data)\norder.order_number = generate_order_number(order.id)\norder.vendors.add(*vendors_id)",
        "implementation": [
          "Valida carrinho não vazio.",
          "DATA RazorPay com amount*100.",
          "Render place_order.html."
        ]
      },
      {
        "id": "fod-payments",
        "parent": "fod-orders",
        "layer": "function",
        "title": "payments()",
        "description": "Confirma pagamento AJAX e notifica vendors.",
        "file": "orders/views.py",
        "code": "payment = Payment(\n    user=request.user,\n    transaction_id=transaction_id,\n    amount=order.total,\n    status=status)\norder.is_ordered = True\ncart_items.delete()\nreturn JsonResponse({'order_number': order_number})",
        "implementation": [
          "POST com X-Requested-With XMLHttpRequest.",
          "Copia Cart para OrderedFood.",
          "send_notification para cada vendor."
        ]
      }
    ]
  },
  {
    "slug": "javascript-dropbox",
    "name": "JavaScriptDropBoxProject",
    "repoUrl": "https://github.com/CanonEngineer/JavaScriptDropBoxProject",
    "color": "#eab308",
    "icon": "javascript",
    "stack": "Express + Firebase",
    "summary": "Clone Dropbox — Firebase Storage, barra de progresso, seleção Ctrl/Shift e ícones por MIME.",
    "nodes": [
      {
        "id": "jdb-root",
        "parent": null,
        "layer": "root",
        "title": "JavaScriptDropBoxProject",
        "description": "Clone Dropbox no browser — Express serve a SPA, Firebase Realtime DB + Storage, upload com barra de progresso.",
        "file": "public/src/",
        "code": "// HiperCloud — navegação SPA sem reload\n// Firebase Storage + Realtime Database\nwindow.app = new DropBoxController();",
        "implementation": [
          "Clone o repo e npm install.",
          "Configure firebaseConfig no controller.",
          "npm start → porta 3000."
        ]
      },
      {
        "id": "jdb-backend",
        "parent": "jdb-root",
        "layer": "module",
        "title": "Backend Express",
        "description": "Servidor Node com EJS, static em public/ e rotas legacy com Formidable.",
        "file": "app.js",
        "code": "var app = express();\napp.use(express.static(path.join(__dirname, 'public')));\napp.use('/', indexRouter);",
        "implementation": [
          "Express 4 + cookie-parser.",
          "views/index.ejs renderiza o clone.",
          "Rotas /upload e /file para modo local legado."
        ]
      },
      {
        "id": "jdb-app",
        "parent": "jdb-backend",
        "layer": "file",
        "title": "app.js",
        "description": "Bootstrap do Express: middlewares, views e routers.",
        "file": "app.js",
        "code": "app.set('view engine', 'ejs');\napp.use(logger('dev'));\napp.use(express.json());\napp.use(express.static(path.join(__dirname, 'public')));",
        "implementation": [
          "Monte indexRouter em /.",
          "Error handler renderiza error.ejs.",
          "Export module.exports = app."
        ]
      },
      {
        "id": "jdb-bin-www",
        "parent": "jdb-backend",
        "layer": "file",
        "title": "bin/www",
        "description": "HTTP server na porta 3000 com tratamento EADDRINUSE.",
        "file": "bin/www",
        "code": "var port = normalizePort(process.env.PORT || '3000');\nvar server = http.createServer(app);\nserver.listen(port);",
        "implementation": [
          "normalizePort valida número.",
          "debug('app:server') no listen.",
          "Usado por npm start."
        ]
      },
      {
        "id": "jdb-routes-mod",
        "parent": "jdb-backend",
        "layer": "module",
        "title": "routes/index.js",
        "description": "Rotas REST para home, upload multipart e delete de arquivos locais.",
        "file": "routes/index.js",
        "code": "router.get('/', ...);\nrouter.post('/upload', ...);\nrouter.get('/file', ...);\nrouter.delete('/file', ...);",
        "implementation": [
          "formidable.IncomingForm com uploadDir ./upload.",
          "GET /file lê path da query.",
          "Versão cloud usa Firebase no client."
        ]
      },
      {
        "id": "jdb-route-home",
        "parent": "jdb-routes-mod",
        "layer": "function",
        "title": "GET /",
        "description": "Renderiza index.ejs com layout Dropbox clone.",
        "file": "routes/index.js",
        "code": "router.get('/', function(req, res, next) {\n  res.render('index', { title: 'Express' });\n});",
        "implementation": [
          "EJS injeta HTML da UI.",
          "Scripts Firebase no final da página.",
          "DropBoxController inicia no index.js."
        ]
      },
      {
        "id": "jdb-route-upload",
        "parent": "jdb-routes-mod",
        "layer": "function",
        "title": "POST /upload",
        "description": "Upload local via Formidable (legado antes do Firebase).",
        "file": "routes/index.js",
        "code": "let form = new formidable.IncomingForm({ uploadDir: './upload', keepExtensions: true });\nform.parse(req, (err, fields, files) => { res.json({ files }); });",
        "implementation": [
          "Multipart para pasta upload/.",
          "Retorna JSON com metadados.",
          "Substituído por Firebase Storage no client."
        ]
      },
      {
        "id": "jdb-route-file-get",
        "parent": "jdb-routes-mod",
        "layer": "function",
        "title": "GET /file",
        "description": "Serve arquivo do disco por query ?path=.",
        "file": "routes/index.js",
        "code": "let path = './' + req.query.path;\nfs.readFile(path, (err, data) => res.status(200).end(data));",
        "implementation": [
          "404 se não existir.",
          "Usado no modo local comentado.",
          "Cloud abre downloadURL direto."
        ]
      },
      {
        "id": "jdb-route-delete",
        "parent": "jdb-routes-mod",
        "layer": "function",
        "title": "DELETE /file",
        "description": "Remove arquivo local via Formidable fields.",
        "file": "routes/index.js",
        "code": "form.parse(req, (err, fields) => {\n  fs.unlink('./' + fields.path, err => res.json({ fields }));\n});",
        "implementation": [
          "fields.path do body multipart.",
          "Resposta JSON com key.",
          "Espelho do removeFile Firebase."
        ]
      },
      {
        "id": "jdb-frontend",
        "parent": "jdb-root",
        "layer": "module",
        "title": "Frontend SPA",
        "description": "Interface estilo Dropbox com sidebar, breadcrumb e grid de arquivos.",
        "file": "views/index.ejs",
        "code": "<div id=\"browse-location\"></div>\n<ul id=\"list-of-files-and-directories\"></ul>\n<div id=\"react-snackbar-root\">...</div>",
        "implementation": [
          "Bootstrap + dropbox-clone.css.",
          "Botões nova pasta, renomear, excluir.",
          "Input #files oculto para upload."
        ]
      },
      {
        "id": "jdb-index-ejs",
        "parent": "jdb-frontend",
        "layer": "file",
        "title": "views/index.ejs",
        "description": "Template EJS com sidebar Hiperware e área de arquivos.",
        "file": "views/index.ejs",
        "code": "<nav class=\"col-md-2 sidebar\">...</nav>\n<main id=\"browse-location\">...</main>",
        "implementation": [
          "Logo SVG estilo Dropbox.",
          "Inclui Firebase SDK.",
          "Carrega index.js no final."
        ]
      },
      {
        "id": "jdb-index-js",
        "parent": "jdb-frontend",
        "layer": "file",
        "title": "public/src/index.js",
        "description": "Bootstrap do controller após DOM pronto.",
        "file": "public/src/index.js",
        "code": "window.app = new DropBoxController();",
        "implementation": [
          "Uma linha instancia o app.",
          "Classe em controller/DropBoxController.js.",
          "Expõe global para debug."
        ]
      },
      {
        "id": "jdb-dropbox-css",
        "parent": "jdb-frontend",
        "layer": "file",
        "title": "dropbox-clone.css",
        "description": "Estilos do grid, seleção múltipla e snackbar de upload.",
        "file": "public/assets/css/dropbox-clone.css",
        "code": ".selected { outline: 2px solid #0062ff; }\n.mc-progress-bar-fg { transition: width .2s; }",
        "implementation": [
          "Tiles com preview SVG.",
          "Breadcrumb segmentado.",
          "Modal de progresso fixo no rodapé."
        ]
      },
      {
        "id": "jdb-controller",
        "parent": "jdb-root",
        "layer": "module",
        "title": "DropBoxController",
        "description": "Classe central: Firebase, navegação, CRUD e seleção Ctrl/Shift.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "class DropBoxController {\n  constructor() {\n    this.currentFolder = ['HiperCloud'];\n    this.connDatabase();\n    this.initEvents();\n    this.openFolder();\n  }\n}",
        "implementation": [
          "currentFolder é pilha de paths.",
          "onselectionchange Event custom.",
          "Refs DOM no constructor."
        ]
      },
      {
        "id": "jdb-conn-db",
        "parent": "jdb-controller",
        "layer": "function",
        "title": "connDatabase()",
        "description": "Inicializa Firebase App com config do projeto.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "const firebaseConfig = { /* credenciais */ };\nfirebase.initializeApp(firebaseConfig);",
        "implementation": [
          "Realtime Database + Storage.",
          "SDK carregado no EJS.",
          "Config não commitada no repo público."
        ]
      },
      {
        "id": "jdb-firebase-ref",
        "parent": "jdb-controller",
        "layer": "function",
        "title": "getFirebaseRef()",
        "description": "Retorna ref do Realtime DB para o path atual.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "getFirebaseRef(path) {\n  if (!path) path = this.currentFolder.join('/');\n  return firebase.database().ref(path);\n}",
        "implementation": [
          "Join com '/'.",
          "Usado em push/set/on.",
          "off('value') ao trocar pasta."
        ]
      },
      {
        "id": "jdb-navigation",
        "parent": "jdb-root",
        "layer": "module",
        "title": "Navegação de pastas",
        "description": "Breadcrumb, leitura reativa e duplo-clique para entrar em pastas.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "openFolder() → renderNav() + readFiles()",
        "implementation": [
          "SPA sem reload de página.",
          "lastFolder guarda listener anterior.",
          "Duplo-clique push no currentFolder."
        ]
      },
      {
        "id": "jdb-open-folder",
        "parent": "jdb-navigation",
        "layer": "function",
        "title": "openFolder()",
        "description": "Troca de pasta: desliga listener antigo e recarrega lista.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "openFolder() {\n  if (this.lastFolder) this.getFirebaseRef(this.lastFolder).off('value');\n  this.renderNav();\n  this.readFiles();\n}",
        "implementation": [
          "Evita memory leak no on('value').",
          "Atualiza breadcrumb.",
          "Chamado ao clicar pasta ou breadcrumb."
        ]
      },
      {
        "id": "jdb-render-nav",
        "parent": "jdb-navigation",
        "layer": "function",
        "title": "renderNav()",
        "description": "Monta breadcrumb clicável da pilha currentFolder.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "span.innerHTML = `<a href=\"#\" data-path=\"${path.join('/')}\">${folderName}</a>`;",
        "implementation": [
          "Último segmento sem link.",
          "SVG seta entre segmentos.",
          "Click trunca currentFolder."
        ]
      },
      {
        "id": "jdb-read-files",
        "parent": "jdb-navigation",
        "layer": "function",
        "title": "readFiles()",
        "description": "Escuta Firebase value e renderiza grid de arquivos.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "this.getFirebaseRef().on('value', snapshot => {\n  snapshot.forEach(item => {\n    this.listFilesEl.appendChild(this.getFileView(data, key));\n  });\n});",
        "implementation": [
          "Limpa innerHTML a cada snapshot.",
          "Filtra itens com data.type.",
          "initEventsLi em cada <li>."
        ]
      },
      {
        "id": "jdb-upload-mod",
        "parent": "jdb-root",
        "layer": "module",
        "title": "Upload Firebase Storage",
        "description": "Envio com barra de progresso, ETA e metadata downloadURL.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "uploadTask(files) → uploadProgress() → push no Realtime DB",
        "implementation": [
          "Formidable legado comentado no final.",
          "modalShow snackbar inferior.",
          "Promise.all para múltiplos arquivos."
        ]
      },
      {
        "id": "jdb-upload-task",
        "parent": "jdb-upload-mod",
        "layer": "function",
        "title": "uploadTask()",
        "description": "fileRef.put(file) com state_changed e getDownloadURL.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "let task = fileRef.put(file);\ntask.on('state_changed', snapshot => this.uploadProgress(...));\ntask.snapshot.ref.getDownloadURL().then(url => ref.updateMetadata({ customMetadata: { downloadURL: url } }));",
        "implementation": [
          "child(file.name) no path atual.",
          "Resolve metadata após upload.",
          "push no DB com name, type, path, size."
        ]
      },
      {
        "id": "jdb-upload-progress",
        "parent": "jdb-upload-mod",
        "layer": "function",
        "title": "uploadProgress()",
        "description": "Calcula % e tempo restante com base em bytesTransferred.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "let porcent = parseInt((loaded / total) * 100);\nlet timeleft = ((100 - porcent) * timespent) / porcent;\nthis.progressBarEl.style.width = `${porcent}%`;",
        "implementation": [
          "startUploadTime no onloadstart (ajax legado).",
          "nameFileEl mostra arquivo atual.",
          "formatTimeToHuman no timeleftEl."
        ]
      },
      {
        "id": "jdb-format-time",
        "parent": "jdb-upload-mod",
        "layer": "function",
        "title": "formatTimeToHuman()",
        "description": "Converte ms restantes em texto PT-BR legível.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "if (hours > 0) return `${hours} horas, ${minutes} minutos e ${seconds} segundos`;",
        "implementation": [
          "Horas, minutos ou só segundos.",
          "Retorna '' se instantâneo.",
          "Exibido na snackbar de upload."
        ]
      },
      {
        "id": "jdb-modal-show",
        "parent": "jdb-upload-mod",
        "layer": "function",
        "title": "modalShow()",
        "description": "Exibe/oculta snackbar de progresso (#react-snackbar-root).",
        "file": "public/src/controller/DropBoxController.js",
        "code": "modalShow(show = true) {\n  this.snackModalEl.style.display = show ? 'block' : 'none';\n}",
        "implementation": [
          "Chamado no change do input files.",
          "uploadComplete(false) ao terminar.",
          "Desabilita btn-send durante upload."
        ]
      },
      {
        "id": "jdb-crud",
        "parent": "jdb-root",
        "layer": "module",
        "title": "CRUD arquivos e pastas",
        "description": "Criar pasta, renomear, excluir recursivo no DB + Storage.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "initEvents() → removeTask() → removeFolder() / removeFile()",
        "implementation": [
          "prompt() para nome pasta/renomear.",
          "selectionchange controla botões.",
          "Promise.all em removeTask."
        ]
      },
      {
        "id": "jdb-init-events",
        "parent": "jdb-crud",
        "layer": "function",
        "title": "initEvents()",
        "description": "Bind nova pasta, delete, rename e input de upload.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "this.btnNewFolder.addEventListener('click', () => {\n  this.getFirebaseRef().push().set({ name, type: 'folder', path: ... });\n});",
        "implementation": [
          "btnSendFile dispara inputFiles.click().",
          "change chama uploadTask.",
          "selectionchange listener na lista."
        ]
      },
      {
        "id": "jdb-remove-task",
        "parent": "jdb-crud",
        "layer": "function",
        "title": "removeTask()",
        "description": "Deleta todos os itens selecionados com Promise.all.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "this.getSelection().forEach(li => {\n  promises.push(file.type === 'folder' ? this.removeFolder(...) : this.removeFile(...));\n});",
        "implementation": [
          "Remove child key no Realtime DB.",
          "Pasta recursiva antes do Storage.",
          "Erro logado no console."
        ]
      },
      {
        "id": "jdb-remove-folder",
        "parent": "jdb-crud",
        "layer": "function",
        "title": "removeFolder()",
        "description": "Recursão: percorre snapshot e apaga subpastas/arquivos.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "folderRef.on('value', snapshot => {\n  snapshot.forEach(item => {\n    if (data.type === 'folder') this.removeFolder(...);\n    else this.removeFile(...);\n  });\n  folderRef.remove();\n});",
        "implementation": [
          "Promise por item filho.",
          "folderRef.off após leitura.",
          "Apaga nó pai no final."
        ]
      },
      {
        "id": "jdb-remove-file",
        "parent": "jdb-crud",
        "layer": "function",
        "title": "removeFile()",
        "description": "firebase.storage().ref(ref).child(name).delete().",
        "file": "public/src/controller/DropBoxController.js",
        "code": "let fileRef = firebase.storage().ref(ref).child(name);\nreturn fileRef.delete();",
        "implementation": [
          "Path = currentFolder + nome.",
          "Chamado na recursão.",
          "DB key removido em removeTask."
        ]
      },
      {
        "id": "jdb-selection",
        "parent": "jdb-root",
        "layer": "module",
        "title": "Seleção Ctrl / Shift",
        "description": "Lógica de multi-select estilo explorador de arquivos.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "initEventsLi(li) — click, dblclick, ctrl, shift",
        "implementation": [
          "CustomEvent selectionchange.",
          "getSelection() retorna .selected.",
          "Toggle botões rename/delete."
        ]
      },
      {
        "id": "jdb-get-selection",
        "parent": "jdb-selection",
        "layer": "function",
        "title": "getSelection()",
        "description": "querySelectorAll('.selected') na lista de arquivos.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "getSelection() {\n  return this.listFilesEl.querySelectorAll('.selected');\n}",
        "implementation": [
          "Usado em removeTask e rename.",
          "Case 0/1/N no selectionchange.",
          "Renomear só com 1 item."
        ]
      },
      {
        "id": "jdb-init-events-li",
        "parent": "jdb-selection",
        "layer": "function",
        "title": "initEventsLi()",
        "description": "Click com Ctrl toggle; Shift seleciona intervalo; dblclick abre.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "if (e.shiftKey) { /* indexStart..indexEnd */ }\nif (!e.ctrlKey) { clear selected }\nli.classList.toggle('selected');",
        "implementation": [
          "dblclick pasta → openFolder.",
          "dblclick arquivo → window.open(path).",
          "dispatchEvent selectionchange."
        ]
      },
      {
        "id": "jdb-icons",
        "parent": "jdb-root",
        "layer": "module",
        "title": "Ícones por MIME type",
        "description": "SVG inline para pasta, imagem, PDF, Office, áudio e vídeo.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "getFileIconView(file) — switch(file.type)",
        "implementation": [
          "folder → SVG azul Dropbox.",
          "image/jpeg, application/pdf, etc.",
          "default → ícone genérico."
        ]
      },
      {
        "id": "jdb-get-file-icon",
        "parent": "jdb-icons",
        "layer": "function",
        "title": "getFileIconView()",
        "description": "Switch por MIME retornando template SVG 160×160.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "switch (file.type) {\n  case 'folder': return `<svg>...</svg>`;\n  case 'image/jpeg': ...\n  case 'application/pdf': ...\n}",
        "implementation": [
          "Word, Excel, PowerPoint mapeados.",
          "audio/mp3 e video/mp4.",
          "HTML string injetado no <li>."
        ]
      },
      {
        "id": "jdb-get-file-view",
        "parent": "jdb-icons",
        "layer": "function",
        "title": "getFileView()",
        "description": "Cria <li> com dataset.file JSON e ícone + nome.",
        "file": "public/src/controller/DropBoxController.js",
        "code": "li.dataset.key = key;\nli.dataset.file = JSON.stringify(file);\nli.innerHTML = `${this.getFileIconView(file)}<div class=\"name\">${file.name}</div>`;",
        "implementation": [
          "initEventsLi antes de append.",
          "Nome centralizado abaixo do ícone.",
          "key do Firebase no dataset."
        ]
      },
      {
        "id": "jdb-ajax",
        "parent": "jdb-backend",
        "layer": "function",
        "title": "ajax()",
        "description": "XHR Promise com upload.onprogress (modo local legado).",
        "file": "public/src/controller/DropBoxController.js",
        "code": "ajax(url, method, formData, onprogress, onloadstart) {\n  return new Promise((resolve, reject) => { ... });\n}",
        "implementation": [
          "Usado no uploadTask comentado.",
          "JSON.parse na response.",
          "Espelha API fetch moderna."
        ]
      },
      {
        "id": "jdb-firebase-storage",
        "parent": "jdb-upload-mod",
        "layer": "file",
        "title": "Firebase Storage",
        "description": "Blob storage na nuvem com downloadURL em customMetadata.",
        "file": "Firebase Console → Storage",
        "code": "fileRef.put(file) → getDownloadURL() → updateMetadata({ customMetadata: { downloadURL } })",
        "implementation": [
          "Regras de segurança no console.",
          "Path espelha currentFolder.",
          "URL aberta em nova aba no dblclick."
        ]
      }
    ]
  },
  {
    "slug": "javascript-restaurant",
    "name": "JavaScriptRestaurantProject",
    "repoUrl": "https://github.com/CanonEngineer/JavaScriptRestaurantProject",
    "color": "#f97316",
    "icon": "javascript",
    "stack": "Express + MySQL + Redis",
    "summary": "Restaurante Saboroso — cardápio, reservas, contato e painel AdminLTE com MySQL.",
    "nodes": [
      {
        "id": "jsr-root",
        "parent": null,
        "layer": "root",
        "title": "JavaScriptRestaurantProject",
        "description": "Restaurante Saboroso — site + painel admin com Express, EJS, MySQL, Redis e AdminLTE.",
        "file": "app.js",
        "code": "// Restaurante Saboroso\n// MySQL tb_menus, tb_reservations, tb_contacts\n// Admin /admin com AdminLTE",
        "implementation": [
          "Clone o repo e npm install.",
          "Configure MySQL database saboroso e Redis.",
          "npm start → porta 3000."
        ]
      },
      {
        "id": "jsr-backend",
        "parent": "jsr-root",
        "layer": "module",
        "title": "Backend Express",
        "description": "Servidor com sessão Redis, upload Formidable e rotas públicas/admin.",
        "file": "app.js",
        "code": "app.use(session({ store: new RedisStore({ host:'localhost', port:6379 }) }));\napp.use('/', indexRouter);\napp.use('/admin', adminRouter);",
        "implementation": [
          "EJS view engine.",
          "express.static em public/.",
          "Middleware multipart para fotos do menu."
        ]
      },
      {
        "id": "jsr-app",
        "parent": "jsr-backend",
        "layer": "file",
        "title": "app.js",
        "description": "Bootstrap: sessão Redis, parsers, static e routers.",
        "file": "app.js",
        "code": "var RedisStore = require('connect-redis')(session);\napp.use(session({ store: new RedisStore(...), secret:'p@ssw0rd' }));",
        "implementation": [
          "Formidable salva em public/images/.",
          "Cookie-parser e morgan logger.",
          "Error handler renderiza error.ejs."
        ]
      },
      {
        "id": "jsr-bin-www",
        "parent": "jsr-backend",
        "layer": "file",
        "title": "bin/www",
        "description": "HTTP server na porta 3000 com nodemon.",
        "file": "bin/www",
        "code": "var port = normalizePort(process.env.PORT || '3000');\nserver.listen(port);",
        "implementation": [
          "npm start usa nodemon.",
          "Tratamento EADDRINUSE.",
          "Debug app:server."
        ]
      },
      {
        "id": "jsr-formidable",
        "parent": "jsr-app",
        "layer": "function",
        "title": "Middleware Formidable",
        "description": "Parse multipart antes das rotas — upload de fotos do cardápio.",
        "file": "app.js",
        "code": "if (req.method === 'POST' && contentType.indexOf('multipart/form-data') > -1) {\n  form.parse(req, (err, fields, files) => { req.body = fields; req.files = files; next(); });\n}",
        "implementation": [
          "uploadDir: public/images.",
          "keepExtensions: true.",
          "Disponível em rotas admin de menus."
        ]
      },
      {
        "id": "jsr-session",
        "parent": "jsr-app",
        "layer": "function",
        "title": "Sessão Redis",
        "description": "express-session com connect-redis para painel admin.",
        "file": "app.js",
        "code": "app.use(session({ store: new RedisStore({ host:'localhost', port:6379 }), secret:'p@ssw0rd', resave:true }));",
        "implementation": [
          "Redis na porta 6379.",
          "req.session.user após login.",
          "Logout deleta session.user."
        ]
      },
      {
        "id": "jsr-db",
        "parent": "jsr-root",
        "layer": "module",
        "title": "Banco MySQL",
        "description": "Conexão mysql2 com database saboroso.",
        "file": "inc/db.js",
        "code": "const connection = mysql.createConnection({ host:'localhost', user:'user', database:'saboroso', multipleStatements:true });",
        "implementation": [
          "Tabelas: tb_menus, tb_reservations, tb_contacts, tb_users, tb_emails.",
          "Promises nos módulos inc/.",
          "Pagination usa FOUND_ROWS()."
        ]
      },
      {
        "id": "jsr-routes-public",
        "parent": "jsr-root",
        "layer": "module",
        "title": "Rotas públicas",
        "description": "Site do cliente: home, cardápio, reservas e contato.",
        "file": "routes/index.js",
        "code": "router.get('/', ...);\nrouter.get('/menus', ...);\nrouter.get('/reservations', ...);\nrouter.post('/contacts', ...);",
        "implementation": [
          "EJS com background hero.",
          "Validação server-side nos POST.",
          "E-mails de notificação opcionais."
        ]
      },
      {
        "id": "jsr-home",
        "parent": "jsr-routes-public",
        "layer": "function",
        "title": "GET /",
        "description": "Home com lista de menus em destaque.",
        "file": "routes/index.js",
        "code": "menus.getMenus().then(results => {\n  res.render('index', { title: 'Restaurante Saboroso!', menus: results, isHome: true });\n});",
        "implementation": [
          "Template index.ejs.",
          "Flag isHome para navbar.",
          "Fotos em public/images/."
        ]
      },
      {
        "id": "jsr-menus-page",
        "parent": "jsr-routes-public",
        "layer": "function",
        "title": "GET /menus",
        "description": "Página do cardápio completo com preços.",
        "file": "routes/index.js",
        "code": "res.render('menus', { title: 'Menus - Restaurante Saboroso!', h1: 'Saboreie nosso menu!', menus: results });",
        "implementation": [
          "background images/img_bg_1.jpg.",
          "Loop EJS nos itens.",
          "Dados de tb_menus."
        ]
      },
      {
        "id": "jsr-reservations-page",
        "parent": "jsr-routes-public",
        "layer": "function",
        "title": "POST /reservations",
        "description": "Formulário de reserva de mesa com validação.",
        "file": "routes/index.js",
        "code": "if(!req.body.name) reservations.render(req, res, 'Digite o nome');\nelse reservations.save(req.body).then(...);",
        "implementation": [
          "Campos: name, email, people, date, time.",
          "Conversão data DD/MM/YYYY.",
          "Mensagem de sucesso no render."
        ]
      },
      {
        "id": "jsr-contacts-page",
        "parent": "jsr-routes-public",
        "layer": "function",
        "title": "POST /contacts",
        "description": "Formulário de contato gravado em tb_contacts.",
        "file": "routes/index.js",
        "code": "contacts.save(req.body).then(() => contacts.render(req, res, null, 'Contato enviado com sucesso!'));",
        "implementation": [
          "Valida name, email, message.",
          "background img_bg_3.jpg.",
          "Admin lista em /admin/contacts."
        ]
      },
      {
        "id": "jsr-admin-routes",
        "parent": "jsr-root",
        "layer": "module",
        "title": "Painel Admin",
        "description": "AdminLTE: dashboard, CRUD menus, reservas, usuários.",
        "file": "routes/admin.js",
        "code": "router.get('/', admin.dashboard());\nrouter.post('/login', users.login);\nrouter.get('/menus', ...);",
        "implementation": [
          "moment.locale('pt-BR').",
          "req.menus = admin.getMenus(req).",
          "Templates em views/admin/."
        ]
      },
      {
        "id": "jsr-dashboard",
        "parent": "jsr-admin-routes",
        "layer": "function",
        "title": "admin.dashboard()",
        "description": "Contadores de contatos, menus, reservas e usuários.",
        "file": "inc/admin.js",
        "code": "SELECT (SELECT COUNT(*) FROM tb_contacts) AS nrcontacts, (SELECT COUNT(*) FROM tb_menus) AS nrmenus, ...",
        "implementation": [
          "Cards no admin/index.ejs.",
          "AdminLTE boxes.",
          "Promise resolve results[0]."
        ]
      },
      {
        "id": "jsr-admin-login",
        "parent": "jsr-admin-routes",
        "layer": "function",
        "title": "POST /admin/login",
        "description": "Autenticação por email/senha em tb_users.",
        "file": "inc/users.js",
        "code": "users.login(email, password).then(user => res.redirect('/admin')).catch(err => users.render(req, res, err.message));",
        "implementation": [
          "Comparação password plain (legado).",
          "Sessão req.session.user.",
          "Redirect /admin/login se falhar."
        ]
      },
      {
        "id": "jsr-menus-mod",
        "parent": "jsr-root",
        "layer": "module",
        "title": "CRUD Cardápio",
        "description": "Gerencia tb_menus com foto, título, descrição e preço.",
        "file": "inc/menus.js",
        "code": "getMenus() / save(fields, files) / delete(id)",
        "implementation": [
          "Upload photo → public/images/.",
          "UPDATE ou INSERT conforme fields.id.",
          "Listagem paginada no admin."
        ]
      },
      {
        "id": "jsr-menus-get",
        "parent": "jsr-menus-mod",
        "layer": "function",
        "title": "getMenus()",
        "description": "SELECT * FROM tb_menus ORDER BY title.",
        "file": "inc/menus.js",
        "code": "conn.query('SELECT * FROM tb_menus ORDER BY title', (err, results) => resolve(results));",
        "implementation": [
          "Usado na home e /menus.",
          "Admin lista com edição.",
          "Cada item tem photo path."
        ]
      },
      {
        "id": "jsr-menus-save",
        "parent": "jsr-menus-mod",
        "layer": "function",
        "title": "save()",
        "description": "INSERT/UPDATE com foto opcional via Formidable.",
        "file": "inc/menus.js",
        "code": "fields.photo = `images/${path.parse(files.photo.path).base}`;\nINSERT INTO tb_menus (title, description, price, photo) VALUES(?, ?, ?, ?)",
        "implementation": [
          "Rejeita se novo item sem foto.",
          "queryPhoto dinâmico no UPDATE.",
          "Params title, description, price."
        ]
      },
      {
        "id": "jsr-reservations-mod",
        "parent": "jsr-root",
        "layer": "module",
        "title": "Reservas",
        "description": "tb_reservations com paginação e moment.js.",
        "file": "inc/reservations.js",
        "code": "save(fields) / getReservations(req) / delete(id)",
        "implementation": [
          "Data convertida de DD/MM/YYYY para MySQL.",
          "Classe Pagination.",
          "Admin confirma/exclui reservas."
        ]
      },
      {
        "id": "jsr-reservations-save",
        "parent": "jsr-reservations-mod",
        "layer": "function",
        "title": "save()",
        "description": "Grava reserva com nome, email, pessoas, data e hora.",
        "file": "inc/reservations.js",
        "code": "INSERT INTO tb_reservations (name, email, people, date, time) VALUES(?, ?, ?, ?, ?)",
        "implementation": [
          "UPDATE se fields.id > 0.",
          "Validação no router antes do save.",
          "Render com error/success."
        ]
      },
      {
        "id": "jsr-pagination",
        "parent": "jsr-reservations-mod",
        "layer": "file",
        "title": "Pagination.js",
        "description": "Paginação SQL com FOUND_ROWS e navegação.",
        "file": "inc/Pagination.js",
        "code": "class Pagination { getPage(page) { conn.query([query, 'SELECT FOUND_ROWS() AS FOUND_ROWS'].join(';'), ...) } }",
        "implementation": [
          "itemPerPage default 10.",
          "getNavigation() gera links.",
          "Usado em reservas e listagens admin."
        ]
      },
      {
        "id": "jsr-users-mod",
        "parent": "jsr-root",
        "layer": "module",
        "title": "Usuários Admin",
        "description": "Login e CRUD de tb_users.",
        "file": "inc/users.js",
        "code": "login(email, password) / getUsers() / save(fields)",
        "implementation": [
          "Render admin/login.ejs.",
          "Lista usuários no admin.",
          "Senha comparada diretamente."
        ]
      },
      {
        "id": "jsr-contacts-mod",
        "parent": "jsr-root",
        "layer": "module",
        "title": "Contatos",
        "description": "Mensagens do formulário público.",
        "file": "inc/contacts.js",
        "code": "save(fields) / getContacts() / delete(id)",
        "implementation": [
          "INSERT tb_contacts.",
          "ORDER BY register DESC.",
          "Admin visualiza e exclui."
        ]
      },
      {
        "id": "jsr-emails-mod",
        "parent": "jsr-root",
        "layer": "module",
        "title": "Lista de E-mails",
        "description": "Newsletter / captura de e-mails.",
        "file": "inc/emails.js",
        "code": "getEmails() / save(req) / delete(id)",
        "implementation": [
          "INSERT tb_emails (email).",
          "Validação Digite o e-mail.",
          "Admin gerencia lista."
        ]
      },
      {
        "id": "jsr-admin-inc",
        "parent": "jsr-admin-routes",
        "layer": "file",
        "title": "admin.js",
        "description": "Sidebar AdminLTE e helper getParams.",
        "file": "inc/admin.js",
        "code": "getMenus(req) → [{ text:'Menu', href:'/admin/menus', icon:'cutlery' }, ...]",
        "implementation": [
          "Marca active conforme req.url.",
          "getParams merge menus + data.",
          "dashboard() agrega COUNTs."
        ]
      },
      {
        "id": "jsr-frontend",
        "parent": "jsr-root",
        "layer": "module",
        "title": "Frontend EJS",
        "description": "Templates públicos com hero e Bootstrap.",
        "file": "views/",
        "code": "index.ejs / menus.ejs / reservations.ejs / contacts.ejs",
        "implementation": [
          "Imagens em public/images/.",
          "Partials header/footer.",
          "Tema Restaurante Saboroso."
        ]
      },
      {
        "id": "jsr-adminlte",
        "parent": "jsr-admin-routes",
        "layer": "file",
        "title": "AdminLTE",
        "description": "Painel admin com tema AdminLTE e Bower.",
        "file": "public/admin/",
        "code": "dist/css/AdminLTE.min.css / dist/js/app.min.js",
        "implementation": [
          "Sidebar com ícones Font Awesome.",
          "Skins skin-blue.",
          "Charts Flot opcionais."
        ]
      },
      {
        "id": "jsr-moment",
        "parent": "jsr-reservations-mod",
        "layer": "function",
        "title": "moment pt-BR",
        "description": "Formatação de datas nas views admin.",
        "file": "routes/admin.js",
        "code": "moment.locale('pt-BR');",
        "implementation": [
          "Exibe reservas formatadas.",
          "Locale brasileiro.",
          "Dependência moment ^2.29."
        ]
      },
      {
        "id": "jsr-mysql-tables",
        "parent": "jsr-db",
        "layer": "file",
        "title": "Schema MySQL",
        "description": "Tabelas do restaurante saboroso.",
        "file": "database/",
        "code": "tb_menus | tb_reservations | tb_contacts | tb_users | tb_emails",
        "implementation": [
          "menus: title, description, price, photo.",
          "reservations: people, date, time.",
          "Crie DB antes do npm start."
        ]
      },
      {
        "id": "jsr-redis",
        "parent": "jsr-session",
        "layer": "file",
        "title": "Redis",
        "description": "Store de sessão para admin.",
        "file": "connect-redis",
        "code": "new RedisStore({ host:'localhost', port:6379 })",
        "implementation": [
          "Instale Redis no Windows/Linux.",
          "Sessão persiste entre requests.",
          "Secret configurável em produção."
        ]
      },
      {
        "id": "jsr-package",
        "parent": "jsr-backend",
        "layer": "file",
        "title": "package.json",
        "description": "Dependências: express, mysql2, ejs, formidable, moment.",
        "file": "package.json",
        "code": "\"dependencies\": { \"express\": \"~4.16.1\", \"mysql2\": \"^2.2.5\", \"connect-redis\": \"^3.3.3\", \"formidable\": \"^1.2.2\" }",
        "implementation": [
          "npm start com nodemon.",
          "Nome interno saboroso.",
          "Private project."
        ]
      }
    ]
  },
  {
    "slug": "javascript-users",
    "name": "JavaScriptUsersProject",
    "repoUrl": "https://github.com/CanonEngineer/JavaScriptUsersProject",
    "color": "#22c55e",
    "icon": "javascript",
    "stack": "ES6 + localStorage",
    "summary": "CRUD de usuários com foto em Base64 no localStorage e AdminLTE.",
    "nodes": [
      {
        "id": "jus-root",
        "parent": null,
        "layer": "root",
        "title": "JavaScriptUsersProject",
        "description": "Sistema de cadastro 100% frontend com AdminLTE e localStorage.",
        "file": "index.html",
        "code": "// MVC: User (model), UserController, Utils\n// Persistência: localStorage key 'users'",
        "implementation": [
          "Abra index.html no browser.",
          "Não precisa de servidor backend.",
          "Dados ficam em localStorage users."
        ]
      },
      {
        "id": "jus-model",
        "parent": "jus-root",
        "layer": "module",
        "title": "User Model",
        "description": "Modelo com getters/setters e serialização JSON.",
        "file": "models/User.js",
        "code": "class User {\n  constructor(name, gender, birth, country, email, password, photo, admin) {\n    this._name = name;\n    this._email = email;\n    this._admin = admin;\n    this._register = new Date();\n  }\n}",
        "implementation": [
          "Propriedades com underscore (_name).",
          "getObject() retorna plain object.",
          "getUserStorage() lê array do localStorage."
        ]
      },
      {
        "id": "jus-load-json",
        "parent": "jus-model",
        "layer": "function",
        "title": "loadFromJSON()",
        "description": "Hidrata instância a partir de objeto salvo.",
        "file": "models/User.js",
        "code": "loadFromJSON(json) {\n  for (let name in json) {\n    switch(name) {\n      case '_register':\n        this[name] = new Date(json[name]);\n        break;\n      default:\n        this[name] = json[name];\n    }\n  }\n}",
        "implementation": [
          "Converte _register para Date.",
          "Usado no edit e selectAll.",
          "Mantém _id para updates."
        ]
      },
      {
        "id": "jus-save",
        "parent": "jus-model",
        "layer": "function",
        "title": "save()",
        "description": "Persiste usuário novo ou atualiza existente.",
        "file": "models/User.js",
        "code": "save() {\n  let users = User.getUserStorage();\n  if (this.id > 0) {\n    users.map(user => {\n      if (user._id == this.id) Object.assign(user, this);\n      return user;\n    });\n  } else {\n    this._id = this.getNewId();\n    users.push(this);\n  }\n  localStorage.setItem('users', JSON.stringify(users));\n}",
        "implementation": [
          "getNewId incrementa usersID.",
          "Object.assign no update.",
          "JSON.stringify no localStorage."
        ]
      },
      {
        "id": "jus-delete",
        "parent": "jus-model",
        "layer": "function",
        "title": "deleteUser()",
        "description": "Remove usuário do array no localStorage.",
        "file": "models/User.js",
        "code": "deleteUser() {\n  let users = User.getUserStorage();\n  users.forEach((userData, index) => {\n    if (this._id == userData._id) {\n      users.splice(index, 1);\n    }\n  });\n  localStorage.setItem('users', JSON.stringify(users));\n}",
        "implementation": [
          "splice pelo _id.",
          "Chamado no btn-delete.",
          "updateCount após remover."
        ]
      },
      {
        "id": "jus-get-storage",
        "parent": "jus-model",
        "layer": "function",
        "title": "getUserStorage()",
        "description": "Lê array de usuários do localStorage.",
        "file": "models/User.js",
        "code": "static getUserStorage() {\n  let users = [];\n  if (localStorage.getItem('users')) {\n    users = JSON.parse(localStorage.getItem('users'));\n  }\n  return users;\n}",
        "implementation": [
          "Retorna [] se vazio.",
          "Usado em save e selectAll.",
          "Chave fixa 'users'."
        ]
      },
      {
        "id": "jus-controller",
        "parent": "jus-root",
        "layer": "module",
        "title": "UserController",
        "description": "Orquestra formulários create/update, tabela e eventos.",
        "file": "controllers/UserController.js",
        "code": "class UserController {\n  constructor(formIdCreate, formIdUpdate, tableId) {\n    this.formEl = document.getElementById(formIdCreate);\n    this.tableEl = document.getElementById(tableId);\n    this.onSubmit();\n    this.onEdit();\n    this.selectAll();\n  }\n}",
        "implementation": [
          "Passe IDs dos forms e table.",
          "Chame no DOMContentLoaded.",
          "Métodos onSubmit, onEdit, selectAll."
        ]
      },
      {
        "id": "jus-on-submit",
        "parent": "jus-controller",
        "layer": "function",
        "title": "onSubmit()",
        "description": "Cria usuário com foto convertida para Base64.",
        "file": "controllers/UserController.js",
        "code": "this.formEl.addEventListener('submit', event => {\n  event.preventDefault();\n  let values = this.getValues(this.formEl);\n  this.getPhoto(this.formEl).then(content => {\n    values.photo = content;\n    values.save();\n    this.addLine(values);\n    this.formEl.reset();\n  });\n});",
        "implementation": [
          "getValues retorna User ou false.",
          "getPhoto com FileReader.",
          "addLine insere <tr> na tabela."
        ]
      },
      {
        "id": "jus-on-edit",
        "parent": "jus-controller",
        "layer": "function",
        "title": "onEdit()",
        "description": "Atualiza usuário existente com Object.assign.",
        "file": "controllers/UserController.js",
        "code": "let index = this.formUpdateEl.dataset.trIndex;\nlet tr = this.tableEl.rows[index];\nlet userOld = JSON.parse(tr.dataset.user);\nlet result = Object.assign({}, userOld, values);\nuser.loadFromJSON(result);\nuser.save();\nthis.getTr(user, tr);",
        "implementation": [
          "dataset.trIndex guarda índice.",
          "Preserva foto se não alterada.",
          "showPanelCreate após salvar."
        ]
      },
      {
        "id": "jus-get-values",
        "parent": "jus-controller",
        "layer": "function",
        "title": "getValues()",
        "description": "Lê form e valida campos obrigatórios.",
        "file": "controllers/UserController.js",
        "code": "if (['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value) {\n  field.parentElement.classList.add('has-error');\n  isValid = false;\n}\nreturn new User(user.name, user.gender, user.birth, user.country, user.email, user.password, user.photo, user.admin);",
        "implementation": [
          "has-error no Bootstrap.",
          "Trata radio gender e checkbox admin.",
          "Retorna false se inválido."
        ]
      },
      {
        "id": "jus-get-photo",
        "parent": "jus-controller",
        "layer": "function",
        "title": "getPhoto()",
        "description": "Converte File input em string Base64.",
        "file": "controllers/UserController.js",
        "code": "getPhoto(formEl) {\n  return new Promise((resolve, reject) => {\n    let fileReader = new FileReader();\n    let file = elements[0].files[0];\n    fileReader.onload = () => resolve(fileReader.result);\n    if (file) fileReader.readAsDataURL(file);\n    else resolve('dist/img/boxed-bg.jpg');\n  });\n}",
        "implementation": [
          "FileReader readAsDataURL.",
          "Fallback boxed-bg.jpg.",
          "Exiba em <img src> na tabela."
        ]
      },
      {
        "id": "jus-get-tr",
        "parent": "jus-controller",
        "layer": "function",
        "title": "getTr()",
        "description": "Monta linha da tabela com foto e botões.",
        "file": "controllers/UserController.js",
        "code": "tr.dataset.user = JSON.stringify(dataUser);\ntr.innerHTML = `\n  <td><img src=\"${dataUser.photo}\" class=\"img-circle img-sm\"></td>\n  <td>${dataUser.name}</td>\n  <td>${dataUser.email}</td>\n  <td>${(dataUser.admin) ? 'Sim' : 'Não'}</td>\n`;",
        "implementation": [
          "dataset.user para round-trip JSON.",
          "Botões Editar e Excluir.",
          "addEventsTr bind listeners."
        ]
      },
      {
        "id": "jus-add-events",
        "parent": "jus-controller",
        "layer": "function",
        "title": "addEventsTr()",
        "description": "Bind delete e edit em cada linha.",
        "file": "controllers/UserController.js",
        "code": "tr.querySelector('.btn-delete').addEventListener('click', e => {\n  if (confirm('Deseja realmente excluir este arquivo?')) {\n    user.deleteUser();\n    tr.remove();\n    this.updateCount();\n  }\n});",
        "implementation": [
          "confirm antes de excluir.",
          "Edit preenche form update.",
          "showPanelUpdate no edit."
        ]
      },
      {
        "id": "jus-select-all",
        "parent": "jus-controller",
        "layer": "function",
        "title": "selectAll()",
        "description": "Carrega usuários salvos ao iniciar.",
        "file": "controllers/UserController.js",
        "code": "selectAll() {\n  let users = User.getUserStorage();\n  users.forEach(dataUser => {\n    let user = new User();\n    user.loadFromJSON(dataUser);\n    this.addLine(user);\n  });\n}",
        "implementation": [
          "Chamado no constructor.",
          "Reconstrói tabela do storage.",
          "updateCount no final."
        ]
      },
      {
        "id": "jus-update-count",
        "parent": "jus-controller",
        "layer": "function",
        "title": "updateCount()",
        "description": "Atualiza badges de total e admins.",
        "file": "controllers/UserController.js",
        "code": "updateCount() {\n  [...this.tableEl.children].forEach(tr => {\n    numberUsers++;\n    let user = JSON.parse(tr.dataset.user);\n    if (user._admin) numberAdmin++;\n  });\n  document.querySelector('#number-users').innerHTML = numberUsers;\n}",
        "implementation": [
          "Conta rows da tabela.",
          "Separa admins.",
          "Atualiza após CRUD."
        ]
      },
      {
        "id": "jus-panels",
        "parent": "jus-controller",
        "layer": "function",
        "title": "showPanelCreate()",
        "description": "Alterna visibilidade dos painéis create/update.",
        "file": "controllers/UserController.js",
        "code": "showPanelCreate() {\n  document.querySelector('#box-user-create').style.display = 'block';\n  document.querySelector('#box-user-update').style.display = 'none';\n}",
        "implementation": [
          "showPanelUpdate inverte.",
          "btn-cancel volta ao create.",
          "AdminLTE box layout."
        ]
      },
      {
        "id": "jus-utils",
        "parent": "jus-root",
        "layer": "module",
        "title": "Utils",
        "description": "Helpers estáticos de formatação.",
        "file": "classes/Utils.js",
        "code": "class Utils {\n  static dateFormat(date) {\n    return date.getDate() + '/' + (date.getMonth()+1) + '/' + date.getFullYear();\n  }\n}",
        "implementation": [
          "Usado na coluna register.",
          "Pode estender com mais helpers.",
          "Import no index.html."
        ]
      },
      {
        "id": "jus-date-format",
        "parent": "jus-utils",
        "layer": "function",
        "title": "dateFormat()",
        "description": "Formata Date para dd/mm/yyyy hh:mm:ss.",
        "file": "classes/Utils.js",
        "code": "static dateFormat(date) {\n  return date.getDate() + '/' + (date.getMonth()+ 1) + '/' + date.getFullYear()\n    + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();\n}",
        "implementation": [
          "Coluna data de registro.",
          "_register é Date após loadFromJSON.",
          "Locale PT manual."
        ]
      },
      {
        "id": "jus-get-new-id",
        "parent": "jus-model",
        "layer": "function",
        "title": "getNewId()",
        "description": "Auto-incremento de ID no localStorage.",
        "file": "models/User.js",
        "code": "getNewId() {\n  let usersID = parseInt(localStorage.getItem('usersID'));\n  if (!usersID > 0) usersID = 0;\n  usersID++;\n  localStorage.setItem('usersID', usersID);\n  return usersID;\n}",
        "implementation": [
          "Chave separada usersID.",
          "Atribui this._id no save.",
          "Evita colisão de IDs."
        ]
      },
      {
        "id": "jus-getters",
        "parent": "jus-model",
        "layer": "file",
        "title": "Getters/Setters",
        "description": "Encapsulamento das propriedades do usuário.",
        "file": "models/User.js",
        "code": "get name() { return this._name; }\nget email() { return this._email; }\nget admin() { return this._admin; }\nset photo(value) { this._photo = value; }",
        "implementation": [
          "Padrão underscore + getter.",
          "photo tem setter dedicado.",
          "register readonly via getter."
        ]
      }
    ]
  },
  {
    "slug": "javascript-restful-api",
    "name": "JavaScriptRestfulApiProject",
    "repoUrl": "https://github.com/CanonEngineer/JavaScriptRestfulApiProject",
    "color": "#8b5cf6",
    "icon": "node",
    "stack": "Express + NeDB",
    "summary": "API REST de usuários com NeDB, consign e express-validator.",
    "nodes": [
      {
        "id": "jra-root",
        "parent": null,
        "layer": "root",
        "title": "JavaScriptRestfulApiProject",
        "description": "API REST com Express, consign e banco NeDB embarcado.",
        "file": "index.js",
        "code": "const express = require('express');\nconst consign = require('consign');\nlet app = express();\nconsign().include('routes').include('utils').into(app);\napp.listen(4000, '127.0.0.1');",
        "implementation": [
          "npm install express nedb consign.",
          "node index.js.",
          "Teste com Postman ou curl."
        ]
      },
      {
        "id": "jra-index",
        "parent": "jra-root",
        "layer": "file",
        "title": "index.js",
        "description": "Bootstrap Express com body-parser e consign.",
        "file": "index.js",
        "code": "app.use(bodyParser.urlencoded({ extended: false, limit:'50mb' }));\napp.use(bodyParser.json({limit:'50mb'}));\napp.use(expressValidator());\nconsign().include('routes').include('utils').into(app);",
        "implementation": [
          "Limite 50mb no body.",
          "express-validator global.",
          "Listen em 127.0.0.1:4000."
        ]
      },
      {
        "id": "jra-routes-index",
        "parent": "jra-root",
        "layer": "file",
        "title": "routes/index.js",
        "description": "Rota raiz HTML de boas-vindas.",
        "file": "routes/index.js",
        "code": "module.exports = (app) => {\n  app.get('/', (req, res) => {\n    res.statusCode = 200;\n    res.setHeader('Content-Type', 'text/html');\n    res.end('<h1>My Project RestApi</h1>');\n  });\n};",
        "implementation": [
          "Export function(app).",
          "consign injeta automaticamente.",
          "Health check simples."
        ]
      },
      {
        "id": "jra-users",
        "parent": "jra-root",
        "layer": "module",
        "title": "routes/users.js",
        "description": "CRUD completo GET/POST/PUT/DELETE em /users.",
        "file": "routes/users.js",
        "code": "let db = new NeDB({ filename: 'users.db', autoload: true });\nlet route = app.route('/users');\nroute.get((req, res) => {\n  db.find({}).sort({ name: 1 }).exec((err, users) => {\n    res.json({ users });\n  });\n});",
        "implementation": [
          "app.route() do Express 4.",
          "NeDB persiste em users.db.",
          "Sort por name no GET."
        ]
      },
      {
        "id": "jra-get-users",
        "parent": "jra-users",
        "layer": "function",
        "title": "GET /users",
        "description": "Lista todos os usuários ordenados por nome.",
        "file": "routes/users.js",
        "code": "route.get((req, res) => {\n  db.find({}).sort({ name: 1 }).exec((err, users) => {\n    if (err) app.utils.error.send(err, req, res);\n    else res.json({ users });\n  });\n});",
        "implementation": [
          "Retorna { users: [...] }.",
          "Trata erro com utils.error.",
          "Content-Type application/json."
        ]
      },
      {
        "id": "jra-post-user",
        "parent": "jra-users",
        "layer": "function",
        "title": "POST /users",
        "description": "Insere novo usuário após validação.",
        "file": "routes/users.js",
        "code": "route.post((req, res) => {\n  if (!app.utils.validator.user(app, req, res)) return false;\n  db.insert(req.body, (err, user) => {\n    if (err) app.utils.error.send(err, req, res);\n    else res.status(200).json(user);\n  });\n});",
        "implementation": [
          "validator.user antes de insert.",
          "Body com _name e _email.",
          "Retorna documento NeDB."
        ]
      },
      {
        "id": "jra-get-id",
        "parent": "jra-users",
        "layer": "function",
        "title": "GET /users/:id",
        "description": "Busca um usuário pelo _id do NeDB.",
        "file": "routes/users.js",
        "code": "routeId.get((req, res) => {\n  db.findOne({ _id: req.params.id }).exec((err, user) => {\n    if (err) app.utils.error.send(err, req, res);\n    else res.status(200).json(user);\n  });\n});",
        "implementation": [
          "Rota /users/:id com app.route().",
          "findOne com _id do NeDB.",
          "Retorne 404 se user null."
        ]
      },
      {
        "id": "jra-put-user",
        "parent": "jra-users",
        "layer": "function",
        "title": "PUT /users/:id",
        "description": "Atualiza usuário existente no NeDB.",
        "file": "routes/users.js",
        "code": "routeId.put((req, res) => {\n  if (!app.utils.validator.user(app, req, res)) return false;\n  db.update({ _id: req.params.id }, req.body, err => {\n    if (err) app.utils.error.send(err, req, res);\n    else res.status(200).json(Object.assign(req.params, req.body));\n  });\n});",
        "implementation": [
          "Valide body antes de update.",
          "db.update com _id do params.",
          "Merge params + body no response."
        ]
      },
      {
        "id": "jra-delete-user",
        "parent": "jra-users",
        "layer": "function",
        "title": "DELETE /users/:id",
        "description": "Remove usuário do banco NeDB.",
        "file": "routes/users.js",
        "code": "routeId.delete((req, res) => {\n  db.remove({ _id: req.params.id }, {}, err => {\n    if (err) app.utils.error.send(err, req, res);\n    else res.status(200).json(req.params);\n  });\n});",
        "implementation": [
          "DELETE em /users/:id.",
          "db.remove com _id.",
          "Retorna params do id removido."
        ]
      },
      {
        "id": "jra-admin",
        "parent": "jra-users",
        "layer": "function",
        "title": "GET /users/admin",
        "description": "Rota mock com lista fixa de admins.",
        "file": "routes/users.js",
        "code": "app.get('/users/admin', (req, res) => {\n  res.json({\n    users: [{\n      name: 'Zilda',\n      email: 'zilda@hotmail.com',\n      id: 2\n    }]\n  });\n});",
        "implementation": [
          "Exemplo de rota estática.",
          "Não usa NeDB.",
          "Útil para demo de filtros."
        ]
      },
      {
        "id": "jra-nedb",
        "parent": "jra-users",
        "layer": "file",
        "title": "NeDB",
        "description": "Banco embarcado com autoload em users.db.",
        "file": "routes/users.js",
        "code": "let NeDB = require('nedb');\nlet db = new NeDB({\n  filename: 'users.db',\n  autoload: true\n});",
        "implementation": [
          "Arquivo users.db na raiz.",
          "Sem servidor MongoDB.",
          "API compatível com MongoDB."
        ]
      },
      {
        "id": "jra-validator",
        "parent": "jra-root",
        "layer": "module",
        "title": "utils/validator.js",
        "description": "Valida nome obrigatório e e-mail válido no POST/PUT.",
        "file": "utils/validator.js",
        "code": "module.exports = {\n  user: (app, req, res) => {\n    req.assert('_name', 'O nome é obrigatório.').notEmpty();\n    req.assert('_email', 'O e-mail está inválido.').notEmpty().isEmail();\n    let errors = req.validationErrors();\n    if (errors) { app.utils.error.send(errors, req, res); return false; }\n    return true;\n  }\n};",
        "implementation": [
          "express-validator via req.assert.",
          "Chame antes de db.insert/update.",
          "Campos _name e _email."
        ]
      },
      {
        "id": "jra-error",
        "parent": "jra-root",
        "layer": "module",
        "title": "utils/error.js",
        "description": "Padroniza respostas de erro da API.",
        "file": "utils/error.js",
        "code": "module.exports = {\n  send: (err, req, res, code = 400) => {\n    console.log(`error: ${err}`);\n    res.status(code).json({ error: err });\n  }\n};",
        "implementation": [
          "Centralize erros em utils/error.js.",
          "Status 400 para validação.",
          "Log no console."
        ]
      },
      {
        "id": "jra-consign",
        "parent": "jra-index",
        "layer": "function",
        "title": "consign()",
        "description": "Carrega routes/ e utils/ automaticamente no app.",
        "file": "index.js",
        "code": "consign().include('routes').include('utils').into(app);",
        "implementation": [
          "Cada módulo exporta (app) => {}.",
          "utils fica em app.utils.",
          "Evita requires manuais."
        ]
      },
      {
        "id": "jra-body-parser",
        "parent": "jra-index",
        "layer": "file",
        "title": "body-parser",
        "description": "Parse JSON e urlencoded com limite 50mb.",
        "file": "index.js",
        "code": "app.use(bodyParser.urlencoded({ extended: false, limit:'50mb' }));\napp.use(bodyParser.json({limit:'50mb'}));",
        "implementation": [
          "extended false para urlencoded.",
          "Suporta payloads grandes.",
          "Antes das rotas."
        ]
      },
      {
        "id": "jra-express-validator",
        "parent": "jra-index",
        "layer": "file",
        "title": "express-validator",
        "description": "Middleware global de validação.",
        "file": "index.js",
        "code": "const expressValidator = require('express-validator');\napp.use(expressValidator());",
        "implementation": [
          "Habilita req.assert.",
          "validationErrors() no validator.",
          "Versão 5.x do pacote."
        ]
      },
      {
        "id": "jra-route-id",
        "parent": "jra-users",
        "layer": "file",
        "title": "routeId",
        "description": "Agrupa rotas REST por :id.",
        "file": "routes/users.js",
        "code": "let routeId = app.route('/users/:id');\nrouteId.get(...);\nrouteId.put(...);\nrouteId.delete(...);",
        "implementation": [
          "app.route encadeia verbos.",
          "params.id é _id NeDB.",
          "Padrão RESTful."
        ]
      },
      {
        "id": "jra-package",
        "parent": "jra-root",
        "layer": "file",
        "title": "package.json",
        "description": "Dependências e entry point index.js.",
        "file": "package.json",
        "code": "\"main\": \"index.js\",\n\"dependencies\": {\n  \"express\": \"^4.18.2\",\n  \"nedb\": \"^1.8.0\",\n  \"consign\": \"^0.1.6\",\n  \"express-validator\": \"^5.3.1\"\n}",
        "implementation": [
          "npm install na raiz.",
          "node index.js para subir.",
          "users.db criado automaticamente."
        ]
      },
      {
        "id": "jra-listen",
        "parent": "jra-index",
        "layer": "function",
        "title": "app.listen()",
        "description": "Inicia servidor na porta 4000.",
        "file": "index.js",
        "code": "app.listen(4000, '127.0.0.1', () => {\n  console.log('Server Running!');\n});",
        "implementation": [
          "Bind localhost apenas.",
          "Porta 4000 fixa.",
          "Log Server Running!."
        ]
      },
      {
        "id": "jra-error-handling",
        "parent": "jra-users",
        "layer": "function",
        "title": "Tratamento de erros",
        "description": "Padrão if(err) em todos os callbacks NeDB.",
        "file": "routes/users.js",
        "code": "if (err) {\n  app.utils.error.send(err, req, res);\n} else {\n  res.status(200).json(user);\n}",
        "implementation": [
          "Nunca ignore err do NeDB.",
          "error.send retorna JSON.",
          "Status 200 em sucesso."
        ]
      }
    ]
  },
  {
    "slug": "professional-scanner",
    "name": "Professional-Scanner",
    "repoUrl": "https://github.com/CanonEngineer/Professional-Scanner",
    "color": "#06b6d4",
    "icon": "scanner",
    "stack": "Node.js + WebSocket",
    "summary": "Scanner de rede profissional com mapa 3D e export XLSX.",
    "nodes": [
      {
        "id": "ps-root",
        "parent": null,
        "layer": "root",
        "title": "Professional-Scanner",
        "description": "Scanner de rede com WebSocket, ping, port scan e export Excel.",
        "file": "server.js",
        "code": "const express = require('express');\nconst WebSocket = require('ws');\nconst app = express();\nconst server = http.createServer(app);\nconst wss = new WebSocket.Server({ server });\nconst PORT = process.env.PORT || 3000;",
        "implementation": [
          "npm install express ws exceljs.",
          "node server.js.",
          "Acesse http://localhost:3000."
        ]
      },
      {
        "id": "ps-static",
        "parent": "ps-root",
        "layer": "file",
        "title": "Express static",
        "description": "Serve dashboard e mapa da pasta public/.",
        "file": "server.js",
        "code": "app.use(express.static(path.join(__dirname, 'public')));\napp.use(express.json({ limit: '5mb' }));",
        "implementation": [
          "index.html é o dashboard.",
          "map.html para topologia 3D.",
          "JSON limit 5mb para export."
        ]
      },
      {
        "id": "ps-ws",
        "parent": "ps-root",
        "layer": "module",
        "title": "WebSocket Server",
        "description": "Comunicação em tempo real entre servidor e dashboard.",
        "file": "server.js",
        "code": "wss.on('connection', (ws) => {\n  ws.on('message', async (message) => {\n    const data = JSON.parse(message);\n    if (data.type === 'start') {\n      const { target, portsTCP, portsUDP, timeout, concurrency } = data;\n    }\n  });\n});",
        "implementation": [
          "Broadcast logs e resultados via ws.send.",
          "Cliente reconecta em 3s se cair.",
          "JSON com type: log|progress|complete."
        ]
      },
      {
        "id": "ps-parse-target",
        "parent": "ps-root",
        "layer": "function",
        "title": "parseTarget()",
        "description": "Expande IP único, range ou CIDR em lista de IPs.",
        "file": "server.js",
        "code": "function parseTarget(target) {\n  if (target.includes('/')) {\n    // CIDR notation\n    const limit = Math.min(numHosts, 1024);\n    for (let i = 0; i < limit; i++) ips.push(longToIp(startIpNum + i));\n  } else if (target.includes('-')) {\n    // Dash range\n  }\n  return ips;\n}",
        "implementation": [
          "Suporta 192.168.1.0/24.",
          "Range 192.168.1.1-50.",
          "Limite segurança 1024 hosts."
        ]
      },
      {
        "id": "ps-ping",
        "parent": "ps-root",
        "layer": "function",
        "title": "pingHost()",
        "description": "Ping sweep Windows com extração de TTL.",
        "file": "server.js",
        "code": "function pingHost(ip, timeoutMs) {\n  return new Promise((resolve) => {\n    exec(`ping -n 1 -w ${timeoutMs} ${ip}`, (error, stdout) => {\n      const ttlMatch = stdout.match(/TTL=(\\d+)/i);\n      if (ttlMatch) resolve({ ip, active: true, ttl: parseInt(ttlMatch[1], 10) });\n      else resolve({ ip, active: false, ttl: null });\n    });\n  });\n}",
        "implementation": [
          "FASE 1 do scan.",
          "TTL alimenta getOSFromTTL.",
          "Suporta output PT e EN."
        ]
      },
      {
        "id": "ps-os-ttl",
        "parent": "ps-ping",
        "layer": "function",
        "title": "getOSFromTTL()",
        "description": "Heurística de SO a partir do TTL.",
        "file": "server.js",
        "code": "function getOSFromTTL(ttl) {\n  if (!ttl) return 'Desconhecido';\n  if (ttl <= 64) return 'Linux / macOS / Android';\n  if (ttl <= 128) return 'Windows';\n  if (ttl <= 255) return 'Dispositivo de Rede (Cisco/Router/Embedded)';\n}",
        "implementation": [
          "Chamado na FASE 2.",
          "TTL 128 típico Windows.",
          "TTL 64 típico Linux."
        ]
      },
      {
        "id": "ps-dns",
        "parent": "ps-root",
        "layer": "function",
        "title": "resolveHostname()",
        "description": "Reverse DNS lookup assíncrono.",
        "file": "server.js",
        "code": "async function resolveHostname(ip) {\n  try {\n    const hostnames = await dns.reverse(ip);\n    return hostnames[0] || 'N/A';\n  } catch (err) {\n    return 'N/A';\n  }\n}",
        "implementation": [
          "dns.promises.reverse.",
          "N/A se falhar.",
          "Exibido na tabela e XLSX."
        ]
      },
      {
        "id": "ps-mac",
        "parent": "ps-root",
        "layer": "function",
        "title": "getMacAddress()",
        "description": "Lê tabela ARP do Windows.",
        "file": "server.js",
        "code": "exec(`arp -a ${ip}`, (error, stdout) => {\n  const macMatch = line.match(/([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})/);\n  if (macMatch) resolve(macMatch[0].toUpperCase().replace(/:/g, '-'));\n});",
        "implementation": [
          "arp -a por IP.",
          "Normaliza para XX-XX-XX.",
          "Alimenta getVendorFromMac."
        ]
      },
      {
        "id": "ps-vendor",
        "parent": "ps-mac",
        "layer": "function",
        "title": "getVendorFromMac()",
        "description": "Lookup OUI em dicionário MAC_VENDORS.",
        "file": "server.js",
        "code": "function getVendorFromMac(mac) {\n  const prefix = mac.replace(/[:-]/g, '').slice(0, 6).toUpperCase();\n  return MAC_VENDORS[prefix] || 'Desconhecido (Fabricante Genérico)';\n}",
        "implementation": [
          "MAC_VENDORS com Cisco, VMware, etc.",
          "Primeiros 3 octetos OUI.",
          "Usado em detectVM."
        ]
      },
      {
        "id": "ps-tcp-scan",
        "parent": "ps-root",
        "layer": "function",
        "title": "scanTcpPort()",
        "description": "TCP connect scan com banner grabbing.",
        "file": "server.js",
        "code": "function scanTcpPort(ip, port, timeoutMs) {\n  const socket = new net.Socket();\n  socket.on('connect', () => {\n    if (TCP_SERVICES[port]?.probe) socket.write(TCP_SERVICES[port].probe);\n  });\n  socket.connect(port, ip);\n}",
        "implementation": [
          "FASE 3 port scanning.",
          "HTTP probe em 80/443.",
          "Retorna service e version."
        ]
      },
      {
        "id": "ps-concurrent",
        "parent": "ps-root",
        "layer": "function",
        "title": "runConcurrent()",
        "description": "Worker pool com limite de concorrência.",
        "file": "server.js",
        "code": "async function runConcurrent(tasks, limit, onTaskComplete) {\n  const executing = new Set();\n  for (const taskFn of tasks) {\n    const p = Promise.resolve().then(() => taskFn());\n    executing.add(p);\n    if (executing.size >= limit) await Promise.race(executing);\n  }\n  return Promise.all(results);\n}",
        "implementation": [
          "concurrency configurável no UI.",
          "Usado em ping e port scan.",
          "onTaskComplete para progress."
        ]
      },
      {
        "id": "ps-detect-vm",
        "parent": "ps-root",
        "layer": "function",
        "title": "detectVM()",
        "description": "Detecta VM por prefixo MAC ou vendor.",
        "file": "server.js",
        "code": "function detectVM(mac, vendor) {\n  const vmMacPrefixes = ['00-05-69', '00-0C-29', '00-50-56'];\n  const isVmMac = vmMacPrefixes.some(prefix => mac.startsWith(prefix));\n  return (isVmMac || isVmVendor) ? 'Sim' : 'Não';\n}",
        "implementation": [
          "VMware, VirtualBox prefixes.",
          "Coluna VM no XLSX.",
          "Influencia detectDeviceType."
        ]
      },
      {
        "id": "ps-detect-dmz",
        "parent": "ps-root",
        "layer": "function",
        "title": "detectDMZ()",
        "description": "Heurística DMZ por IP público ou serviços web.",
        "file": "server.js",
        "code": "function detectDMZ(host) {\n  const hasWeb = ports.some(p => p.port === 80 || p.port === 443);\n  if (isPublicIp(host.ip)) return true;\n  if (hasWeb && hostname.includes('dmz')) return true;\n  return false;\n}",
        "implementation": [
          "isPrivateIp / isPublicIp helpers.",
          "Cor laranja no mapa 3D.",
          "Coluna DMZ no export."
        ]
      },
      {
        "id": "ps-device-type",
        "parent": "ps-root",
        "layer": "function",
        "title": "detectDeviceType()",
        "description": "Classifica host: PC, servidor, roteador, IoT.",
        "file": "server.js",
        "code": "function detectDeviceType(host) {\n  if (isPrinter || portSet.has(9100)) return 'Impressora';\n  if (isRouter) return 'Roteador';\n  if (host.vm === 'Sim') return 'Máquina virtual';\n  if (portSet.has(3389) || portSet.has(22)) return 'Servidor';\n  return 'Host Ativo';\n}",
        "implementation": [
          "Heurísticas hostname + ports.",
          "OT/ICS via detectOTICS.",
          "Coluna Tipo no XLSX."
        ]
      },
      {
        "id": "ps-export-xlsx",
        "parent": "ps-root",
        "layer": "function",
        "title": "POST /export-xlsx",
        "description": "Exporta resultados para Excel com formatação.",
        "file": "server.js",
        "code": "app.post('/export-xlsx', async (req, res) => {\n  const workbook = new ExcelJS.Workbook();\n  const worksheet = workbook.addWorksheet('Scan');\n  worksheet.columns = [\n    { header: 'IP', key: 'ip', width: 18 },\n    { header: 'Hostname', key: 'hostname', width: 24 },\n  ];\n  await workbook.xlsx.writeBuffer();\n});",
        "implementation": [
          "14 colunas profissionais.",
          "Header bold com fill cinza.",
          "Salva em Documents/python files/csv."
        ]
      },
      {
        "id": "ps-api-results",
        "parent": "ps-root",
        "layer": "function",
        "title": "GET /api/scan-results",
        "description": "Snapshot dos últimos resultados em memória.",
        "file": "server.js",
        "code": "let lastScanSnapshot = [];\napp.get('/api/scan-results', (req, res) => {\n  res.json({ updated: Date.now(), results: lastScanSnapshot });\n});",
        "implementation": [
          "Atualizado ao fim do scan.",
          "map.js consome este endpoint.",
          "Sem banco de dados."
        ]
      },
      {
        "id": "ps-client",
        "parent": "ps-root",
        "layer": "module",
        "title": "public/app.js",
        "description": "Dashboard com WebSocket, tabela e progresso.",
        "file": "public/app.js",
        "code": "function connectWebSocket() {\n  socket = new WebSocket(wsUrl);\n  socket.onopen = () => {\n    connectionBadge.textContent = 'Conectado';\n  };\n  socket.onmessage = (event) => {\n    handleServerMessage(JSON.parse(event.data));\n  };\n}",
        "implementation": [
          "connectWebSocket no load.",
          "handleServerMessage switch por type.",
          "Reconexão automática 3s."
        ]
      },
      {
        "id": "ps-handle-msg",
        "parent": "ps-client",
        "layer": "function",
        "title": "handleServerMessage()",
        "description": "Processa eventos log, progress, host_found.",
        "file": "public/app.js",
        "code": "function handleServerMessage(data) {\n  switch (data.type) {\n    case 'log': logToConsole(data.message, logClass); break;\n    case 'host_found': addOrUpdateHost(data.host); break;\n    case 'complete': stopScanUI(data.summary); break;\n  }\n}",
        "implementation": [
          "Atualiza tabela em tempo real.",
          "Barra de progresso.",
          "Stats total/ativo/inativo."
        ]
      },
      {
        "id": "ps-map",
        "parent": "ps-root",
        "layer": "module",
        "title": "public/map.js",
        "description": "Visualização topológica 3D com force-graph.",
        "file": "public/map.js",
        "code": "async function refreshTopology() {\n  const response = await fetch('/api/scan-results');\n  const json = await response.json();\n  latestResults = json.results || [];\n  render3DMap(latestResults);\n}",
        "implementation": [
          "GET /api/scan-results.",
          "Agrupe hosts por subnet.",
          "Export PNG/SVG do canvas."
        ]
      },
      {
        "id": "ps-render-3d",
        "parent": "ps-map",
        "layer": "function",
        "title": "render3DMap()",
        "description": "Grafo 3D: nós host ligados a subnets.",
        "file": "public/map.js",
        "code": "Graph = ForceGraph3D()(mapContainer)\n  .graphData({ nodes, links })\n  .nodeAutoColorBy('group')\n  .nodeLabel(node => `IP: ${node.id}\\n${node.name || ''}`)\n  .onNodeClick(node => { /* highlight row */ });",
        "implementation": [
          "Cor DMZ laranja, OT vermelho.",
          "Links host → subnet.",
          "Click sincroniza com dashboard."
        ]
      }
    ]
  },
  {
    "slug": "customize-veyon",
    "name": "CustomizeVeyonProject",
    "repoUrl": "https://github.com/CanonEngineer/CustomizeVeyonProject",
    "color": "#ef4444",
    "icon": "cpp",
    "stack": "Qt/C++ Veyon 4.10.4",
    "summary": "Veyon CIMED/HCFMB — UI HiDPI, logs SHA-256 em UNC, anti-tampering e deploy portátil.",
    "nodes": [
      {
        "id": "cv-root",
        "parent": null,
        "layer": "root",
        "title": "CustomizeVeyonProject",
        "description": "Veyon 4.10.4 customizado CiMED/HCFMB — UI HiDPI, logs SHA-256 em UNC, anti-tampering e deploy portátil.",
        "file": "veyon-4.10.4-src (1)/veyon-4.10.4/",
        "code": "// Fork Veyon 4.10.4 + Veyon_Custom/\n// Logs: \\\\172.20.100.36\\vnc_veyon$\\veyon\\\n// Marca: Veyon CIMED",
        "implementation": [
          "Clone CustomizeVeyonProject com submódulo veyon-4.10.4-src.",
          "Build CMake/MSVC no Windows.",
          "Distribua via pasta Veyon_Custom/."
        ]
      },
      {
        "id": "cv-ui",
        "parent": "cv-root",
        "layer": "module",
        "title": "Interface CIMED HiDPI",
        "description": "Diálogos escuros com chrome CIMED, ícones vetoriais e suporte a 125%/150% DPI.",
        "file": "core/src/CimedDialogStyle.cpp",
        "code": "namespace CimedDialogStyle { QWidget* buildDialogShell(...); QString dialogStyleSheet(); }",
        "implementation": [
          "Todos os diálogos custom passam por CimedDialogStyle.",
          "Ícones desenhados com QPainter — sem assets PNG.",
          "devicePixelRatio do monitor primário define nitidez."
        ]
      },
      {
        "id": "cv-cimed-style",
        "parent": "cv-ui",
        "layer": "file",
        "title": "CimedDialogStyle.cpp",
        "description": "Chrome compartilhado: shell, stylesheet, ícones e botões CIMED.",
        "file": "core/src/CimedDialogStyle.cpp",
        "code": "const QColor IconCyan( 34, 211, 238 );\nQLabel* createIconLabel( const QPixmap& pixmap, int logicalSize, QWidget* parent );",
        "implementation": [
          "Centraliza paleta cyan/slate dos diálogos.",
          "applyButtonIcon padroniza QPushButton 16×16.",
          "drawUserGlyph / drawLockGlyph para ícones inline."
        ]
      },
      {
        "id": "cv-icon-dpr",
        "parent": "cv-cimed-style",
        "layer": "function",
        "title": "iconDevicePixelRatio()",
        "description": "Lê devicePixelRatio da tela primária para ícones nítidos em HiDPI.",
        "file": "core/src/CimedDialogStyle.cpp",
        "code": "qreal iconDevicePixelRatio() {\n  if (auto* screen = QGuiApplication::primaryScreen())\n    return std::max(1.0, screen->devicePixelRatio());\n  return 1.0;\n}",
        "implementation": [
          "Evita ícones borrados em monitores 125%/150%.",
          "Fallback 1.0 se não houver tela.",
          "Usado ao rasterizar pixmaps dos diálogos."
        ]
      },
      {
        "id": "cv-dialog-shell",
        "parent": "cv-cimed-style",
        "layer": "function",
        "title": "buildDialogShell()",
        "description": "Monta QDialog com header CIMED, área de conteúdo e rodapé de ações.",
        "file": "core/src/CimedDialogStyle.cpp",
        "code": "QWidget* buildDialogShell( QDialog* dialog, const QString& title,\n  const QPixmap& titleIcon, QWidget* content, QWidget* actions );",
        "implementation": [
          "Frameless + stylesheet escuro.",
          "Título com ícone à esquerda.",
          "Botões OK/Cancelar no rodapé."
        ]
      },
      {
        "id": "cv-password-dialog",
        "parent": "cv-ui",
        "layer": "file",
        "title": "PasswordDialog.cpp",
        "description": "Senha VNC com visual CIMED e validação integrada ao fluxo remoto.",
        "file": "core/src/PasswordDialog.cpp",
        "code": "PasswordDialog::PasswordDialog( QWidget* parent )\n  : QDialog( parent ) { /* CimedDialogStyle shell */ }",
        "implementation": [
          "Substitui QMessageBox nativo.",
          "Usa buildDialogShell + dialogStyleSheet.",
          "Retorna senha digitada ao plugin RemoteAccess."
        ]
      },
      {
        "id": "cv-host-input",
        "parent": "cv-ui",
        "layer": "file",
        "title": "CimedHostInputDialog.cpp",
        "description": "Entrada de host/IP para conexão remota com UI CIMED.",
        "file": "core/src/CimedHostInputDialog.cpp",
        "code": "CimedHostInputDialog::CimedHostInputDialog( QWidget* parent )\n  : QDialog( parent ) { /* host + botões */ }",
        "implementation": [
          "QLineEdit para hostname ou IP.",
          "Validação antes de iniciar sessão.",
          "Chamado por RemoteAccessFeaturePlugin."
        ]
      },
      {
        "id": "cv-desktop-access",
        "parent": "cv-ui",
        "layer": "file",
        "title": "DesktopAccessConfirmDialog.cpp",
        "description": "Confirmação de acesso à área de trabalho do aluno com branding CIMED.",
        "file": "core/src/DesktopAccessConfirmDialog.cpp",
        "code": "DesktopAccessConfirmDialog::execForAccess( QWidget* parent, const QString& teacherName );",
        "implementation": [
          "Exibido no cliente quando professor solicita controle.",
          "Texto em PT-BR com dados do solicitante.",
          "Aceitar/recusar com ícones CIMED."
        ]
      },
      {
        "id": "cv-brand",
        "parent": "cv-root",
        "layer": "module",
        "title": "Marca e suporte CIMED",
        "description": "Rótulo Veyon CIMED, hostname, usuário AD e textos da bandeja.",
        "file": "core/src/ComputerSupportInfo.cpp",
        "code": "class ComputerSupportInfo { static QString productLabel(); static QString idleTrayHoverHtml(); };",
        "implementation": [
          "Centraliza strings de produto e suporte.",
          "Consulta AD via PlatformUserFunctions.",
          "HTML formatado para tooltip da bandeja."
        ]
      },
      {
        "id": "cv-support-info",
        "parent": "cv-brand",
        "layer": "file",
        "title": "ComputerSupportInfo.cpp",
        "description": "Metadados da estação: hostname, IP, login AD e nome completo.",
        "file": "core/src/ComputerSupportInfo.cpp",
        "code": "QString ComputerSupportInfo::hostname() {\n  return QHostInfo::localHostName();\n}",
        "implementation": [
          "hostname() e localIpv4() para logs.",
          "adUserName() via queryCurrentUserProperty.",
          "productLabel() retorna \"Veyon CIMED\"."
        ]
      },
      {
        "id": "cv-product-label",
        "parent": "cv-support-info",
        "layer": "function",
        "title": "productLabel()",
        "description": "Nome do produto exibido em diálogos, bandeja e relatórios.",
        "file": "core/src/ComputerSupportInfo.cpp",
        "code": "QString ComputerSupportInfo::productLabel() {\n  return QStringLiteral( \"Veyon CIMED\" );\n}",
        "implementation": [
          "Substitui branding genérico Veyon.",
          "Usado em idleTrayHoverText/Html.",
          "Aparece no ComputerSupportInfoDialog."
        ]
      },
      {
        "id": "cv-idle-hover",
        "parent": "cv-support-info",
        "layer": "function",
        "title": "idleTrayHoverHtml()",
        "description": "Tooltip HTML da bandeja em repouso com dados da máquina e suporte.",
        "file": "core/src/ComputerSupportInfo.cpp",
        "code": "QString ComputerSupportInfo::idleTrayHoverHtml() {\n  return QStringLiteral( \"<b>%1</b><br/>%2 (%3)<br/>%4\" )\n    .arg( productLabel().toHtmlEscaped(), hostname(), localIpv4(), adUserName() );\n}",
        "implementation": [
          "Rich text para QLabel na bandeja.",
          "Par idleTrayHoverText() para versão plain.",
          "Atualizado ao passar mouse no ícone."
        ]
      },
      {
        "id": "cv-support-dialog",
        "parent": "cv-brand",
        "layer": "file",
        "title": "ComputerSupportInfoDialog.cpp",
        "description": "Diálogo F9 com informações de suporte técnico e contatos CiMED.",
        "file": "core/src/ComputerSupportInfoDialog.cpp",
        "code": "ComputerSupportInfoDialog::ComputerSupportInfoDialog( QWidget* parent );",
        "implementation": [
          "Atalho F9 no worker da bandeja.",
          "Lista hostname, IP, usuário AD.",
          "Chrome CIMED via CimedDialogStyle."
        ]
      },
      {
        "id": "cv-logs",
        "parent": "cv-root",
        "layer": "module",
        "title": "Logs de acesso com integridade",
        "description": "Escrita em UNC, linhas com SHA-256, validação diária e lookup AD.",
        "file": "core/src/AccessLogWriter.cpp",
        "code": "class AccessLogWriter {\n  static QString networkAccessLogPath();\n  static QString lineWithHash( const QString& message );\n};",
        "implementation": [
          "Logs só na rede — não em disco local.",
          "Cada linha termina com marcador + hash.",
          "Validação às 15h e no startup."
        ]
      },
      {
        "id": "cv-access-writer",
        "parent": "cv-logs",
        "layer": "file",
        "title": "AccessLogWriter.cpp",
        "description": "Writer principal: leitura/escrita UNC, hashes, alertas e agendador.",
        "file": "core/src/AccessLogWriter.cpp",
        "code": "bool AccessLogWriter::writeLogFileContent( const QString& filePath, const QString& content ) {\n  ensureParentDirectoryExists( filePath );\n  /* QFile WriteOnly + TamperLogProtector batch */\n}",
        "implementation": [
          "tryReadLogFileContent com decode UTF-8/ANSI.",
          "recordTamperAlert evita duplicatas.",
          "scheduleDailyAccessLogValidation às 15:00."
        ]
      },
      {
        "id": "cv-network-path",
        "parent": "cv-access-writer",
        "layer": "function",
        "title": "networkAccessLogPath()",
        "description": "Caminho UNC do log principal acessos_veyon.log.",
        "file": "core/src/AccessLogWriter.cpp",
        "code": "QString AccessLogWriter::networkAccessLogPath() {\n  return QDir( AccessLogPermissions::networkAccessLogDirectoryPath() )\n    .filePath( QStringLiteral( \"acessos_veyon.log\" ) );\n}",
        "implementation": [
          "Combina diretório UNC + nome do arquivo.",
          "Espelho usado por TamperLogProtector.",
          "Nunca grava em %ProgramFiles%."
        ]
      },
      {
        "id": "cv-line-hash",
        "parent": "cv-access-writer",
        "layer": "function",
        "title": "lineWithHash()",
        "description": "Anexa marcador e SHA-256 hex à mensagem de log.",
        "file": "core/src/AccessLogWriter.cpp",
        "code": "QString AccessLogWriter::lineWithHash( const QString& message ) {\n  return message + HashMarker() + sha256Hex( message );\n}",
        "implementation": [
          "sha256Hex usa QCryptographicHash::Sha256.",
          "Validação compara hash recalculado.",
          "Tampering quebra a verificação."
        ]
      },
      {
        "id": "cv-access-permissions",
        "parent": "cv-logs",
        "layer": "file",
        "title": "AccessLogPermissions.cpp",
        "description": "Define paths UNC fixos do compartilhamento vnc_veyon$.",
        "file": "core/src/AccessLogPermissions.cpp",
        "code": "QString AccessLogPermissions::networkLogDirectoryPath() {\n  return QStringLiteral( \"\\\\\\\\172.20.100.36\\\\vnc_veyon$\\\\veyon\" );\n}",
        "implementation": [
          "UNC hardcoded para ambiente CiMED.",
          "Subpastas acessos_veyon e acessos_veyon_ad.",
          "Isolamento por share SMB."
        ]
      },
      {
        "id": "cv-network-unc",
        "parent": "cv-access-permissions",
        "layer": "function",
        "title": "networkLogDirectoryPath()",
        "description": "Raiz UNC \\\\172.20.100.36\\vnc_veyon$\\veyon para todos os logs.",
        "file": "core/src/AccessLogPermissions.cpp",
        "code": "return QStringLiteral( \"\\\\172.20.100.36\\vnc_veyon$\\veyon\" );",
        "implementation": [
          "Servidor de arquivos da rede hospitalar.",
          "Acesso via conta de serviço / GPO.",
          "Documentado no README e relatório técnico."
        ]
      },
      {
        "id": "cv-access-recorder",
        "parent": "cv-logs",
        "layer": "file",
        "title": "AccessLogRecorder.cpp",
        "description": "Registra eventos de sessão remota em português com contexto AD.",
        "file": "core/src/AccessLogRecorder.cpp",
        "code": "void AccessLogRecorder::logOutboundAccessSuccess(\n  const QString& destinationHost, const QString& destinationIp );",
        "implementation": [
          "Mensagens dd/MM/yyyy às HH:mm:ss.",
          "Origem = hostname/IP local.",
          "Usuário via ComputerSupportInfo::adUserName()."
        ]
      },
      {
        "id": "cv-outbound-log",
        "parent": "cv-access-recorder",
        "layer": "function",
        "title": "logOutboundAccessSuccess()",
        "description": "Grava acesso remoto iniciado desta estação para outro host.",
        "file": "core/src/AccessLogRecorder.cpp",
        "code": "const auto mensagem = QStringLiteral(\n  \"Em %1 foi identificado acesso remoto via Veyon originado do equipamento %2 (%3)...\" );\nAccessLogWriter::appendNetworkAccessLogLine( lineWithHash( mensagem ) );",
        "implementation": [
          "shouldRecordAccess filtra loopback/localhost.",
          "Texto jurídico em PT-BR.",
          "Append atômico via AccessLogWriter."
        ]
      },
      {
        "id": "cv-inbound-disabled",
        "parent": "cv-access-recorder",
        "layer": "function",
        "title": "logInboundAccessSuccess()",
        "description": "Inbound desabilitado — veyon-server (SYSTEM) não grava UNC em todos os hosts.",
        "file": "core/src/AccessLogRecorder.cpp",
        "code": "void AccessLogRecorder::logInboundAccessSuccess(...) {\n  Q_UNUSED( originHost ); /* CIMED: inbound logging disabled */\n}",
        "implementation": [
          "Evita falhas silenciosas em serviço SYSTEM.",
          "Outbound cobre professor→aluno.",
          "Documentado como decisão de arquitetura."
        ]
      },
      {
        "id": "cv-ad-lookup",
        "parent": "cv-logs",
        "layer": "file",
        "title": "AccessLogAdLookup_win.cpp",
        "description": "Lookup LDAP do displayName do usuário de domínio para logs.",
        "file": "core/src/AccessLogAdLookup_win.cpp",
        "code": "QString accessLogLookupDomainUserDisplayName( const QString& loginName ) {\n  /* DsGetDcName + ldap_search_s displayName */\n}",
        "implementation": [
          "ldapEscapeFilterValue sanitiza filtro.",
          "Fallback se AD indisponível.",
          "Chamado em currentAdUserFullName()."
        ]
      },
      {
        "id": "cv-tamper",
        "parent": "cv-root",
        "layer": "module",
        "title": "Proteção anti-tampering",
        "description": "Monitora alterações nos logs de rede, alerta e exige senha admin.",
        "file": "core/src/TamperLogProtector.cpp",
        "code": "class TamperLogProtector : public QObject {\n  void checkProtectedFile( const QString& path, ... );\n};",
        "implementation": [
          "Poll timer compara backup em memória.",
          "reportUnauthorizedChange grava alerta.",
          "Senha SHA-256 em AdminPasswordHash."
        ]
      },
      {
        "id": "cv-tamper-protector",
        "parent": "cv-tamper",
        "layer": "file",
        "title": "TamperLogProtector.cpp",
        "description": "Watcher de integridade com batch protegido durante escritas legítimas.",
        "file": "core/src/TamperLogProtector.cpp",
        "code": "TamperLogProtector::TamperLogProtector( FeatureWorkerManager& m, QObject* parent ) {\n  refreshBackups();\n  auto* pollTimer = new QTimer( this );\n  connect( pollTimer, &QTimer::timeout, this, [this]() { checkNetworkAccessFile(); } );\n}",
        "implementation": [
          "isAccessLogPath valida paths UNC.",
          "setWatcherSuppressed durante writes.",
          "writeTamperResponse em acessos_tamper_response.txt."
        ]
      },
      {
        "id": "cv-tamper-backup",
        "parent": "cv-tamper-protector",
        "layer": "function",
        "title": "refreshBackups()",
        "description": "Carrega snapshot dos logs de rede para comparação posterior.",
        "file": "core/src/TamperLogProtector.cpp",
        "code": "void TamperLogProtector::refreshBackups() {\n  if ( AccessLogWriter::tryReadLogFileContent( networkAccessLogPath(), content ) )\n    m_networkAccessBackup = content;\n}",
        "implementation": [
          "Executado no construtor e após writes.",
          "Dois arquivos: acessos_veyon e _ad.",
          "Base para detectar edição manual."
        ]
      },
      {
        "id": "cv-tamper-check",
        "parent": "cv-tamper-protector",
        "layer": "function",
        "title": "checkProtectedFile()",
        "description": "Compara conteúdo atual com backup; dispara alerta se divergir.",
        "file": "core/src/TamperLogProtector.cpp",
        "code": "void TamperLogProtector::checkProtectedFile( const QString& filePath,\n  const QString& backup, const QString& label ) {\n  /* read + compare + reportUnauthorizedChange */\n}",
        "implementation": [
          "Ignora durante beginProtectedBatch.",
          "Notifica SystemTrayIcon.",
          "recordTamperAlert no AccessLogWriter."
        ]
      },
      {
        "id": "cv-tamper-password",
        "parent": "cv-tamper",
        "layer": "file",
        "title": "TamperLogPasswordDialog.cpp",
        "description": "Diálogo de senha para autorizar manutenção nos logs tamperados.",
        "file": "core/src/TamperLogPasswordDialog.cpp",
        "code": "bool TamperLogPasswordDialog::attemptAuthentication( const QString& password );",
        "implementation": [
          "Compara SHA-256 com AdminPasswordHash.",
          "UI CIMED com CimedDialogStyle.",
          "IPC via SystemTrayIcon server."
        ]
      },
      {
        "id": "cv-tamper-auth",
        "parent": "cv-tamper-password",
        "layer": "function",
        "title": "attemptAuthentication()",
        "description": "Valida senha admin contra hash SHA-256 embutido.",
        "file": "core/src/TamperLogProtector.cpp",
        "code": "constexpr auto AdminPasswordHash = \"8ab2cdcbd95fabaab0ef54a74c84a08b3e8c95c511f50c4992e9a8cac3c63863\";\nreturn passwordSha256Hex( password ) == QLatin1String( AdminPasswordHash );",
        "implementation": [
          "Hash fixo — não plaintext em disco.",
          "Libera batch protegido se OK.",
          "Falha mantém watcher ativo."
        ]
      },
      {
        "id": "cv-tray",
        "parent": "cv-root",
        "layer": "module",
        "title": "Bandeja do sistema HiDPI",
        "description": "Ícones multi-DPI, hover CIMED, F9 suporte e servidor de senha tamper.",
        "file": "core/src/SystemTrayIcon.cpp",
        "code": "class SystemTrayIcon : public QWidget {\n  void ensureSessionWorker( FeatureWorkerManager& );\n};",
        "implementation": [
          "Worker dedicado por sessão Windows.",
          "Estados: Monitoring, Connected, Active.",
          "devicePixelRatios 1.0–2.0."
        ]
      },
      {
        "id": "cv-tray-icon",
        "parent": "cv-tray",
        "layer": "file",
        "title": "SystemTrayIcon.cpp",
        "description": "Implementação da bandeja com renderização vetorial e overlay.",
        "file": "core/src/SystemTrayIcon.cpp",
        "code": "QIcon buildStatusIcon( SystemTrayIcon::StatusIndicator status, const QImage& overlayIcon );",
        "implementation": [
          "QLocalServer para TamperLogPassword.",
          "Hover panel com idleTrayHoverHtml.",
          "ensureSessionWorker no server start."
        ]
      },
      {
        "id": "cv-tray-render",
        "parent": "cv-tray-icon",
        "layer": "function",
        "title": "renderTrayStatusPixmap()",
        "description": "Desenha pixmap do estado da bandeja com gradiente e glyph central.",
        "file": "core/src/SystemTrayIcon.cpp",
        "code": "QPixmap renderTrayStatusPixmap( StatusIndicator status, int logicalSize, qreal devicePixelRatio ) {\n  QPixmap pixmap( logicalSize * dpr, logicalSize * dpr );\n  pixmap.setDevicePixelRatio( dpr );\n  /* QPainter radial gradient + icon */\n}",
        "implementation": [
          "Cores por status (verde=c monitoring).",
          "Antialiasing em QPainter.",
          "Tamanhos 16–128 lógicos."
        ]
      },
      {
        "id": "cv-tray-hidpi",
        "parent": "cv-tray-icon",
        "layer": "function",
        "title": "buildStatusIcon()",
        "description": "Gera QIcon com múltiplos devicePixelRatio para Windows 125%/150%.",
        "file": "core/src/SystemTrayIcon.cpp",
        "code": "QList<qreal> devicePixelRatios = {1.0, 1.25, 1.5, 1.75, 2.0};\nfor ( const auto dpr : devicePixelRatios )\n  for ( const auto size : {16, 20, 22, 24, 32, 48, 64, 128} )\n    icon.addPixmap( renderTrayStatusPixmap( status, size, dpr ) );",
        "implementation": [
          "Adiciona DPR da tela se ausente na lista.",
          "Overlay do professor só no DPR atual.",
          "Corrige ícone borrado na bandeja Win11."
        ]
      },
      {
        "id": "cv-server",
        "parent": "cv-root",
        "layer": "module",
        "title": "veyon-server",
        "description": "Inicialização do serviço com proteção de logs e worker da bandeja.",
        "file": "server/src/ComputerControlServer.cpp",
        "code": "class ComputerControlServer { bool start(); };",
        "implementation": [
          "Roda como serviço Windows.",
          "Integra VNC proxy + FeatureWorkerManager.",
          "Tooltip idle via ComputerSupportInfo."
        ]
      },
      {
        "id": "cv-control-server",
        "parent": "cv-server",
        "layer": "file",
        "title": "ComputerControlServer.cpp",
        "description": "Servidor de controle com hooks CIMED no startup.",
        "file": "server/src/ComputerControlServer.cpp",
        "code": "bool ComputerControlServer::start() {\n  AccessLogWriter::startTamperedLogProtection( m_featureWorkerManager, this );\n  AccessLogWriter::validateAccessLogsOnStartup();\n  VeyonCore::builtinFeatures().systemTrayIcon().ensureSessionWorker( m_featureWorkerManager );\n}",
        "implementation": [
          "startTamperedLogProtection instancia TamperLogProtector.",
          "validateAccessLogsOnStartup na subida.",
          "scheduleDailyAccessLogValidation às 15h."
        ]
      },
      {
        "id": "cv-server-tooltip",
        "parent": "cv-control-server",
        "layer": "function",
        "title": "updateTrayToolTip()",
        "description": "Tooltip da bandeja usa idleTrayHoverText quando sem sessão ativa.",
        "file": "server/src/ComputerControlServer.cpp",
        "code": "toolTip = ComputerSupportInfo::idleTrayHoverText();",
        "implementation": [
          "Substitui texto genérico Veyon.",
          "Atualizado a cada mudança de estado.",
          "Inclui hostname e usuário AD."
        ]
      },
      {
        "id": "cv-plugins",
        "parent": "cv-root",
        "layer": "module",
        "title": "Plugins customizados",
        "description": "RemoteAccess com diálogos CIMED e textos de suporte.",
        "file": "plugins/remoteaccess/RemoteAccessFeaturePlugin.cpp",
        "code": "class RemoteAccessFeaturePlugin : public QObject, public PluginInterface { ... };",
        "implementation": [
          "Plugin de acesso remoto VNC.",
          "Usa CimedHostInputDialog e PasswordDialog.",
          "Mensagens com idleTrayHoverText."
        ]
      },
      {
        "id": "cv-remote-plugin",
        "parent": "cv-plugins",
        "layer": "file",
        "title": "RemoteAccessFeaturePlugin.cpp",
        "description": "Fluxo de conexão remota com UI CIMED e logs outbound.",
        "file": "plugins/remoteaccess/RemoteAccessFeaturePlugin.cpp",
        "code": "CimedHostInputDialog hostDialog( parent );\nPasswordDialog passwordDialog( parent );\nAccessLogRecorder::logOutboundAccessSuccess( host, ip );",
        "implementation": [
          "Coleta host antes da senha.",
          "Registra sucesso via AccessLogRecorder.",
          "Notificação com branding CIMED."
        ]
      },
      {
        "id": "cv-deploy",
        "parent": "cv-root",
        "layer": "module",
        "title": "Deploy Veyon_Custom",
        "description": "Pacote portátil pronto para GPO/SCCM nas estações CiMED.",
        "file": "Veyon_Custom/",
        "code": "Veyon_Custom/\n  veyon-master.exe\n  veyon-worker.exe\n  plugins/\n  qt/",
        "implementation": [
          "Build Release copiado para Veyon_Custom/.",
          "Inclui DLLs Qt e plugins.",
          "README documenta fases restore-*."
        ]
      },
      {
        "id": "cv-veyon-custom",
        "parent": "cv-deploy",
        "layer": "file",
        "title": "Veyon_Custom/",
        "description": "Layout de instalação portátil sem installer MSI.",
        "file": "Veyon_Custom/",
        "code": "| Fase | Tag restore | Entrega |\n| UI+DPI | restore-pos-etapa5-dpi | Telas CIMED + bandeja |\n| Logs rede | este ciclo | UNC 172.20.100.36 |",
        "implementation": [
          "Copiar pasta inteira para destino.",
          "Configurar GPO para autostart worker.",
          "Tags git restore-* para rollback."
        ]
      },
      {
        "id": "cv-docs",
        "parent": "cv-deploy",
        "layer": "file",
        "title": "docs/",
        "description": "Relatórios PDF/MD: técnico executivo e estrutura de código.",
        "file": "docs/RELATORIO-TECNICO-PROJETO-CIMED.pdf",
        "code": "docs/\n  PROJETO-CIMED.md\n  RELATORIO-ESTRUTURA-CODIGO-CIMED.pdf\n  imagens/bandeja-todos-estados.png",
        "implementation": [
          "Mapa visual em PROJETO-CIMED.md.",
          "PDF executivo ≤5 páginas.",
          "Fluxogramas Mermaid no README."
        ]
      }
    ]
  }
];
