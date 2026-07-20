# Galaxy 3D — Tree of Knowledge

Visualização interativa em **React Three Fiber** do grafo de dependências de cada projeto.

## Abrir

- Produção (GitHub Pages): `https://canonengineer.github.io/TreeofKnowledge/galaxy/index.html?project=professional-scanner`
- Na árvore 2D: botão **Modo Galaxy 3D** na barra de ferramentas

## Desenvolvimento

```powershell
cd universe
npm install --ignore-scripts   # evita falha do postinstall do esbuild em alguns ambientes
npm run dev
```

## Build para GitHub Pages

```powershell
python scripts/export-universe-graph.py
cd universe
npm install --ignore-scripts
npm run build
```

Saída em `galaxy/` (HTML + assets + `graphs/*.json`).

## Recursos

- Fundo espacial com estrelas e grade
- Nós em esferas com glow por categoria (Backend, AutoTest, Oracle, Frontend, etc.)
- Tamanho por camada (raiz / módulo / arquivo / função)
- Conexões iluminadas com partículas animadas
- Hover: destaque de vizinhos · Click: zoom + painel lateral
- Pesquisa, filtros por categoria, minimapa, tela cheia, pausar animação
