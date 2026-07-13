<div align="center">

![Árvore do Conhecimento](docs/images/preview-banner.png)

# Tree of Knowledge

### Heart of Programming — interactive map of all CanonEngineer code

<img src="https://img.shields.io/badge/Projetos-8-38bdf8?style=for-the-badge" alt="8 projetos"/>
<img src="https://img.shields.io/badge/Nós-217-fbbf24?style=for-the-badge" alt="217 nós"/>
<img src="https://img.shields.io/badge/GitHub_Pages-Ativo-22c55e?style=for-the-badge&logo=githubpages&logoColor=white" alt="GitHub Pages"/>
<img src="https://img.shields.io/badge/Stack-Python_·_Django_·_Node_·_Qt-a78bfa?style=for-the-badge" alt="Stack"/>

**Repositório central onde cada projeto vira uma árvore dimensional com nós de código, hover explicativo e modal de implementação.**

<br><br>

---

### 🚀 Acessar a Árvore do Conhecimento

<p>
  <a href="https://canonengineer.github.io/TreeofKnowledge/">
    <img src="https://img.shields.io/badge/🔗_CONECTAR-Abrir_Árvore_do_Conhecimento-38bdf8?style=for-the-badge&labelColor=0c2344" alt="Conectar — Abrir Árvore do Conhecimento" height="48"/>
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://github.com/CanonEngineer/TreeofKnowledge#-documentação-do-repositório">
    <img src="https://img.shields.io/badge/✖_CANCELAR-Permanecer_no_GitHub-64748b?style=for-the-badge&labelColor=1e293b" alt="Cancelar — Permanecer no GitHub" height="48"/>
  </a>
</p>

<p>
  <strong>Conectar</strong> → abre a experiência interativa em
  <a href="https://canonengineer.github.io/TreeofKnowledge/"><code>canonengineer.github.io/TreeofKnowledge</code></a><br>
  <strong>Cancelar</strong> → permanece nesta página do repositório
</p>

---

[Sobre](#-sobre) •
[Projetos](#-projetos-mapeados) •
[Arquitetura](#-arquitetura) •
[Fluxos](#-fluxogramas) •
[Como usar](#-como-usar) •
[Estrutura](#-estrutura-de-arquivos) •
[Autor](#-autor)

</div>

---

## 📌 Sobre

A **Árvore do Conhecimento** é o hub central de todos os projetos do **CanonEngineer**. Cada repositório foi analisado e transformado em uma **árvore interativa** onde:

| Ação | Resultado |
|------|-----------|
| **Raiz (nó dourado)** | Nome do projeto de origem |
| **Hover no nó** | Tooltip com nome + o que o código faz |
| **Clique no balão** | Abre **página dedicada** (`node.html`) com código e implementação |
| **Barra de busca** | Pesquisa em todos os projetos por código, função ou arquivo |
| **Voltar** | Retorna à árvore do projeto |

> Daqui saem todos os projetos — cada nó é código **criado por mim**, não boilerplate genérico.

<div align="center">

<p>
  <a href="https://canonengineer.github.io/TreeofKnowledge/">
    <img src="https://img.shields.io/badge/🌳_Entrar_na_Árvore-AGORA-22c55e?style=for-the-badge&labelColor=064e3b" alt="Entrar na Árvore"/>
  </a>
</p>

</div>

---

## 📸 Ilustrações

### 1 — Galeria de projetos

![Galeria de projetos](docs/images/preview-gallery.png)

### 2 — Árvore interativa (clique no balão → página do código)

![Árvore com balões clicáveis](docs/images/preview-tree.png)

### 3 — Página do nó (código + explicação embutidos)

![Página dedicada do código](docs/images/preview-node-page.png)

### Fluxo da jornada

![Fluxo da árvore interativa](docs/images/preview-flow.png)

### Arquitetura do sistema

![Arquitetura TreeofKnowledge](docs/images/preview-architecture.png)

### Camadas dos nós

![Hierarquia dos nós](docs/images/preview-layers.png)

---

## 🗂️ Projetos mapeados

| # | Projeto | Stack | Nós | Repositório |
|---|---------|-------|-----|-------------|
| 1 | **CanonPythonEcommerce** | Django 5 + PayPal | 23 | [CanonPythonEcommerce](https://github.com/CanonEngineer/CanonPythonEcommerce) |
| 2 | **FoodOnlineDjango** | Django + PostGIS + RazorPay | 20 | [FoodOnlineDjango](https://github.com/CanonEngineer/FoodOnlineDjango) |
| 3 | **JavaScriptDropBoxProject** | Express + Firebase | 38 | [JavaScriptDropBoxProject](https://github.com/CanonEngineer/JavaScriptDropBoxProject) |
| 4 | **JavaScriptRestaurantProject** | Express + EJS + MySQL + Redis | 31 | [JavaScriptRestaurantProject](https://github.com/CanonEngineer/JavaScriptRestaurantProject) |
| 5 | **JavaScriptUsersProject** | ES6 + localStorage | 20 | [JavaScriptUsersProject](https://github.com/CanonEngineer/JavaScriptUsersProject) |
| 6 | **JavaScriptRestfulApiProject** | Express + NeDB | 20 | [JavaScriptRestfulApiProject](https://github.com/CanonEngineer/JavaScriptRestfulApiProject) |
| 7 | **Professional-Scanner** | Node.js + WebSocket | 20 | [Professional-Scanner](https://github.com/CanonEngineer/Professional-Scanner) |
| 8 | **CustomizeVeyonProject** | Qt/C++ Veyon CIMED | 45 | [CustomizeVeyonProject](https://github.com/CanonEngineer/CustomizeVeyonProject) |

---

## 🏗️ Arquitetura

```mermaid
flowchart TB
    subgraph PAGES["🌐 GitHub Pages"]
        URL["canonengineer.github.io/TreeofKnowledge"]
    end

    subgraph FRONT["Frontend estático"]
        HTML["index.html<br/>Galeria + Árvore + Modal"]
        CSS["css/style.css<br/>Visual 3D + Cosmos"]
        APP["js/app.js<br/>Eventos + Navegação"]
        RENDER["js/tree-renderer.js<br/>Layout radial SVG"]
        DATA["js/data/projects.js<br/>8 projetos · 217 nós"]
    end

    subgraph PROJ["Repositórios de origem"]
        P1["CanonPythonEcommerce"]
        P2["FoodOnlineDjango"]
        P3["JS DropBox"]
        P4["JS Restaurant"]
        P5["JS Users"]
        P6["JS RestfulApi"]
        P7["Professional-Scanner"]
        P8["CustomizeVeyon"]
    end

    URL --> HTML
    HTML --> CSS
    HTML --> APP
    APP --> RENDER
    APP --> DATA
    DATA -.->|código mapeado| P1
    DATA -.->|código mapeado| P2
    DATA -.->|código mapeado| P3
    DATA -.->|código mapeado| P4
    DATA -.->|código mapeado| P5
    DATA -.->|código mapeado| P6
    DATA -.->|código mapeado| P7
    DATA -.->|código mapeado| P8
```

---

## 🔀 Fluxogramas

### Fluxo principal — da galeria ao código

```mermaid
flowchart LR
    A(["👤 Usuário acessa<br/>GitHub Pages"]) --> B{"Escolhe ação"}
    B -->|"🔗 Conectar"| C["Galeria de<br/>8 projetos"]
    B -->|"✖ Cancelar"| D["Permanece no<br/>README GitHub"]
    C --> E["Clica em um<br/>card de projeto"]
    E --> F["Árvore 3D<br/>renderizada"]
    F --> G{"Interação"}
    G -->|"Hover"| H["Tooltip:<br/>nome + descrição"]
    G -->|"Clique"| I["Modal:<br/>código + implementação"]
    I --> J{"Fechar?"}
    J -->|"Sim"| F
    J -->|"Voltar"| C
```

### Fluxo de um nó da árvore

```mermaid
flowchart TB
    ROOT(["🟡 ROOT<br/>Nome do projeto"])
    ROOT --> MOD1["🔵 Módulo<br/>ex: accounts/"]
    ROOT --> MOD2["🔵 Módulo<br/>ex: store/"]
    ROOT --> MOD3["🔵 Módulo<br/>ex: orders/"]
    MOD1 --> FILE1["🟣 Arquivo<br/>views.py"]
    MOD2 --> FUNC1["🟢 Função<br/>search()"]
    MOD3 --> FUNC2["🟢 Função<br/>payments()"]
    FILE1 --> HOVER["Hover → tooltip"]
    FUNC1 --> CLICK["Clique → modal"]
    FUNC2 --> CLICK
    CLICK --> CODE["Código-fonte real"]
    CLICK --> IMPL["Passos de implementação"]
```

### Fluxo de dados — `projects.js`

```mermaid
flowchart LR
    subgraph NODE["Estrutura de cada nó"]
        ID["id"]
        PARENT["parent"]
        LAYER["layer: root|module|file|function"]
        TITLE["title"]
        DESC["description"]
        FILE["file"]
        CODE["code"]
        IMPL["implementation"]
    end

    NODE --> RENDERER["tree-renderer.js<br/>posição radial"]
    RENDERER --> SVG["Linhas SVG<br/>pai → filho"]
    RENDERER --> DOM["Divs 3D<br/>nos nós"]
    DOM --> APP["app.js<br/>hover + modal"]
```

### Mapa dos ecossistemas

```mermaid
mindmap
  root((Árvore do<br/>Conhecimento))
    Python
      CanonPythonEcommerce
        Carrinho PayPal
        Accounts
      FoodOnlineDjango
        Multi-vendor
        RazorPay
    JavaScript
      DropBox Firebase
      Restaurant MySQL Redis
      Users localStorage
      RestfulApi NeDB
    Infra
      Professional-Scanner
        WebSocket
        Mapa 3D
      CustomizeVeyon
        UI HiDPI CIMED
        TamperLog SHA-256
        Logs UNC rede
```

---

## 🎮 Como usar

### Opção 1 — Experiência completa (recomendado)

<div align="center">

<a href="https://canonengineer.github.io/TreeofKnowledge/">
  <img src="https://img.shields.io/badge/🔗_CONECTAR-Abrir_Árvore_Interativa-38bdf8?style=for-the-badge&labelColor=0c2344" alt="Conectar"/>
</a>

</div>

1. Clique em **Conectar** acima
2. Escolha um dos **8 projetos** na galeria
3. Explore a **árvore dimensional** — mova o mouse para o efeito 3D
4. **Passe o mouse** nos balões para ver o que cada código faz
5. **Clique no balão** para abrir a **página com código e implementação**
6. Use a **barra de busca** no topo para encontrar qualquer trecho de código
7. **Voltar à Árvore** retorna ao projeto · **Voltar aos Projetos** retorna à galeria

### Opção 2 — Permanecer no GitHub

<div align="center">

<a href="https://github.com/CanonEngineer/TreeofKnowledge#-documentação-do-repositório">
  <img src="https://img.shields.io/badge/✖_CANCELAR-Continuar_no_Repositório-64748b?style=for-the-badge&labelColor=1e293b" alt="Cancelar"/>
</a>

</div>

Navegue pela documentação, fluxogramas e tabelas deste README sem sair do GitHub.

### Opção 3 — Local

```bash
git clone https://github.com/CanonEngineer/TreeofKnowledge.git
cd TreeofKnowledge
# Abra index.html no navegador
```

---

## 📁 Estrutura de arquivos

```
TreeofKnowledge/
├── index.html              # Galeria + árvore + busca
├── node.html               # Página dedicada do nó (código + implementação)
├── css/style.css
├── js/
│   ├── app.js              # Galeria, árvore, navegação
│   ├── node-page.js        # Renderiza página do nó
│   ├── search.js           # Busca global na árvore
│   ├── tree-renderer.js
│   └── data/projects.js
```

---

## 🎨 Design

| Elemento | Descrição |
|----------|-----------|
| **Fundo cosmos** | Estrelas animadas + nebulosa azul/roxa |
| **Perspectiva 3D** | `perspective` + rotação no movimento do mouse |
| **Nós dourados** | Raiz = nome do projeto |
| **Nós azuis** | Módulos (apps, controllers) |
| **Nós roxos** | Arquivos |
| **Nós verdes** | Funções e métodos |
| **Linhas SVG** | Conexões pai → filho com glow |
| **Canon Evolution** | Núcleo 3D com cubo de código, anéis orbitais e partículas no header |
| **Modal** | Código em JetBrains Mono + passos numerados |

---

## 📋 Documentação do repositório

Esta seção é o destino do botão **Cancelar** — você permanece aqui no GitHub.

### Links rápidos

| Recurso | URL |
|---------|-----|
| 🌳 **Árvore interativa** | [canonengineer.github.io/TreeofKnowledge](https://canonengineer.github.io/TreeofKnowledge/) |
| 📦 **Repositório** | [github.com/CanonEngineer/TreeofKnowledge](https://github.com/CanonEngineer/TreeofKnowledge) |
| 👤 **Perfil CanonEngineer** | [github.com/CanonEngineer](https://github.com/CanonEngineer) |

### Convenções dos nós

Cada entrada em `js/data/projects.js` segue:

```javascript
{
  id: 'cpe-root',
  parent: null,           // null = raiz
  layer: 'root',          // root | module | file | function
  title: 'CanonPythonEcommerce',
  description: '...',     // hover
  file: 'greatkart/urls.py',
  code: '...',            // código real
  implementation: ['...'] // passos PT
}
```

---

## 👤 Autor

**Alessandro Canon** — [CanonEngineer](https://github.com/CanonEngineer)

<div align="center">

<br>

### Pronto para explorar?

<p>
  <a href="https://canonengineer.github.io/TreeofKnowledge/">
    <img src="https://img.shields.io/badge/🔗_CONECTAR-Árvore_do_Conhecimento-38bdf8?style=for-the-badge&labelColor=0c2344" alt="Conectar" height="44"/>
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/CanonEngineer/TreeofKnowledge">
    <img src="https://img.shields.io/badge/✖_CANCELAR-Ficar_no_GitHub-64748b?style=for-the-badge&labelColor=1e293b" alt="Cancelar" height="44"/>
  </a>
</p>

<sub>Tree of Knowledge — base de conhecimento estruturada para todos os projetos CanonEngineer</sub>

</div>
