  import * as path from 'path';
  import { promises as fs } from 'fs';
  import { stdin as input, stdout as output } from 'process';
  import * as readline from 'readline';

  const DATA_DIR = '.'; // altere se quiser colocar em outra pasta
  const ARQ = {
    clientes: path.join(DATA_DIR, 'clientes.csv'),
    produtos: path.join(DATA_DIR, 'produtos.csv'),
    pedidos: path.join(DATA_DIR, 'pedidos.csv'),
    resumo: path.join(DATA_DIR, 'resumo.txt'),
  };

  type FormaPagamento = 'Pix' | 'Cartão' | 'Dinheiro' | 'Vale-alimentacao';

  interface Cliente {
    id: string; // uuid simples (timestamp)
    nome: string;
    telefone: string;
    email?: string;
    endereco?: string;
  }

  interface Produto {
    id: string;
    categoria: 'Pizza' | 'Bebida' | 'Outros';
    nome: string; // exemplo: "Frango com catupiry"
    descricao?: string;
    preco: number; // preço padrão (p/ pizza pode ser preço da inteira)
    meta?: string; // por ex. "12 pedaços" ou "Lata"
  }

  interface ItemCarrinho {
    produtoId: string;
    nome: string;
    quantidade: number;
    precoUnit: number;
    observacao?: string;
  }

  interface Pedido {
    id: string;
    clienteId?: string;
    clienteNome?: string;
    itens: ItemCarrinho[];
    total: number;
    formaPagamento: FormaPagamento;
    trocoPara?: number; // se pagou em dinheiro
    dataISO: string;
  }

  // util simples para criar ids
  function nid(prefix = '') {
    return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
  }

  // ---------- I/O CSV helpers ----------
  async function ensureFiles() {
    // cria arquivos se não existirem
    const files = Object.values(ARQ);
    for (const f of files) {
      try {
        await fs.access(f);
      } catch {
        // criar arquivo vazio
        await fs.writeFile(f, '', 'utf8');
      }
    }
  }

  async function lerCSV<T>(file: string, parser: (cols: string[]) => T): Promise<T[]> {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const linhas = raw.split(/\r?\n/).filter(Boolean);
      return linhas.map(l => parser(l.split(',')));
    } catch {
      return [];
    }
  }

  async function appendCSV(file: string, line: string) {
    await fs.appendFile(file, line + '\n', 'utf8');
  }

  async function writeCSV(file: string, lines: string[]) {
    await fs.writeFile(file, lines.join('\n'), 'utf8');
  }

  // ---------- Clientes ----------
  async function cadastrarCliente(nome: string, telefone: string, email?: string, endereco?: string): Promise<Cliente> {
    const cliente: Cliente = {
      id: nid('C-'),
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email?.trim(),
      endereco: endereco?.trim(),
    };
    // gravar CSV: id,nome,telefone,email,endereco
    const line = [cliente.id, cliente.nome, cliente.telefone, cliente.email ?? '', cliente.endereco ?? ''].map(s => s.replace(/,/g, ';')).join(',');
    await appendCSV(ARQ.clientes, line);
    console.log(`Cliente cadastrado: ${cliente.nome} (ID: ${cliente.id})`);
    return cliente;
  }

  async function lerClientes(): Promise<Cliente[]> {
    return lerCSV<Cliente>(ARQ.clientes, cols => {
      const [id, nome, telefone, email, endereco] = cols;
      return { id, nome, telefone, email: email || undefined, endereco: endereco || undefined };
    });
  }

  async function consultarCliente(idOrNome: string): Promise<Cliente | null> {
    const clientes = await lerClientes();
    const chave = idOrNome.trim().toLowerCase();
    return clientes.find(c => c.id.toLowerCase() === chave || c.nome.toLowerCase() === chave) ?? null;
  }

  async function atualizarCliente(id: string, updates: Partial<Cliente>): Promise<boolean> {
    const clientes = await lerClientes();
    const idx = clientes.findIndex(c => c.id === id);
    if (idx === -1) return false;
    clientes[idx] = { ...clientes[idx], ...updates };
    const lines = clientes.map(c => [c.id, c.nome, c.telefone, c.email ?? '', c.endereco ?? ''].map(s => s.replace(/,/g, ';')).join(','));
    await writeCSV(ARQ.clientes, lines);
    return true;
  }

  async function excluirCliente(id: string): Promise<boolean> {
    const clientes = await lerClientes();
    const novos = clientes.filter(c => c.id !== id);
    if (novos.length === clientes.length) return false;
    const lines = novos.map(c => [c.id, c.nome, c.telefone, c.email ?? '', c.endereco ?? ''].map(s => s.replace(/,/g, ';')).join(','));
    await writeCSV(ARQ.clientes, lines);
    return true;
  }

  // ---------- Produtos ----------
  async function cadastrarProduto(prod: Produto): Promise<Produto> {
    prod.id = prod.id ?? nid('P-');
    const line = [prod.id, prod.categoria, prod.nome, prod.descricao ?? '', prod.preco.toFixed(2), prod.meta ?? ''].map(s => s.toString().replace(/,/g, ';')).join(',');
    await appendCSV(ARQ.produtos, line);
    console.log(`Produto cadastrado: ${prod.nome} (R$ ${prod.preco.toFixed(2)})`);
    return prod;
  }

  async function lerProdutos(): Promise<Produto[]> {
    return lerCSV<Produto>(ARQ.produtos, cols => {
      const [id, categoria, nome, descricao, preco, meta] = cols;
      return { id, categoria: (categoria as any), nome, descricao: descricao || undefined, preco: parseFloat(preco || '0'), meta: meta || undefined };
    });
  }

  async function carregarProdutosIniciais() {
    const existentes = await lerProdutos();
    if (existentes.length > 0) return;

    // Produtos iniciais
    const iniciais: Produto[] = [
      // Pizzas inteiras / 12 pedaços
      { id: nid('P-'), categoria: 'Pizza', nome: 'Frango com catupiry (Inteira)', descricao: 'Frango + Catupiry', preco: 45.00, meta: 'Inteira' },
      { id: nid('P-'), categoria: 'Pizza', nome: 'Calabresa (Inteira)', descricao: 'Calabresa tradicional', preco: 45.00, meta: 'Inteira' },
      { id: nid('P-'), categoria: 'Pizza', nome: 'Quatro queijos (Inteira)', descricao: 'Queijos variados', preco: 45.00, meta: 'Inteira' },
      { id: nid('P-'), categoria: 'Pizza', nome: 'Portuguesa (Inteira)', descricao: 'Presunto, ovo, cebola', preco: 45.00, meta: 'Inteira' },

      // Meia a meia (dois sabores)
      { id: nid('P-'), categoria: 'Pizza', nome: 'Meia-Meia 12p (2 sabores)', descricao: 'Escolha 2 sabores', preco: 50.00, meta: 'Meia/Meia' },

      // Pizzas por 8 pedaços (metade preço exemplo)
      { id: nid('P-'), categoria: 'Pizza', nome: '8 pedaços (Meia)', descricao: 'Opção 8 pedaços', preco: 30.00, meta: '8p' },

      // Doces
      { id: nid('P-'), categoria: 'Pizza', nome: 'Nutella com morango (Inteira)', descricao: 'Pizza doce', preco: 45.00, meta: 'Inteira' },
      { id: nid('P-'), categoria: 'Pizza', nome: 'Doce de Leite (Inteira)', descricao: 'Pizza doce', preco: 45.00, meta: 'Inteira' },
      { id: nid('P-'), categoria: 'Pizza', nome: 'Prestigio (Inteira)', descricao: 'Pizza doce', preco: 45.00, meta: 'Inteira' },
      { id: nid('P-'), categoria: 'Pizza', nome: 'Romeu e Julieta (Inteira)', descricao: 'Pizza doce', preco: 45.00, meta: 'Inteira' },

      // Bebidas
      { id: nid('P-'), categoria: 'Bebida', nome: 'Coca-Cola Lata', descricao: '350ml', preco: 6.00, meta: 'Lata' },
      { id: nid('P-'), categoria: 'Bebida', nome: 'Guaraná 2L', descricao: '2 litros', preco: 12.00, meta: '2L' },
      { id: nid('P-'), categoria: 'Bebida', nome: 'Água sem gás 500ml', descricao: '500ml', preco: 4.00, meta: '500ml' },
      { id: nid('P-'), categoria: 'Bebida', nome: 'Coca-Cola 2L', descricao: '2 litros', preco: 12.00, meta: '2L' },
      { id: nid('P-'), categoria: 'Bebida', nome: 'Guarana Lata', descricao: '350ml', preco: 6.00, meta: 'Lata' },
    ];

    for (const p of iniciais) await cadastrarProduto(p);
  }

  // ---------- Pedidos / Carrinho ----------
  let CARRINHO: ItemCarrinho[] = [];

  function verCarrinho() {
    if (CARRINHO.length === 0) {
      console.log('-- Carrinho vazio --');
      return;
    }
    console.log('--- Carrinho ---');
    let i = 1;
    for (const it of CARRINHO) {
      console.log(`${i}) ${it.nome} x${it.quantidade} - R$ ${(it.precoUnit * it.quantidade).toFixed(2)} ${it.observacao ? `(${it.observacao})` : ''}`);
      i++;
    }
    const total = CARRINHO.reduce((s, it) => s + it.precoUnit * it.quantidade, 0);
    console.log(`Total parcial: R$ ${total.toFixed(2)}`);
  }

  function adicionarAoCarrinho(item: ItemCarrinho) {
    // se já existe mesmo produto sem observação, soma quantidade
    const existente = CARRINHO.find(ci => ci.produtoId === item.produtoId && (ci.observacao ?? '') === (item.observacao ?? ''));
    if (existente) {
      existente.quantidade += item.quantidade;
    } else {
      CARRINHO.push({ ...item });
    }
    console.log(`Adicionado ao carrinho: ${item.nome} x${item.quantidade}`);
  }

  function removerDoCarrinho(idx: number) {
    if (idx < 1 || idx > CARRINHO.length) {
      console.log('Índice inválido.');
      return false;
    }
    const it = CARRINHO.splice(idx - 1, 1)[0];
    console.log(`Removido do carrinho: ${it.nome}`);
    return true;
  }

  async function finalizarPedido(clienteIdOpt?: string): Promise<Pedido | null> {
    if (CARRINHO.length === 0) {
      console.log('Carrinho vazio. Não é possível finalizar pedido.');
      return null;
    }
    const clientes = await lerClientes();
    const cliente = clienteIdOpt ? clientes.find(c => c.id === clienteIdOpt) : undefined;

    const total = CARRINHO.reduce((s, it) => s + it.precoUnit * it.quantidade, 0);
    console.log(`Total do pedido: R$ ${total.toFixed(2)}`);

    // escolher forma pagamento (interação deverá ser feita pelo menu principal)
    // Aqui apenas preparamos o pedido e retornamos para o fluxo interativo tratar o pagamento
    const pedido: Pedido = {
      id: nid('O-'),
      clienteId: cliente?.id,
      clienteNome: cliente?.nome,
      itens: JSON.parse(JSON.stringify(CARRINHO)),
      total,
      formaPagamento: 'Dinheiro',
      dataISO: new Date().toISOString(),
    };
    return pedido;
  }

  async function gravarPedido(pedido: Pedido) {
    // CSV: id,clienteId,clienteNome,total,formaPagamento,troco,dataISO,itensResumo
    const itensResumo = pedido.itens.map(i => `${i.nome} x${i.quantidade}`).join(';').replace(/,/g, ';');
    const line = [pedido.id, pedido.clienteId ?? '', pedido.clienteNome ?? '', pedido.total.toFixed(2), pedido.formaPagamento, (pedido.trocoPara ?? '').toString(), pedido.dataISO, itensResumo].join(',');
    await appendCSV(ARQ.pedidos, line);
    // limpar carrinho
    CARRINHO = [];
    console.log(`Pedido ${pedido.id} gravado. Total R$ ${pedido.total.toFixed(2)}. Forma: ${pedido.formaPagamento}`);
  }

  // ---------- Relatórios ----------
  async function gerarRelatorios() {
    const pedidos = await lerPedidos();
    if (pedidos.length === 0) {
      console.log('Nenhum pedido registrado.');
      return;
    }

    // total de vendas
    const totalVendas = pedidos.reduce((s, p) => s + p.total, 0);
    console.log(`Total vendas: R$ ${totalVendas.toFixed(2)} (${pedidos.length} pedidos)`);

    // vendas por cliente (nome)
    const vendasPorCliente = new Map<string, { total: number; qty: number }>();
    for (const p of pedidos) {
      const key = p.clienteNome ?? 'Cliente não informado';
      const cur = vendasPorCliente.get(key) ?? { total: 0, qty: 0 };
      cur.total += p.total;
      cur.qty += 1;
      vendasPorCliente.set(key, cur);
    }
    console.log('\nVendas por cliente:');
    vendasPorCliente.forEach((v, nome) => {
      console.log(`Cliente: ${nome}, Quantidade: ${v.qty}, Total: R$ ${v.total.toFixed(2)}`);
    });

    // produtos mais vendidos
    const contagemProdutos = new Map<string, number>();
    for (const p of pedidos) {
      for (const it of p.itens) {
        const cur = contagemProdutos.get(it.nome) ?? 0;
        contagemProdutos.set(it.nome, cur + it.quantidade);
      }
    }
    const ordenado = Array.from(contagemProdutos.entries()).sort((a, b) => b[1] - a[1]);
    console.log('\nProdutos mais vendidos (por unidades):');
    for (const [nome, q] of ordenado.slice(0, 10)) {
      console.log(`- ${nome}: ${q}`);
    }

    // export resumo em arquivo resumo.txt
    const linhasResumo = [
      `Resumo de Vendas - ${new Date().toLocaleString()}`,
      `Total pedidos: ${pedidos.length}`,
      `Total vendas: R$ ${totalVendas.toFixed(2)}`,
      '',
      'Top produtos:',
      ...ordenado.slice(0, 10).map(([n, q]) => `${n}: ${q}`),
      '',
      'Vendas por cliente:',
      ...Array.from(vendasPorCliente.entries()).map(([n, s]) => `${n}: ${s.qty} pedidos - R$ ${s.total.toFixed(2)}`)
    ];
    await fs.writeFile(ARQ.resumo, linhasResumo.join('\n'), 'utf8');
    console.log(`\nResumo salvo em ${ARQ.resumo}`);
  }

  async function lerPedidos(): Promise<Pedido[]> {
    return lerCSV<Pedido>(ARQ.pedidos, cols => {
      // id,clienteId,clienteNome,total,formaPagamento,troco,dataISO,itensResumo
      const [id, clienteId, clienteNome, total, formaPagamento, troco, dataISO, itensResumo] = cols;
      const itens: ItemCarrinho[] = (itensResumo || '').split(';').filter(Boolean).map(tok => {
        // form "Nome xQ" tentativa de parse simples
        const m = tok.match(/^(.*)\sx(\d+)$/);
        if (m) {
          return { produtoId: '', nome: m[1].trim(), quantidade: parseInt(m[2], 10), precoUnit: 0 };
        }
        return { produtoId: '', nome: tok.trim(), quantidade: 1, precoUnit: 0 };
      });
      return { id, clienteId: clienteId || undefined, clienteNome: clienteNome || undefined, itens, total: parseFloat(total || '0'), formaPagamento: (formaPagamento as FormaPagamento) ?? 'Dinheiro', trocoPara: troco ? parseFloat(troco) : undefined, dataISO: dataISO || new Date().toISOString() };
    });
  }

  // ---------- FILTRO DE PEDIDOS POR DATA ----------

async function filtrarPedidosPorData() {
  const pedidos = await lerPedidos();
  if (pedidos.length === 0) {
    console.log('Nenhum pedido registrado.');
    return;
  }

  // Pergunta o período
  const dataIniStr = await ask('Data inicial (DD/MM/AAAA): ');
  const dataFimStr = await ask('Data final (DD/MM/AAAA): ');

  // Converte strings para Date (invertendo dia/mês/ano)
  const [diaIni, mesIni, anoIni] = dataIniStr.split('/').map(Number);
  const [diaFim, mesFim, anoFim] = dataFimStr.split('/').map(Number);
  const dataIni = new Date(anoIni, mesIni - 1, diaIni);
  const dataFim = new Date(anoFim, mesFim - 1, diaFim);

  // Filtra pedidos no período
  const filtrados = pedidos.filter(p => {
    const dt = new Date(p.dataISO);
    return dt >= dataIni && dt <= dataFim;
  });

  if (filtrados.length === 0) {
    console.log('Nenhum pedido encontrado nesse período.');
    return;
  }

  console.log(`\nPedidos de ${dataIniStr} até ${dataFimStr}:`);
  filtrados.forEach(p => {
    const data = new Date(p.dataISO);
    const dataFormatada = `${String(data.getDate()).padStart(2,'0')}/${String(data.getMonth()+1).padStart(2,'0')}/${data.getFullYear()}`;
    console.log(`ID: ${p.id}, Cliente: ${p.clienteNome ?? 'Não informado'}, Total: R$ ${p.total.toFixed(2)}, Data: ${dataFormatada}`);
  });

  const totalPeriodo = filtrados.reduce((s, p) => s + p.total, 0);
  console.log(`Total de pedidos no período: ${filtrados.length}`);
  console.log(`Total em vendas: R$ ${totalPeriodo.toFixed(2)}`);
}


  // ---------- Console interativo (menu) ----------
  const rl = readline.createInterface({ input, output });

  function ask(q: string): Promise<string> {
    return new Promise<string>((resolve) => rl.question(q, resolve));
  }

  async function menuPrincipal() {
  await ensureFiles();
  await carregarProdutosIniciais();

  let loop = true;
  while (loop) {
    console.log('\n===== PIZZARIA - MENU PRINCIPAL =====');
    console.log('1) Clientes');
    console.log('2) Produtos');
    console.log('3) Carrinho');
    console.log('4) Finalizar pedido');
    console.log('5) Relatórios');
    console.log('6) Sair');

    const op = (await ask('Escolha: ')).trim();

    if (op === '1') {
      await menuClientes();
    } else if (op === '2') {
      await menuProdutos();
    } else if (op === '3') {
      await menuCarrinho();
    } else if (op === '4') {
      await fluxoFinalizarPedido();
    } else if (op === '5') {
      // Sub-menu de relatórios
      let sub = true;
      while (sub) {
        console.log('\n--- RELATÓRIOS ---');
        console.log('1) Relatório completo');
        console.log('2) Filtrar por período/data');
        console.log('3) Voltar');

        const subOp = (await ask('Escolha: ')).trim();

        switch (subOp) {
          case '1':
            await gerarRelatorios();
            break;
          case '2':
            await filtrarPedidosPorData();
            break;
          case '3':
            sub = false;
            break;
          default:
            console.log('Opção inválida.');
        }

        if (sub) console.log('');
      }
    } else if (op === '6') {
      loop = false;
      console.log('Encerrando sistema.');
    } else {
      console.log('Opção inválida.');
    }
  }
  rl.close();
}

  async function menuClientes() {
    let sub = true;
    while (sub) {
      console.log('\n--- CLIENTES ---');
      console.log('1) Cadastrar cliente');
      console.log('2) Consultar cliente (por ID ou nome)');
      console.log('3) Atualizar cliente');
      console.log('4) Excluir cliente');
      console.log('5) Listar todos');
      console.log('6) Voltar');

      const op = (await ask('Escolha: ')).trim();

      if (op === '1') {
        const nome = await ask('Nome: ');
        const tel = await ask('Telefone: ');
        const email = await ask('Email (opcional): ');
        const end = await ask('Endereço: ');
        await cadastrarCliente(nome, tel, email || undefined, end || undefined);
      } else if (op === '2') {
        const chave = await ask('ID ou nome: ');
        const c = await consultarCliente(chave);
        if (c) console.log(`Encontrado: ID=${c.id} | ${c.nome} | ${c.telefone} | ${c.email ?? ''} | ${c.endereco ?? ''}`);
        else console.log('Cliente não encontrado.');
      } else if (op === '3') {
        const id = await ask('ID do cliente a atualizar: ');
        const nome = await ask('Nome (enter p/ manter): ');
        const tel = await ask('Telefone (enter p/ manter): ');
        const email = await ask('Email (enter p/ manter): ');
        const end = await ask('Endereço (enter p/ manter): ');
        const updates: Partial<Cliente> = {};
        if (nome) updates.nome = nome;
        if (tel) updates.telefone = tel;
        if (email) updates.email = email;
        if (end) updates.endereco = end;
        const ok = await atualizarCliente(id, updates);
        console.log(ok ? 'Atualizado.' : 'Cliente não encontrado.');
      } else if (op === '4') {
        const id = await ask('ID do cliente a excluir: ');
        const ok = await excluirCliente(id);
        console.log(ok ? 'Excluído.' : 'Cliente não encontrado.');
      } else if (op === '5') {
        const clientes = await lerClientes();
        if (clientes.length === 0) console.log('Nenhum cliente cadastrado.');
        else clientes.forEach(c => console.log(`${c.id} | ${c.nome} | ${c.telefone} | ${c.email ?? ''} | ${c.endereco ?? ''}`));
      } else if (op === '6') {
        sub = false;
      } else {
        console.log('Opção inválida.');
      }
    }
  }

  async function menuProdutos() {
    let sub = true;
    while (sub) {
      console.log('\n--- PRODUTOS ---');
      console.log('1) Cadastrar produto');
      console.log('2) Listar produtos');
      console.log('3) Procurar por nome');
      console.log('4) Voltar');

      const op = (await ask('Escolha: ')).trim();

      if (op === '1') {
        const cat = (await ask('Categoria (Pizza/Bebida/Outros): ')).trim() as any;
        const nome = await ask('Nome do produto: ');
        const desc = await ask('Descrição (opcional): ');
        const precoStr = await ask('Preço (ex: 45.00): ');
        const meta = await ask('Meta (ex: Inteira, 12p, Lata) (opcional): ');
        const preco = parseFloat(precoStr.replace(',', '.')) || 0;
        await cadastrarProduto({ id: nid('P-'), categoria: cat, nome, descricao: desc || undefined, preco, meta: meta || undefined });
      } else if (op === '2') {
        const produtos = await lerProdutos();
        if (produtos.length === 0) console.log('Nenhum produto cadastrado.');
        else produtos.forEach(p => console.log(`${p.id} | ${p.categoria} | ${p.nome} | R$ ${p.preco.toFixed(2)} | ${p.meta ?? ''}`));
      } else if (op === '3') {
        const chave = (await ask('Nome (ou parte): ')).toLowerCase();
        const produtos = (await lerProdutos()).filter(p => p.nome.toLowerCase().includes(chave));
        if (produtos.length === 0) console.log('Nenhum produto encontrado.');
        else produtos.forEach(p => console.log(`${p.id} | ${p.categoria} | ${p.nome} | R$ ${p.preco.toFixed(2)} | ${p.meta ?? ''}`));
      } else if (op === '4') {
        sub = false;
      } else {
        console.log('Opção inválida.');
      }
    }
  }

  async function menuCarrinho() {
    let sub = true;
    while (sub) {
      console.log('\n--- CARRINHO ---');
      console.log('1) Adicionar produto ao carrinho');
      console.log('2) Ver carrinho');
      console.log('3) Remover item (por índice)');
      console.log('4) Limpar carrinho');
      console.log('5) Voltar');

      const op = (await ask('Escolha: ')).trim();

      if (op === '1') {
        const produtos = await lerProdutos();
        produtos.forEach((p, i) => console.log(`${i + 1}) ${p.nome} - R$ ${p.preco.toFixed(2)} (${p.meta ?? p.categoria})`));
        const sel = parseInt(await ask('Escolha o número do produto: '), 10);
        if (isNaN(sel) || sel < 1 || sel > produtos.length) {
          console.log('Selecionado inválido.');
          continue;
        }
        const p = produtos[sel - 1];
        const qtd = parseInt(await ask('Quantidade: '), 10) || 1;
        const obs = await ask('Observação (ex: meia com outro sabor) (opcional): ');
        adicionarAoCarrinho({ produtoId: p.id, nome: p.nome, quantidade: qtd, precoUnit: p.preco, observacao: obs || undefined });
      } else if (op === '2') {
        verCarrinho();
      } else if (op === '3') {
        verCarrinho();
        const idx = parseInt(await ask('Índice do item a remover: '), 10);
        removerDoCarrinho(idx);
      } else if (op === '4') {
        CARRINHO = [];
        console.log('Carrinho limpo.');
      } else if (op === '5') {
        sub = false;
      } else {
        console.log('Opção inválida.');
      }
    }
  }

  async function fluxoFinalizarPedido() {
    if (CARRINHO.length === 0) {
      console.log('Carrinho vazio. Adicione itens antes de finalizar.');
      return;
    }
    // pergunta se há cliente associado
    const temCliente = (await ask('Associar a um cliente cadastrado? (s/n): ')).trim().toLowerCase();
    let clienteId: string | undefined;
    if (temCliente === 's' || temCliente === 'sim') {
      const chave = await ask('Digite ID ou nome do cliente: ');
      const c = await consultarCliente(chave);
      if (!c) {
        console.log('Cliente não encontrado, continue sem cliente ou cadastre antes.');
      } else {
        clienteId = c.id;
        console.log(`Pedido associado a ${c.nome}`);
      }
    }
    const pedidoParcial = await finalizarPedido(clienteId);
    if (!pedidoParcial) return;

    // escolher forma pagamento
    console.log('Formas de pagamento: 1) Pix  2) Cartão  3) Dinheiro  4) Vale-alimentacao');
    const op = (await ask('Escolha: ')).trim();
    if (op === '1') pedidoParcial.formaPagamento = 'Pix';
    else if (op === '2') pedidoParcial.formaPagamento = 'Cartão';
    else if (op === '3') {
      pedidoParcial.formaPagamento = 'Dinheiro';
      const trocoStr = await ask('Valor entregue pelo cliente (para calcular troco) - deixe em branco se exato: ');
      if (trocoStr) {
        const trocoNum = parseFloat(trocoStr.replace(',', '.')) || 0;
        pedidoParcial.trocoPara = trocoNum;
      }
    } else if (op === '4') pedidoParcial.formaPagamento = 'Vale-alimentacao';
    else {
      console.log('Opção inválida. Usando Dinheiro por padrão.');
      pedidoParcial.formaPagamento = 'Dinheiro';
    }

    await gravarPedido(pedidoParcial);
  }

  // ---------- Inicialização ----------
  (async function main() {
    try {
      await ensureFiles();
      await carregarProdutosIniciais();
      await menuPrincipal();
    } catch (err) {
      console.error('Erro no sistema:', err);
      rl.close();
    }
  })();
