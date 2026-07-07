#!/usr/bin/env python3
"""Gera js/data/projects.js com árvores expandidas."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "js", "data", "projects.js")
DATA = os.path.join(ROOT, "scripts", "projects-data.json")
VEYON_FILE = os.path.join(ROOT, "scripts", "veyon-project.json")
DROPBOX_FILE = os.path.join(ROOT, "scripts", "dropbox-project.json")
RESTAURANT_FILE = os.path.join(ROOT, "scripts", "restaurant-project.json")

def n(id, parent, layer, title, desc, file, code, impl):
    return {
        "id": id, "parent": parent, "layer": layer, "title": title,
        "description": desc, "file": file, "code": code.strip(),
        "implementation": impl if isinstance(impl, list) else [impl]
    }

# CanonPythonEcommerce — 22 nós
CPE_NODES = [
n("cpe-root", None, "root", "CanonPythonEcommerce", "E-commerce Django — GreatKart com 6 apps customizadas.", "greatkart/",
  "# Apps: category, accounts, store, carts, orders\nAUTH_USER_MODEL = accounts.Account",
  ["Clone o repo e configure .env com decouple.", "python manage.py migrate && runserver.", "Acesse /store/ para a loja."]),
n("cpe-greatkart", "cpe-root", "module", "greatkart", "Pacote central: settings, URLs, home e honeypot admin.", "greatkart/",
  "INSTALLED_APPS = ['category','accounts','store','carts','orders','admin_honeypot']",
  ["Configure INSTALLED_APPS e AUTH_USER_MODEL.", "Registre context processors.", "Proteja admin em /securelogin/."]),
n("cpe-settings", "cpe-greatkart", "file", "settings.py", "Secrets via decouple, sessão 1h, SMTP e SQLite.", "greatkart/settings.py",
  "SECRET_KEY = config('SECRET_KEY')\nSESSION_EXPIRE_SECONDS = 3600\nAUTH_USER_MODEL = 'accounts.Account'",
  ["Crie .env com SECRET_KEY e EMAIL_*.", "Configure SESSION_TIMEOUT_REDIRECT.", "Defina MEDIA_URL e STATIC_URL."]),
n("cpe-urls", "cpe-greatkart", "file", "urls.py", "Roteador raiz com honeypot e includes das apps.", "greatkart/urls.py",
  "path('admin/', include('admin_honeypot.urls')),\npath('securelogin/', admin.site.urls),\npath('store/', include('store.urls')),",
  ["Monte urlpatterns com include() por app.", "Sirva media com static() em DEBUG.", "Nomeie rotas com name=."]),
n("cpe-home", "cpe-greatkart", "function", "home()", "Home lista produtos ativos com reviews.", "greatkart/views.py",
  "def home(request):\n    products = Product.objects.filter(is_available=True).order_by('created_date')\n    return render(request, 'home.html', context)",
  ["Filtre is_available=True.", "Carregue ReviewRating status=True.", "Renderize home.html."]),
n("cpe-accounts", "cpe-root", "module", "accounts", "Auth customizada: Account, perfil, ativação e dashboard.", "accounts/",
  "USERNAME_FIELD = 'email'  # Account model",
  ["Modelo Account com email único.", "Views register/login/activate.", "Templates de verificação."]),
n("cpe-account-model", "cpe-accounts", "file", "Account", "User customizado com MyAccountManager.", "accounts/models.py",
  "class Account(AbstractBaseUser):\n    email = models.EmailField(unique=True)\n    is_active = models.BooleanField(default=False)\n    USERNAME_FIELD = 'email'",
  ["Crie MyAccountManager.", "Defina USERNAME_FIELD=email.", "UserProfile OneToOne."]),
n("cpe-register", "cpe-accounts", "function", "register()", "Cadastro + perfil + e-mail de ativação.", "accounts/views.py",
  "user = Account.objects.create_user(...)\nprofile = UserProfile(); profile.user_id = user.id; profile.save()",
  ["RegistrationForm valida POST.", "Cria UserProfile com foto default.", "Envia link activate/<uid>/<token>/."]),
n("cpe-login", "cpe-accounts", "function", "login()", "Login por email e merge de carrinho anônimo.", "accounts/views.py",
  "user = auth.authenticate(email=email, password=password)\n# mescla CartItem da sessão com user",
  ["authenticate(email=...).", "Compare variações do carrinho.", "auth.login e redirect dashboard."]),
n("cpe-dashboard", "cpe-accounts", "function", "dashboard()", "Painel do cliente com pedidos e perfil.", "accounts/views.py",
  "@login_required\ndef dashboard(request):\n    orders = Order.objects.filter(user=request.user, is_ordered=True)",
  ["Proteja com @login_required.", "Liste Order is_ordered=True.", "Template dashboard.html."]),
n("cpe-category", "cpe-root", "module", "category", "Categorias com slug e menu global.", "category/",
  "class Category(models.Model):\n    slug = models.SlugField(unique=True)",
  ["Model Category com slug.", "get_url() reverse products_by_category.", "Context processor menu_links."]),
n("cpe-menu-links", "cpe-category", "function", "menu_links()", "Injeta categorias no navbar.", "category/context_processors.py",
  "def menu_links(request):\n    return dict(links=Category.objects.all())",
  ["Registre em settings TEMPLATES.", "Template usa loop links.", "Atualize ao criar categoria."]),
n("cpe-store", "cpe-root", "module", "store", "Catálogo, detalhe, busca e reviews.", "store/",
  "urlpatterns: store, product_detail, search, submit_review",
  ["Models Product, Variation, ReviewRating.", "Paginação 6 itens.", "Galeria ProductGallery."]),
n("cpe-product-model", "cpe-store", "file", "Product", "Produto com variações e média de reviews.", "store/models.py",
  "class Product(models.Model):\n    slug = models.SlugField(unique=True)\n    def averageReview(self): ...",
  ["FK para Category.", "Variation cor/tamanho.", "ReviewRating com status."]),
n("cpe-product-detail", "cpe-store", "function", "product_detail()", "Detalhe com galeria, reviews e in_cart.", "store/views.py",
  "single_product = Product.objects.get(category__slug=..., slug=...)\nin_cart = CartItem.objects.filter(...).exists()",
  ["Slugs duplos na URL.", "Verifica compra anterior.", "Render product_detail.html."]),
n("cpe-search", "cpe-store", "function", "search()", "Busca por nome ou descrição.", "store/views.py",
  "products = Product.objects.filter(Q(description__icontains=keyword) | Q(product_name__icontains=keyword))",
  ["Campo keyword no GET.", "Use Q objects OR.", "Reutilize store.html."]),
n("cpe-review", "cpe-store", "function", "submit_review()", "Avaliação por estrelas pós-compra.", "store/views.py",
  "ReviewRating.objects.create(product=..., user=..., rating=..., review=...)",
  ["Só se orderproduct exists.", "Form ReviewForm.", "Redirect HTTP_REFERER."]),
n("cpe-carts", "cpe-root", "module", "carts", "Carrinho sessão/usuário com variações.", "carts/",
  "def _cart_id(request): return request.session.session_key or request.session.create()",
  ["Cart + CartItem models.", "M2M variations.", "counter context processor."]),
n("cpe-add-cart", "cpe-carts", "function", "add_cart()", "Adiciona produto com variações.", "carts/views.py",
  "variation = Variation.objects.get(product=product, variation_category__iexact=key)\nitem.quantity += 1",
  ["POST com cor/tamanho.", "Incrementa se variação igual.", "Redirect cart."]),
n("cpe-cart-counter", "cpe-carts", "function", "counter()", "Badge de quantidade no navbar.", "carts/context_processors.py",
  "for cart_item in cart_items: cart_count += cart_item.quantity",
  ["Registre context processor.", "Diferencia user vs sessão.", "Exiba cart_count no template."]),
n("cpe-orders", "cpe-root", "module", "orders", "Checkout PayPal, Payment e estoque.", "orders/",
  "class Order(models.Model): order_number, order_total, is_ordered",
  ["Models Payment, Order, OrderProduct.", "place_order + payments.", "E-mail confirmação."]),
n("cpe-place-order", "cpe-orders", "function", "place_order()", "Cria pedido pendente antes do PayPal.", "orders/views.py",
  "tax = (2 * total)/100\norder.order_number = current_date + str(data.id)",
  ["Valida carrinho não vazio.", "Taxa 2%.", "Render payments.html."]),
n("cpe-payments", "cpe-orders", "function", "payments()", "Confirma PayPal e limpa carrinho.", "orders/views.py",
  "payment = Payment(payment_id=body['transID'], ...)\nproduct.stock -= item.quantity",
  ["JSON do PayPal SDK.", "Copia para OrderProduct.", "JsonResponse order_number."]),
]

CPE = {
    "slug": "canon-python-ecommerce", "name": "CanonPythonEcommerce",
    "repoUrl": "https://github.com/CanonEngineer/CanonPythonEcommerce",
    "color": "#38bdf8", "icon": "python", "stack": "Django 5",
    "summary": "E-commerce completo — 6 apps, PayPal, honeypot admin, reviews.",
    "nodes": CPE_NODES
}

def main():
    with open(DATA, encoding="utf-8") as f:
        others = [p for p in json.load(f) if p.get("slug") not in ("customize-veyon", "javascript-dropbox")]
    with open(VEYON_FILE, encoding="utf-8") as f:
        veyon = json.load(f)
    with open(DROPBOX_FILE, encoding="utf-8") as f:
        dropbox = json.load(f)
    with open(RESTAURANT_FILE, encoding="utf-8") as f:
        restaurant = json.load(f)
    projects = [CPE] + others[:1] + [dropbox, restaurant] + others[1:] + [veyon]
    js = "/* Árvore do Conhecimento — " + str(sum(len(p['nodes']) for p in projects)) + " nós */\nconst PROJECTS = "
    js += json.dumps(projects, ensure_ascii=False, indent=2) + ";\n"
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(js)
    for p in projects:
        print(f"  {p['name']}: {len(p['nodes'])} nós")
    print(f"Total: {sum(len(p['nodes']) for p in projects)} nós -> {OUT}")

if __name__ == "__main__":
    main()
