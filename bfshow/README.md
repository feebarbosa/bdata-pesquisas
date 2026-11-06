# BDATA — Pesquisa BFShow (PWA offline)

App estático (HTML/CSS/JS puro, sem frameworks) para coletar as entrevistas
na feira BFShow, direto no tablet Android, 100% offline. Quando houver
internet, sincroniza com uma planilha do Google via Apps Script.

Esta pasta é **um evento** dentro do repositório `bdata-pesquisas`, que junta
vários eventos/feiras no mesmo padrão (veja o [README da raiz](../README.md)
para entender a estrutura e como criar a pesquisa do próximo evento).

O bloco "Uso interno" (temperatura do lead e observação) fica escondido por
padrão — o entrevistado não vê — e só abre quando você toca nele, depois da
conversa. O campo de WhatsApp/e-mail é obrigatório.

Identidade visual reaproveitada do projeto **BKAN** (verde `#0b3d2e`, teal
`#2dd4bf`, azul de ação `#0079bf`) e a fonte **Geist** (mesma do BKAN),
baixada já em um subconjunto de ~23 KB (`../shared/fonts/geist-400.woff2`,
compartilhada entre todos os eventos) contendo só os caracteres usados na
interface, para não pesar no tablet.

## Estrutura desta pasta

```
bfshow/
├── index.html
├── manifest.webmanifest
├── sw.js                  (service worker — cache offline)
├── css/style.css
├── js/
│   ├── datetime.js         (hora de Brasília, fixa, sem depender do fuso do aparelho)
│   ├── db.js                (IndexedDB — nome do banco único deste evento)
│   ├── csv.js                (exportação em CSV)
│   ├── sync.js                (envio para o Google Apps Script)
│   └── app.js                  (formulário, lista, ajustes)
├── icons/ (ícones do app)
└── apps-script/Code.gs    (cole este código no Google Apps Script)
```

A fonte fica em `../shared/fonts/` (uma pasta acima, compartilhada com outros
eventos do mesmo repositório).

## 1. Publicar o app (GitHub Pages — gratuito, com HTTPS)

Um PWA só instala e funciona offline se servido por **HTTPS**. O repositório
inteiro (`bdata-pesquisas`, com todos os eventos) é publicado de uma vez:

```bash
cd "bdata-pesquisas"
git init
git add .
git commit -m "Pesquisa BFShow"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/bdata-pesquisas.git
git push -u origin main
```

No GitHub: **Settings → Pages → Source: branch `main`, pasta `/ (root)`** e
salve. Em 1–2 minutos este evento estará em
`https://SEU-USUARIO.github.io/bdata-pesquisas/bfshow/`.

### Alternativa: Netlify

1. Acesse netlify.com (sem precisar de git): "Add new site" → "Deploy
   manually" → arraste a pasta `bdata-pesquisas` inteira.
2. Netlify já publica com HTTPS automaticamente e dá uma URL do tipo
   `https://nome-aleatorio.netlify.app/bfshow/`.

## 2. Configurar o Google Apps Script (planilha de destino)

1. Crie uma planilha nova em sheets.google.com (pode ser em branco).
2. Menu **Extensões → Apps Script**.
3. Apague o conteúdo do `Code.gs` padrão e cole o conteúdo do arquivo
   [`apps-script/Code.gs`](apps-script/Code.gs) deste evento.
4. Clique em **Implantar → Nova implantação**.
5. Tipo: **Aplicativo da Web**. "Executar como": **Eu**. "Quem pode
   acessar": **Qualquer pessoa**.
6. Clique em **Implantar**, autorize as permissões pedidas (é o seu próprio
   script acessando sua própria planilha) e copie a URL gerada, que termina
   em `/exec`.
7. Essa URL é a que você vai colar no app, na tela **Ajustes**.

A primeira entrevista enviada já cria automaticamente a aba "Respostas" com
os cabeçalhos das colunas.

Se precisar alterar algo e reimplantar, use **Implantar → Gerenciar
implantações → ✏️ (editar)** e escolha "Nova versão" — a URL não muda.

## 3. Instalar no tablet Android (Chrome)

1. Abra a URL publicada (GitHub Pages ou Netlify) no Chrome do tablet.
2. Toque no menu (⋮) → **"Adicionar à tela inicial"** / **"Instalar app"**.
3. Abra o app pelo ícone criado — ele já abre em tela cheia, no modo
   paisagem.
4. Na primeira abertura (com internet), vá em **Ajustes**, cole a URL do
   Apps Script e toque em **Salvar URL**. Isso só precisa ser feito uma vez
   (fica salvo no aparelho).

## 4. Usar na feira

- Preencha o formulário normalmente — tudo é salvo no próprio tablet
  (IndexedDB), mesmo sem internet.
- Depois de salvar, o formulário limpa e mostra a confirmação com o
  contador de entrevistas do dia.
- Se estiver online, o app tenta sincronizar automaticamente em segundo
  plano. Se não, os registros ficam marcados como "pendente" e o selo
  vermelho no topo mostra quantos faltam enviar.
- Ao final do dia (ou quando pegar Wi-Fi/4G), abra **Ajustes** e toque em
  **"Sincronizar agora"**, ou simplesmente deixe o app aberto — ele
  sincroniza sozinho ao detectar conexão.
- Use **"Exportar CSV"** em Ajustes de tempos em tempos como backup extra
  (o arquivo é salvo com BOM UTF-8, abre certinho no Excel com acentos).

## 5. Teste de modo avião (antes da feira)

1. Com o tablet em modo avião, abra o app (precisa já ter sido aberto uma
   vez antes, com internet, para o service worker instalar o cache).
2. Preencha e salve 2–3 entrevistas de teste. Confira que aparecem na
   **Lista** e que o contador "pendentes" sobe.
3. Feche o Chrome completamente (não só minimizar) e abra o app de novo,
   ainda em modo avião — os registros devem continuar lá.
4. Desligue o modo avião. Em poucos segundos (ou tocando em "Sincronizar
   agora"), o selo de pendentes deve zerar e as linhas na planilha do
   Google devem aparecer.
5. Confira na aba **Respostas** da planilha se os dados e acentos vieram
   corretos.

## Decisões de desempenho

- Sem React/Vue/Tailwind — HTML/CSS/JS direto, sem build step.
- Fonte própria do BKAN (Geist) baixada já **subsetada** (só os caracteres
  usados na tela), ~23 KB, cacheada pelo service worker.
- Lista de entrevistas carrega os registros do IndexedDB uma vez e pagina
  no JavaScript (20 por página), evitando renderizar centenas de linhas no
  DOM de uma vez.
- Sem animações, sombras pesadas, blur ou imagens grandes — só bordas
  arredondadas simples e uma transição curta no aviso de confirmação.
