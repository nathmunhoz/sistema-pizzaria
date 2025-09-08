// ================== MODELOS ==================
export interface Cliente {
    id: string;
    nome: string;
    telefone: string;
    endereco: string;
    email?: string;
}

export interface Produto {
    id: string;
    nome: string;
    preco: number;
    categoria: string; // "pizza" | "bebida"
    descricao?: string;
}

export interface Ingrediente {
    nome: string;
    quantidade?: string;
}

export interface Pizza extends Produto {
    tamanho: 'broto' | 'media' | 'grande';
    sabor: string;
    ingredientes: Ingrediente[];
    observacoes?: string;
}

export interface Bebida extends Produto {
    volume: string; // Ex: "2L", "350ml"
}

export type ItemPedido = {
    produto: Produto | Pizza | Bebida;
    quantidade: number;
    observacoes?: string;
};

export interface Pedido {
    id: string;
    cliente: Cliente;
    itens: ItemPedido[];
    total: number;
    dataHora: Date;
    status: 'pendente' | 'em preparo' | 'a caminho' | 'entregue' | 'cancelado';
    formaPagamento: 'credito' | 'debito' | 'dinheiro' | 'pix';
}

// ================== GERENCIADORES ==================
export class GerenciadorClientes {
    private clientes: Cliente[] = [];
    private nextId = 1;

    cadastrarCliente(cliente: Omit<Cliente, "id">): Cliente {
        const novoCliente: Cliente = { id: this.nextId.toString(), ...cliente };
        this.clientes.push(novoCliente);
        this.nextId++;
        return novoCliente;
    }

    listarClientes(): Cliente[] {
        return [...this.clientes];
    }

    excluirCliente(id: string): boolean {
        const tamanhoInicial = this.clientes.length;
        this.clientes = this.clientes.filter(c => c.id !== id);
        return this.clientes.length < tamanhoInicial;
    }
}

export class GerenciadorProdutos {
    private produtos: (Produto | Pizza | Bebida)[] = [];
    private nextId: number = 1;

    private generateId(): string {
        return (this.nextId++).toString();
    }

    adicionarProduto(produto: Produto | Pizza | Bebida): Produto | Pizza | Bebida {
        if (!produto.id) {
            produto.id = this.generateId();
        }
        this.produtos.push(produto);
        return produto;
    }

    adicionarPizza(pizza: Omit<Pizza, "id">): Pizza {
        const novaPizza: Pizza = { ...pizza, id: this.generateId() };
        this.produtos.push(novaPizza);
        return novaPizza;
    }

    adicionarBebida(bebida: Omit<Bebida, "id">): Bebida {
        const novaBebida: Bebida = { ...bebida, id: this.generateId() };
        this.produtos.push(novaBebida);
        return novaBebida;
    }

    listarProdutos(): (Produto | Pizza | Bebida)[] {
        return [...this.produtos];
    }

    buscarProdutoPorId(id: string): (Produto | Pizza | Bebida) | undefined {
        return this.produtos.find(p => p.id === id);
    }
}

export class GerenciadorPedidos {
    private pedidos: Pedido[] = [];
    private nextId = 1;

    criarPedido(cliente: Cliente, itens: ItemPedido[], formaPagamento: Pedido["formaPagamento"]): Pedido {
        const total = itens.reduce((acc, item) => acc + item.produto.preco * item.quantidade, 0);
        const novoPedido: Pedido = {
            id: this.nextId.toString(),
            cliente,
            itens,
            total,
            dataHora: new Date(),
            status: "pendente",
            formaPagamento,
        };
        this.pedidos.push(novoPedido);
        this.nextId++;
        return novoPedido;
    }

    listarPedidos(): Pedido[] {
        return [...this.pedidos];
    }

    buscarPedidoPorId(id: string): Pedido | undefined {
        return this.pedidos.find(p => p.id === id);
    }

    atualizarStatusPedido(id: string, status: Pedido["status"]): boolean {
        const pedido = this.pedidos.find(p => p.id === id);
        if (!pedido) return false;
        pedido.status = status;
        return true;
    }
}

// ================== RELATÓRIOS ==================
export class RelatoriosVendas {
    constructor(private gerenciadorPedidos: GerenciadorPedidos) {}

    listarVendasPorCliente(clienteId: string): Pedido[] {
        return this.gerenciadorPedidos.listarPedidos().filter(p => p.cliente.id === clienteId);
    }

    listarProdutosMaisVendidos(): { produtoNome: string; quantidadeTotal: number }[] {
        const contagemProdutos: { [key: string]: number } = {};
        this.gerenciadorPedidos.listarPedidos().forEach(pedido => {
            pedido.itens.forEach(item => {
                const nomeProduto = item.produto.nome;
                contagemProdutos[nomeProduto] = (contagemProdutos[nomeProduto] || 0) + item.quantidade;
            });
        });

        return Object.entries(contagemProdutos)
            .map(([produtoNome, quantidadeTotal]) => ({ produtoNome, quantidadeTotal }))
            .sort((a, b) => b.quantidadeTotal - a.quantidadeTotal);
    }

    exibirTotalDeVendas(): number {
        return this.gerenciadorPedidos.listarPedidos().reduce((acc, pedido) => acc + pedido.total, 0);
    }

    exibirQuantidadeDePizzaVendidaPorDia(): { data: string; quantidade: number }[] {
        const vendasPorDia: { [key: string]: number } = {};
        this.gerenciadorPedidos.listarPedidos().forEach(pedido => {
            const data = pedido.dataHora.toISOString().split('T')[0];
            pedido.itens.forEach(item => {
                if (item.produto.categoria === 'pizza') {
                    vendasPorDia[data] = (vendasPorDia[data] || 0) + item.quantidade;
                }
            });
        });
        return Object.entries(vendasPorDia).map(([data, quantidade]) => ({ data, quantidade }));
    }
}

// ================== EXECUÇÃO ==================
console.log('🍕 Iniciando sistema de pizzaria...\n');

const gerenciadorClientes = new GerenciadorClientes();
const gerenciadorProdutos = new GerenciadorProdutos();
const gerenciadorPedidos = new GerenciadorPedidos();
const relatoriosVendas = new RelatoriosVendas(gerenciadorPedidos);

// Cadastrando clientes
const cliente1 = gerenciadorClientes.cadastrarCliente({
    nome: 'Ana Silva',
    telefone: '11987654321',
    endereco: 'Rua das Flores, 123',
});
const cliente2 = gerenciadorClientes.cadastrarCliente({
    nome: 'Bruno Costa',
    telefone: '11912345678',
    endereco: 'Av. Paulista, 456',
});
console.log('Clientes cadastrados:', gerenciadorClientes.listarClientes());

// Cadastrando produtos
const pizzaCalabresa = gerenciadorProdutos.adicionarPizza({
    nome: 'Pizza Calabresa',
    preco: 45.00,
    categoria: 'pizza',
    tamanho: 'media',
    sabor: 'Calabresa',
    ingredientes: [{ nome: 'Calabresa' }, { nome: 'Cebola' }],
});

const refrigeranteGuarana = gerenciadorProdutos.adicionarBebida({
    nome: 'Guaraná Antarctica',
    preco: 7.00,
    categoria: 'bebida',
    volume: '1.5L',
});
console.log('Produtos disponíveis:', gerenciadorProdutos.listarProdutos());

// Criando pedidos
const pedido1 = gerenciadorPedidos.criarPedido(
    cliente1,
    [
        { produto: pizzaCalabresa, quantidade: 1, observacoes: 'sem cebola' },
        { produto: refrigeranteGuarana, quantidade: 2 },
    ],
    'credito'
);

const pedido2 = gerenciadorPedidos.criarPedido(
    cliente2,
    [
        { produto: pizzaCalabresa, quantidade: 1 },
    ],
    'pix'
);

console.log('Pedidos criados:', gerenciadorPedidos.listarPedidos());

// Atualizando status
gerenciadorPedidos.atualizarStatusPedido(pedido1.id, 'em preparo');
console.log(`Status do Pedido ${pedido1.id}:`, gerenciadorPedidos.buscarPedidoPorId(pedido1.id)?.status);

// Relatórios
console.log('\n📊 Relatórios de Vendas');
console.log('Vendas para Ana Silva:', relatoriosVendas.listarVendasPorCliente(cliente1.id));
console.log('Produtos mais vendidos:', relatoriosVendas.listarProdutosMaisVendidos());
console.log('Total de vendas:', relatoriosVendas.exibirTotalDeVendas());
console.log('Quantidade de pizza vendida por dia:', relatoriosVendas.exibirQuantidadeDePizzaVendidaPorDia());

// Excluindo cliente
gerenciadorClientes.excluirCliente(cliente2.id);
console.log('\nClientes após exclusão:', gerenciadorClientes.listarClientes());

console.log('\n✅ Sistema de pizzaria finalizado.');
