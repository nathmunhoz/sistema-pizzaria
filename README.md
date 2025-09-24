# Pizzaria Delivery - Sistema de Controle

Sistema de gerenciamento de pizzaria em **Node.js/TypeScript**. Permite cadastrar clientes e produtos, gerenciar carrinho, finalizar pedidos, emitir comprovantes e gerar relatórios.

---

## Tecnologias e Dependências

* **Node.js** >= 18
* **TypeScript** >= 5
* **readline** (nativo) – interface de input/output no console
* **fs/promises** (nativo) – manipulação de arquivos
* **path** (nativo) – gerenciamento de caminhos

> Todas as dependências do projeto são nativas do Node.js, portanto não há necessidade de instalar pacotes externos, a não ser que deseje adicionar recursos extras (ex: colors, dayjs, etc).

Exemplo de `package.json` mínimo:

```json
{
  "name": "pizzaria",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.1.0"
  }
}
```

---

## Instalação

1. Clone o repositório:

```bash
git clone <URL_DO_REPOSITORIO>
cd sistema-pizzaria
```

2. Instale as dependências (apenas TypeScript para desenvolvimento):

```bash
npm install
```

3. Compile o TypeScript:

```bash
npm run build
```

4. Execute o sistema:

```bash
npm run start
```

---

## Estrutura do Projeto

```
pizzaria/
│
├─ csv/                  # Armazena os arquivos CSV e TXT
│   ├─ clientes.csv
│   ├─ produtos.csv
│   ├─ pedidos.csv
│   ├─ resumo.txt
│   ├─ comprovante.txt
│   └─ avaliacoes.txt
│
├─ src/
│   └─ index.ts          # Código principal do sistema
│
├─ package.json
└─ tsconfig.json
```

---

## Funcionalidades

### Clientes

* Cadastrar, consultar, atualizar e excluir clientes
* Listar todos os clientes cadastrados

### Produtos

* Cadastrar produtos (Pizza, Bebida, Outros)
* Listar produtos e pesquisar por nome

### Carrinho e Pedidos

* Adicionar e remover itens do carrinho
* Finalizar pedido com escolha de forma de pagamento
* Emissão de comprovante no console e arquivo

### Relatórios

* Gerar relatório completo de vendas
* Filtrar pedidos por período/data
* Mostrar top produtos e vendas por cliente

### Avaliações

* Clientes podem avaliar o atendimento de 1 a 5 estrelas
* Avaliações são registradas em `avaliacoes.txt`

---

## Observações

* CSVs são criados automaticamente ao iniciar o sistema (`ensureFiles`)
* Campos com vírgula são substituídos por `;` para não quebrar o CSV
* IDs de clientes, produtos e pedidos são gerados automaticamente (`nid()`)

---