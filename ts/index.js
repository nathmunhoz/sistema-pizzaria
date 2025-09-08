"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var readline_sync_1 = require("readline-sync");
// ================== GERENCIADORES ==================
var GerenciadorClientes = /** @class */ (function () {
    function GerenciadorClientes() {
        this.clientes = [];
        this.nextId = 1;
    }
    GerenciadorClientes.prototype.cadastrar = function (nome, telefone, endereco, email) {
        var novo = { id: this.nextId.toString(), nome: nome, telefone: telefone, endereco: endereco, email: email };
        this.clientes.push(novo);
        this.nextId++;
        return novo;
    };
    GerenciadorClientes.prototype.listar = function () {
        return this.clientes;
    };
    GerenciadorClientes.prototype.atualizar = function (id, nome) {
        var cliente = this.clientes.find(function (c) { return c.id === id; });
        if (cliente)
            cliente.nome = nome;
    };
    GerenciadorClientes.prototype.excluir = function (id) {
        this.clientes = this.clientes.filter(function (c) { return c.id !== id; });
    };
    return GerenciadorClientes;
}());
var GerenciadorProdutos = /** @class */ (function () {
    function GerenciadorProdutos() {
        this.produtos = [];
        this.nextId = 1;
    }
    GerenciadorProdutos.prototype.adicionar = function (nome, preco, categoria) {
        var novo = { id: this.nextId.toString(), nome: nome, preco: preco, categoria: categoria };
        this.produtos.push(novo);
        this.nextId++;
        return novo;
    };
    GerenciadorProdutos.prototype.listar = function () {
        return this.produtos;
    };
    return GerenciadorProdutos;
}());
var GerenciadorPedidos = /** @class */ (function () {
    function GerenciadorPedidos() {
        this.pedidos = [];
        this.nextId = 1;
    }
    GerenciadorPedidos.prototype.criar = function (cliente, itens, formaPagamento) {
        var total = itens.reduce(function (acc, i) { return acc + i.produto.preco * i.quantidade; }, 0);
        var novo = { id: this.nextId.toString(), cliente: cliente, itens: itens, total: total, formaPagamento: formaPagamento };
        this.pedidos.push(novo);
        this.nextId++;
        return novo;
    };
    GerenciadorPedidos.prototype.listar = function () {
        return this.pedidos;
    };
    return GerenciadorPedidos;
}());
// ================== EXECUÇÃO ==================
console.log("🍕 Bem-vindo ao Sistema de Pizzaria!");
var clientes = new GerenciadorClientes();
var produtos = new GerenciadorProdutos();
var pedidos = new GerenciadorPedidos();
// Produtos iniciais (exemplo do fluxograma)
produtos.adicionar("Pizza Calabresa", 45, "pizza");
produtos.adicionar("Pizza Quatro Queijos", 45, "pizza");
produtos.adicionar("Guaraná 2L", 10, "bebida");
produtos.adicionar("Cerveja", 8, "bebida");
var _loop_1 = function () {
    console.log("\n===== MENU PRINCIPAL =====");
    console.log("1 - Cadastro de Cliente");
    console.log("2 - Cadastro de Produto");
    console.log("3 - Criar Pedido");
    console.log("4 - Relatórios de Vendas");
    console.log("0 - Encerrar");
    var opcao = readline_sync_1.default.question("Escolha uma opção: ");
    // ===== CADASTRO DE CLIENTE =====
    if (opcao === "1") {
        console.log("\n--- Cadastro de Cliente ---");
        console.log("1 - Criar cliente");
        console.log("2 - Consultar clientes");
        console.log("3 - Atualizar cliente");
        console.log("4 - Excluir cliente");
        var sub = readline_sync_1.default.question("Escolha: ");
        if (sub === "1") {
            var nome = readline_sync_1.default.question("Nome: ");
            var telefone = readline_sync_1.default.question("Telefone: ");
            var endereco = readline_sync_1.default.question("Endereco: ");
            var email = readline_sync_1.default.question("Email (opcional): ");
            console.log("✅ Cliente criado:", clientes.cadastrar(nome, telefone, endereco, email || undefined));
        }
        else if (sub === "2") {
            console.log("📋 Clientes cadastrados:", clientes.listar());
        }
        else if (sub === "3") {
            var id = readline_sync_1.default.question("ID do cliente: ");
            var nome = readline_sync_1.default.question("Novo nome: ");
            clientes.atualizar(id, nome);
            console.log("✅ Cliente atualizado.");
        }
        else if (sub === "4") {
            var id = readline_sync_1.default.question("ID do cliente: ");
            clientes.excluir(id);
            console.log("✅ Cliente excluído.");
        }
        // ===== CADASTRO DE PRODUTO =====
    }
    else if (opcao === "2") {
        console.log("\n--- Cadastro de Produto ---");
        var nome = readline_sync_1.default.question("Nome: ");
        var preco = parseFloat(readline_sync_1.default.question("Preco: "));
        var categoria = readline_sync_1.default.question("Categoria (pizza/bebida): ");
        console.log("✅ Produto cadastrado:", produtos.adicionar(nome, preco, categoria));
        // ===== CRIAR PEDIDO =====
    }
    else if (opcao === "3") {
        console.log("\n--- Criar Pedido ---");
        console.log("Clientes:");
        clientes.listar().forEach(function (c) { return console.log("".concat(c.id, " - ").concat(c.nome)); });
        var clienteId_1 = readline_sync_1.default.question("ID do cliente: ");
        var cliente = clientes.listar().find(function (c) { return c.id === clienteId_1; });
        if (!cliente) {
            console.log("❌ Cliente não encontrado!");
            return "continue";
        }
        var itens = [];
        var _loop_2 = function () {
            console.log("Produtos:");
            produtos.listar().forEach(function (p) { return console.log("".concat(p.id, " - ").concat(p.nome, " (R$").concat(p.preco, ")")); });
            var prodId = readline_sync_1.default.question("ID do produto (ou ENTER para finalizar): ");
            if (!prodId)
                return "break";
            var produto = produtos.listar().find(function (p) { return p.id === prodId; });
            if (!produto) {
                console.log("❌ Produto não encontrado!");
                return "continue";
            }
            var qtd = parseInt(readline_sync_1.default.question("Quantidade: "));
            itens.push({ produto: produto, quantidade: qtd });
        };
        while (true) {
            var state_2 = _loop_2();
            if (state_2 === "break")
                break;
        }
        var forma = readline_sync_1.default.question("Forma de pagamento (credito/debito/dinheiro/pix): ");
        var pedido = pedidos.criar(cliente, itens, forma);
        console.log("✅ Pedido criado:", pedido);
        // ===== RELATÓRIOS =====
    }
    else if (opcao === "4") {
        console.log("\n--- Relatórios ---");
        pedidos.listar().forEach(function (p) {
            console.log("Pedido #".concat(p.id, " | Cliente: ").concat(p.cliente.nome, " | Total: R$").concat(p.total));
        });
        // ===== SAIR =====
    }
    else if (opcao === "0") {
        console.log("✅ Sistema encerrado.");
        return "break";
    }
    else {
        console.log("❌ Opção inválida!");
    }
};
// ========== MENU PRINCIPAL ==========
while (true) {
    var state_1 = _loop_1();
    if (state_1 === "break")
        break;
}
