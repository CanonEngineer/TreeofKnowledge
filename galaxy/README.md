# Galaxy 3D — Tree of Knowledge

Visualização interativa em **React Three Fiber** do grafo de dependências de cada projeto.

## Abrir

- Produção: `https://canonengineer.github.io/TreeofKnowledge/galaxy/index.html?project=<slug>`
- Exemplo: `?project=customize-veyon` · `?project=professional-scanner`

## Build

```powershell
python scripts/export-universe-graph.py   # exporta os 27 projetos
cd universe
npm install --ignore-scripts
npm run build
```

Saída em `galaxy/` (HTML + assets + `graphs/*.json`).
