# BDATA — Pesquisas de feira (PWA offline)

Formulários de pesquisa rápida para tablet Android, 100% offline, usados em
feiras/eventos. Cada evento é uma pasta própria neste repositório, publicada
junto no mesmo site (GitHub Pages ou Netlify).

```
bdata-pesquisas/
├── shared/
│   └── fonts/geist-400.woff2   (fonte Geist subsetada, reaproveitada por todos os eventos)
└── bfshow/                     (pesquisa da feira BFShow — veja bfshow/README.md)
    ├── index.html
    ├── manifest.webmanifest
    ├── sw.js
    ├── css/ js/ icons/ apps-script/
    └── README.md
```

Cada pasta de evento é um PWA independente e completo (HTML/CSS/JS puro,
sem build step): tem seu próprio `manifest.webmanifest`, service worker,
banco IndexedDB e planilha/Apps Script. Só a fonte é compartilhada, para não
duplicar esse arquivo em cada evento.

## Publicar

O repositório inteiro é publicado de uma vez (GitHub Pages servindo a raiz).
Cada evento fica disponível no seu próprio caminho:

- `https://SEU-USUARIO.github.io/bdata-pesquisas/bfshow/`
- `https://SEU-USUARIO.github.io/bdata-pesquisas/nome-do-proximo-evento/`

Veja o passo a passo completo (deploy, Apps Script, instalação no tablet,
teste offline) em [`bfshow/README.md`](bfshow/README.md) — vale para
qualquer evento novo também.

## Criar a pesquisa de um novo evento

1. Copie a pasta de um evento existente (ex.: `bfshow/`) com um novo nome,
   por exemplo `nome-do-evento/`.
2. Dentro da cópia, ajuste:
   - `index.html`: nome do evento (banner antes de "Entrevistado"), campos
     e opções do formulário para o novo setor.
   - `css/style.css`: cores, se quiser uma identidade diferente para esse
     evento (o `@font-face` já aponta para `../shared/fonts/...` — mantenha
     esse caminho).
   - `js/db.js`: troque `DB_NOME` para um nome único deste evento (ex.:
     `"nome-do-evento-pesquisa-db"`) — **importante**, para não misturar os
     dados com os de outro evento no mesmo tablet/domínio.
   - `js/sync.js`: troque `CHAVE_WEBHOOK` e `CHAVE_ULTIMO_SYNC` para
     prefixos únicos também (ex.: `"nome-do-evento-pesquisa:webhookUrl"`).
   - `sw.js`: troque `CACHE_NOME` para um nome único (ex.:
     `"nome-do-evento-pesquisa-v1"`).
   - `js/app.js`: o prefixo do arquivo de backup CSV
     (`bfshow-pesquisa-backup-...`).
   - `manifest.webmanifest`: `name`, `short_name`, `description`.
   - `apps-script/Code.gs`: implante como um **novo** Apps Script, apontando
     para a planilha desse evento (cada evento tem a sua).
   - `icons/`: gere novos ícones se quiser um selo diferente (o script usado
     está descrito no histórico do projeto — um SVG simples convertido com
     `sharp`).
3. Teste localmente, publique (git push) e repita o passo 3 em diante do
   README do evento (Apps Script, instalar no tablet, teste offline).

Manter o `DB_NOME`, as chaves de `localStorage` e o `CACHE_NOME` únicos por
evento é o que evita dados de uma feira aparecerem em outra, já que todos os
eventos ficam no mesmo domínio (`github.io`), e IndexedDB/localStorage são
isolados por domínio, não por pasta.
