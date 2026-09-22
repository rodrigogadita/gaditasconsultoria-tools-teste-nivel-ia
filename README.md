# Diagnóstico de Nível de IA — Gaditas Consultoria

Aplicação de página única que mede a maturidade de uma pessoa em Inteligência Artificial,
posiciona o resultado num mapa de quadrantes e entrega um roadmap de evolução em PDF.

**No ar:** https://rodrigogadita.github.io/gaditasconsultoria-tools-teste-nivel-ia/

## Como funciona

1. A pessoa informa o nome.
2. Escolhe o formato: **robusto** (20 perguntas, ~5 min) ou **rápido** (10 perguntas, ~3 min).
3. Responde numa escala de 1 a 5 — a resposta avança sozinha, sem botão.
4. Revisa e edita qualquer resposta antes de finalizar.
5. Recebe o perfil, os gráficos, os destaques, o roadmap e o PDF para baixar.

## Banco de perguntas

São **40 perguntas**, 10 em cada uma das quatro dimensões. O sorteio é **balanceado**:
no modo robusto entram 5 de cada dimensão; no rápido, 2 ou 3 de cada. A ordem é
intercalada por dimensão e o embaralhamento é um Fisher-Yates alimentado por
`crypto.getRandomValues` (sem viés de módulo), então cada pessoa recebe um teste
diferente.

Medido em 5.000 rodadas simuladas: 5.000 ordens distintas, as 40 perguntas com
frequência entre 2.394 e 2.548 (esperado 2.500), as 40 aparecendo como primeira
pergunta e exatamente 25% das perguntas em cada dimensão.

| Dimensão | O que mede | Eixo |
|---|---|---|
| Conhecimento | entender e explicar IA | horizontal |
| Critério | julgar, revisar e usar com responsabilidade | horizontal |
| Uso no dia a dia | IA como hábito de trabalho | vertical |
| Criação | construir soluções próprias | vertical |

Os eixos do mapa saem de médias ponderadas (`AXIS_WEIGHTS` em `assets/js/data.js`):

- **X — o quanto sabe:** 55% Conhecimento + 45% Critério
- **Y — usar → criar:** 35% Uso + 65% Criação

O corte fica em 3,0 nos dois eixos, gerando os quadrantes:

| | Sabe pouco | Sabe muito |
|---|---|---|
| **Quer criar** | **A** — Criador em Formação | **B** — Construtor Avançado |
| **Quer usar** | **C** — Explorador Iniciante | **D** — Usuário Estratégico |

## Estrutura

```
index.html                     telas, marcação e o traçado da logo (usado por <use>)
assets/css/styles.css          tokens, tema claro/escuro, layout
assets/js/data.js              40 perguntas, dimensões, perfis, mensagens
assets/js/charts.js            mapa de quadrantes e radar em SVG puro
assets/js/logo.js              rasteriza a logo para o PDF, na cor pedida
assets/js/report.js            relatório em PDF (vetorial, texto selecionável)
assets/js/app.js               máquina de telas, atalhos, pontuação
assets/img/gaditas-logo.svg    logo completa vetorizada (fill: currentColor)
assets/img/gaditas-emblem.svg  só o emblema (mesmo traçado, outro viewBox)
assets/img/favicon.svg         emblema branco sobre o azul da marca
assets/img/og.png              imagem de compartilhamento (1200x630)
assets/vendor/jspdf.umd.min.js jsPDF 2.5.2 (MIT), servido localmente
tools/og-template.html         página usada para regerar a og.png
```

Sem build, sem framework e sem dependência de CDN — é só abrir o `index.html`.

## Teclado

| Tecla | Ação |
|---|---|
| `Enter` | começar, avançar, finalizar |
| `1`–`5` | responder (avança sozinho) |
| `1` / `2` | escolher o formato do diagnóstico |
| `←` / `Backspace` | voltar uma pergunta |
| `→` | avançar |
| `T` | alternar tema claro/escuro |

## Marca

A logo veio de um PNG e foi vetorizada (potrace + svgo) para um único `path`, declarado
uma vez no `index.html` e reaproveitado por `<use>` em tamanhos diferentes. Como o
preenchimento é `currentColor`, ela acompanha o tema: azul da marca no claro, branca no
escuro e branca sobre a faixa em degradê no PDF — onde é rasterizada na hora pelo
`logo.js`, porque o jsPDF não lê SVG.

## Detalhes técnicos

- **Paleta de dados validada** para contraste e daltonismo (`#2a78d6`, `#eb6834`,
  `#1baf7a`, `#eda100`), com passos próprios para o tema escuro. Todo valor tem rótulo
  visível, então a cor nunca é a única forma de identificar uma série.
- **Progresso salvo** em `localStorage`: fechar a aba no meio do teste não perde as respostas.
- **Acessibilidade:** navegação por teclado, `role="radiogroup"` nas escalas,
  descrição textual dos gráficos, visão em tabela e respeito a `prefers-reduced-motion`.
- Nenhum dado sai do navegador — não há back-end, analytics ou envio de respostas.

## Publicação

O site é servido pelo GitHub Pages a partir da branch `main`, na raiz do repositório.
Qualquer push para `main` republica automaticamente.
