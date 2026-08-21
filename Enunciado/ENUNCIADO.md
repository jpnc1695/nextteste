# Case — Importação de estoque (fictício)

**Tempo de trabalho:** 4 a 6 horas  
**Prazo de entrega:** segunda-feira, **24/08/2026, 12:00** (Brasília)  
**Stack:** Next.js (App Router), TypeScript, Tailwind — **sistema modular** (veja abaixo)  
**Como rodar:** `npm install` e `npm run dev`. Docker **não** é obrigatório.  
**Entrega:** repositório GitHub + README (como rodar e o que ficou de fora)

Este case é **100% inventado**. Não existe acesso à intranet, ao código da Mobi, a banco, VPN ou pasta da empresa. Use **somente** os CSVs anexos.

---

## Em uma frase

Faça um site onde o analista **sobe um CSV de estoque** e o sistema **mostra a tabela, os totais e os alertas**. Linha errada não entra na conta. Arquivo muito sujo é recusado inteiro.

---

## O arquivo

CSV com cabeçalho **exato**, nesta ordem:

```text
cedente,sacado,nf,valor,vencimento,status
```

Uma linha = um título. Exemplo:

```text
Alfa Comercio Ltda,Mercado Norte SA,1001,10000.00,2026-09-10,ABERTO
```

**Data de referência do case (obrigatória):** `2026-08-21`  
Não use a data do computador. Vencido / PDD / destaque vermelho usam **sempre** esse dia. Assim o resultado é o mesmo para todo mundo.

---

## Arquitetura (obrigatória)

Monte um app Next.js **modular**, como um pedaço de sistema maior — não um único arquivo com tela + parse + PDD misturados.

Separe no mínimo:

| Módulo | Onde (sugestão) | O que vai aí |
|---|---|---|
| **UI** | `app/estoque/page.tsx` (e componentes) | botão, tabela, cards, cores |
| **API** | `app/api/estoque/.../route.ts` | receber o arquivo, responder JSON, HTTP 400 |
| **Regras** | `lib/` (ex.: `lib/estoque-regras.ts`) | parse, duplicata, ativo, vencido, PDD, concentração, trava 20% |
| **Estado** | `lib/` | último snapshot em memória ou JSON local |

As regras de negócio **não** podem viver só no React. Dá para importar `lib/` numa função/teste **sem** abrir o browser.

Docker / `Dockerfile` / `docker-compose`: **bônus**. Quem não usar Docker **não perde ponto**. A correção oficial é `npm run dev`.

---

## Tela (`/estoque`)

1. Botão **Importar CSV**.
2. Tabela: cedente, sacado, NF, valor, vencimento, status.
3. Cards:
   - quantidade no **estoque ativo**
   - soma do **estoque ativo**
   - **% vencido**
   - **PDD total**
   - **maior sacado** (nome + %)
4. Filtro: todos / aberto / vencido / liquidado.
5. Painel **Erros**: número da linha no CSV (1 = primeira linha de dados, depois do cabeçalho) + motivo.
6. Cores:
   - vermelho: vencido operacional
   - amarelo: sacado acima do limite de concentração
   - cinza: liquidado

---

## APIs

- `POST /api/estoque/import` — `multipart/form-data` com o arquivo.  
  Resposta de sucesso: `{ importados, rejeitados, erros, totais }` (formato livre, desde que dê para conferir).
- `GET /api/estoque` — último snapshot gravado, ou vazio se nunca importou / se o último arquivo foi recusado.

Persistência: memória ou arquivo JSON local. **Sem banco.**

---

## Regras

### 1. Linha válida

Entra no estoque só se **todas** forem verdade:

- `nf` não vazia
- `valor` número **> 0** (aceitar ponto ou vírgula)
- `vencimento` no formato `YYYY-MM-DD` e data válida
- `status` exatamente: `ABERTO`, `VENCIDO` ou `LIQUIDADO`
- linha em branco: ignorar (não conta como erro)

Cabeçalho diferente do esperado → **400** no arquivo inteiro (não importa linha a linha).

### 2. Duplicata

Chave: `cedente` + `nf` (comparar sem diferenciar maiúscula/minúscula, espaços nas pontas ignorados).

A **primeira** ocorrência vale. A **segunda** (e seguintes) = erro `"NF duplicada"` e não entra.

### 3. Estoque ativo

`LIQUIDADO` aparece na tabela (cinza) e **não entra** em:

- quantidade
- soma
- % vencido
- PDD
- concentração

Estoque ativo = `ABERTO` + `VENCIDO` **válidos e não duplicados**.

### 4. Vencido operacional

Uma linha ativa está **vencida** se:

- `status` = `VENCIDO`, **ou**
- `vencimento` **<** `2026-08-21`

Mesmo com status `ABERTO`, se a data já passou, trata como vencido (vermelho, entra no % vencido e no PDD).

`% vencido` = soma das linhas vencidas operacionais ÷ soma do estoque ativo.

### 5. PDD (provisão fake)

Só estoque ativo, pela data de vencimento vs `2026-08-21`:

| Situação | PDD da linha |
|---|---|
| Vencimento ≥ 2026-08-21 | 0% |
| Vencido de 1 a 30 dias | 50% do valor |
| Vencido há mais de 30 dias | 100% do valor |

Dias de atraso = `2026-08-21` **menos** `vencimento` (em dias corridos).  
PDD total = soma do PDD de cada linha ativa.

### 6. Concentração

No estoque ativo, some o valor por `sacado` (mesmo critério de nome: maiúscula/minúscula e espaços).

Se um sacado tiver **mais de 25%** da soma ativa:

- linhas desse sacado em **amarelo**
- alerta visível: nome + percentual + texto do limite 25%

### 7. Trava do arquivo

`taxa de erro` = linhas de erro ÷ (linhas de dados não vazias).

Se a taxa for **maior que 20%**:

- **não grava** o snapshot
- API **400**
- mensagem clara: arquivo rejeitado por excesso de erros
- a tela **continua** com o estoque anterior (se houver)

Erros ainda devem vir na resposta para o candidato mostrar o que estava errado.

---

## Arquivos para testar (anexos)

| Arquivo | O que deve acontecer |
|---|---|
| `estoque-ok.csv` | Importa tudo que é válido. Totais iguais ao gabarito da correção. |
| `estoque-parcial.csv` | Grava o snapshot. Algumas linhas em Erros. Totais só do que valeu. |
| `estoque-rejeitado.csv` | Não grava. 400. Estoque anterior permanece. |

---

## Fora de escopo

Login, SQL, Excel `.xlsx`, e-mail, WhatsApp, deploy obrigatório, testes E2E, Docker obrigatório.

Bônus (não obrigatório): testes unitários das regras 4, 5 e 7; Dockerfile que rode o `npm run dev` / `npm start`.

---

## Como entregar

1. Repo GitHub (público ou convite para o e-mail do recrutador) **até 24/08/2026, 12:00** (Brasília).
2. README: **primeiro** `npm install` / `npm run dev`. Se houver Docker, coloque como extra.
3. Não envie `node_modules`.
