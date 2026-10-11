const API_URL = 'http://localhost:3000/api';

let modoAtual = 'cliente';
let produtosGlobais = [];
let categoriaAtiva = 'todos';
let tamanhoSelecionadoPorProduto = {}; // Armazena tamanho selecionado por produto
let metodoPagamentoSelecionado = 'pix';

let carrinho = JSON.parse(localStorage.getItem('cyber_carrinho')) || [];
let usuarioLogado = JSON.parse(localStorage.getItem('cyber_usuario')) || null;
let adminLogado = JSON.parse(localStorage.getItem('cyber_admin')) || null;

const IMAGENS_PADRAO = {
    'manga-longa': 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80',
    'manga-curta': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80',
    'calca': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80',
    'default': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80'
};

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    atualizarBadgeCarrinho();
    atualizarBarraUsuario();
});

// ==========================================
// 1. AUTENTICAÇÃO E BARRA DE USUÁRIO
// ==========================================
function abrirModalAuthCliente() {
    document.getElementById('modal-auth').classList.remove('hidden');
}

function fecharModalAuth() {
    document.getElementById('modal-auth').classList.add('hidden');
}

function realizarAutenticacao(event) {
    event.preventDefault();
    const nome = document.getElementById('auth-nome').value;
    const email = document.getElementById('auth-email').value;

    usuarioLogado = { nome, email };
    localStorage.setItem('cyber_usuario', JSON.stringify(usuarioLogado));

    fecharModalAuth();
    atualizarBarraUsuario();

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `Bem-vindo, ${nome}!`,
            showConfirmButton: false,
            timer: 1500,
            background: '#0a0a0a',
            color: '#fff'
        });
    }

    // Se veio de um clique de finalizar pedido, abre o pagamento
    if (document.getElementById('modal-carrinho').classList.contains('hidden') && carrinho.length > 0) {
        abrirModalPagamento();
    }
}

function atualizarBarraUsuario() {
    const areaUsuario = document.getElementById('area-usuario');
    const labelUsuario = document.getElementById('nome-usuario-logado');
    const btnLoginClienteHeader = document.getElementById('btn-login-cliente-header');

    if (modoAtual === 'admin' && adminLogado) {
        areaUsuario.classList.remove('hidden');
        labelUsuario.innerText = 'Admin: ' + adminLogado.usuario;
        btnLoginClienteHeader.classList.add('hidden');
    } else if (modoAtual === 'cliente' && usuarioLogado) {
        areaUsuario.classList.remove('hidden');
        labelUsuario.innerText = usuarioLogado.nome;
        btnLoginClienteHeader.classList.add('hidden');
    } else {
        areaUsuario.classList.add('hidden');
        if (modoAtual === 'cliente') {
            btnLoginClienteHeader.classList.remove('hidden');
        } else {
            btnLoginClienteHeader.classList.add('hidden');
        }
    }
}

function realizarLogout() {
    if (modoAtual === 'admin') {
        adminLogado = null;
        localStorage.removeItem('cyber_admin');
        alternarModo('cliente');
    } else {
        usuarioLogado = null;
        localStorage.removeItem('cyber_usuario');
        atualizarBarraUsuario();
    }
}

// ==========================================
// 2. ALTERNAR MODO ADMIN / CLIENTE
// ==========================================
function alternarModo(novoModo) {
    if (novoModo === 'admin' && !adminLogado) {
        document.getElementById('modal-login-admin').classList.remove('hidden');
        return;
    }

    modoAtual = novoModo;
    const btnCliente = document.getElementById('btn-modo-cliente');
    const btnAdmin = document.getElementById('btn-modo-admin');
    const painelBar = document.getElementById('painel-admin-bar');

    if (novoModo === 'admin') {
        btnAdmin.className = 'px-3 py-1.5 rounded-md bg-white text-black transition';
        btnCliente.className = 'px-3 py-1.5 rounded-md text-neutral-400 hover:text-white transition';
        painelBar.classList.remove('hidden');
    } else {
        btnCliente.className = 'px-3 py-1.5 rounded-md bg-white text-black transition';
        btnAdmin.className = 'px-3 py-1.5 rounded-md text-neutral-400 hover:text-white transition';
        painelBar.classList.add('hidden');
    }

    atualizarBarraUsuario();
    renderizarGrid(produtosGlobais);
}

function fecharModalLoginAdmin() {
    document.getElementById('modal-login-admin').classList.add('hidden');
}

function realizarLoginAdmin(event) {
    event.preventDefault();
    const user = document.getElementById('admin-user').value;
    const pass = document.getElementById('admin-pass').value;

    if ((user === 'admin' || user === 'admin@cybermarket.com') && pass === 'admin123') {
        adminLogado = { usuario: 'Administrador' };
        localStorage.setItem('cyber_admin', JSON.stringify(adminLogado));

        fecharModalLoginAdmin();
        alternarModo('admin');
    } else {
        alert('Credenciais incorretas! Tente usuário: admin e senha: admin123');
    }
}

// ==========================================
// 3. CARREGAR CATÁLOGO & SELEÇÃO DE TAMANHO
// ==========================================
function obterDetalhesProduto(nome) {
    const nomeLower = nome.toLowerCase();

    if (nomeLower.includes('manga longa') || nomeLower.includes('longa')) {
        return { categoria: 'manga-longa', imagem: IMAGENS_PADRAO['manga-longa'] };
    } else if (nomeLower.includes('jeans') || nomeLower.includes('calça') || nomeLower.includes('calca')) {
        return { categoria: 'calca', imagem: IMAGENS_PADRAO['calca'] };
    } else if (nomeLower.includes('manga curta') || nomeLower.includes('camiseta') || nomeLower.includes('camisa')) {
        return { categoria: 'manga-curta', imagem: IMAGENS_PADRAO['manga-curta'] };
    }
    return { categoria: 'outros', imagem: IMAGENS_PADRAO['default'] };
}

async function carregarProdutos() {
    const totalLabel = document.getElementById('total-produtos-label');

    try {
        const resposta = await fetch(`${API_URL}/produtos`);
        if (!resposta.ok) throw new Error('Erro na requisição');

        produtosGlobais = await resposta.json();
        totalLabel.innerText = `${produtosGlobais.length} itens encontrados`;

        renderizarGrid(produtosGlobais);

    } catch (erro) {
        console.error('Erro:', erro);
        totalLabel.innerText = 'Erro de comunicação';
        document.getElementById('grid-produtos').innerHTML = `<p class="col-span-full text-center text-rose-500 py-10 text-xs uppercase tracking-widest">Erro ao conectar com a API /produtos.</p>`;
    }
}

function selecionarTamanho(idProd, tamanho, elemento) {
    tamanhoSelecionadoPorProduto[idProd] = tamanho;

    // Destaca o botão selecionado
    const container = elemento.parentElement;
    container.querySelectorAll('button').forEach(btn => {
        btn.className = "text-[10px] font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded hover:border-neutral-500 transition";
    });
    elemento.className = "text-[10px] font-bold text-black bg-white border border-white px-2.5 py-1 rounded transition shadow-sm";
}

function renderizarGrid(produtos) {
    const grid = document.getElementById('grid-produtos');
    grid.innerHTML = '';

    const busca = document.getElementById('campo-busca')?.value.toLowerCase() || '';

    const produtosFiltrados = produtos.filter(prod => {
        const nome = (prod.nome || prod.descricao || '').toLowerCase();
        const detalhes = obterDetalhesProduto(nome);

        const bateCategoria = categoriaAtiva === 'todos' || detalhes.categoria === categoriaAtiva;
        const bateBusca = nome.includes(busca);

        return bateCategoria && bateBusca;
    });

    if (produtosFiltrados.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center text-neutral-500 py-12 text-xs uppercase tracking-widest">Nenhuma peça encontrada.</p>`;
        return;
    }

    produtosFiltrados.forEach(prod => {
        const idProd = prod.id || prod._id;
        const nomeProd = prod.nome || prod.descricao || 'Peça Streetwear';
        const precoProd = Number(prod.preco || prod.valor || 0);
        
        const detalhes = obterDetalhesProduto(nomeProd);
        const imagemUrl = (prod.imagem && prod.imagem.trim() !== '') ? prod.imagem : detalhes.imagem;

        const card = document.createElement('div');
        card.className = 'bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden flex flex-col group hover:border-neutral-600 transition duration-300';

        card.innerHTML = `
            <div class="h-80 overflow-hidden relative bg-black">
                <img src="${imagemUrl}" alt="${nomeProd}" onerror="this.src='${detalhes.imagem}'" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100">
                <span class="absolute top-3 right-3 bg-black/80 text-white text-[11px] font-black px-2.5 py-1 rounded border border-neutral-800">
                    R$ ${precoProd.toFixed(2)}
                </span>
            </div>

            <div class="p-5 flex flex-col flex-grow justify-between border-t border-neutral-800/80">
                <div>
                    <h4 class="font-bold text-white text-sm uppercase tracking-wide mb-1">${nomeProd}</h4>
                    
                    <!-- Botões Obrigatórios de Escolha de Tamanho -->
                    <div class="mt-3 mb-4">
                        <span class="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1.5">Escolha o Tamanho:</span>
                        <div class="flex items-center gap-1.5">
                            <button type="button" onclick="selecionarTamanho('${idProd}', 'P', this)" class="text-[10px] font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded hover:border-neutral-500 transition">P</button>
                            <button type="button" onclick="selecionarTamanho('${idProd}', 'M', this)" class="text-[10px] font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded hover:border-neutral-500 transition">M</button>
                            <button type="button" onclick="selecionarTamanho('${idProd}', 'G', this)" class="text-[10px] font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded hover:border-neutral-500 transition">G</button>
                            <button type="button" onclick="selecionarTamanho('${idProd}', 'GG', this)" class="text-[10px] font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded hover:border-neutral-500 transition">GG</button>
                        </div>
                    </div>
                </div>

                ${modoAtual === 'cliente' ? `
                    <button onclick="adicionarAoCarrinho('${idProd}', '${nomeProd}', ${precoProd}, '${imagemUrl}')" 
                            class="w-full bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-widest py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                        <i class="fa-solid fa-plus"></i> Adicionar
                    </button>
                ` : `
                    <div class="flex gap-2">
                        <button onclick="prepararEdicao('${idProd}', '${nomeProd}', ${precoProd}, '${imagemUrl}')" 
                                class="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-bold uppercase tracking-wider py-2 rounded-lg transition">
                            Editar
                        </button>
                        <button onclick="excluirProduto('${idProd}')" 
                                class="flex-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 text-xs font-bold uppercase tracking-wider py-2 rounded-lg transition">
                            Excluir
                        </button>
                    </div>
                `}
            </div>
        `;
        grid.appendChild(card);
    });
}

function filtrarCategoria(cat) {
    categoriaAtiva = cat;
    document.querySelectorAll('.btn-categoria').forEach(btn => {
        if (btn.dataset.cat === cat) {
            btn.className = 'btn-categoria px-4 py-2 rounded-lg bg-white text-black border border-white transition';
        } else {
            btn.className = 'btn-categoria px-4 py-2 rounded-lg bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white transition';
        }
    });
    renderizarGrid(produtosGlobais);
}

function filtrarPorBusca() {
    renderizarGrid(produtosGlobais);
}

// ==========================================
// 4. CARRINHO COM TAMANHO SELECIONADO
// ==========================================
function adicionarAoCarrinho(id, nome, preco, imagem) {
    const tamanho = tamanhoSelecionadoPorProduto[id];

    // Validação de Tamanho
    if (!tamanho) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'ESCOLHA O TAMANHO',
                text: 'Por favor, selecione um tamanho (P, M, G, GG) antes de adicionar.',
                background: '#0a0a0a',
                color: '#fff',
                confirmButtonColor: '#ffffff'
            });
        } else {
            alert('Por favor, selecione um tamanho (P, M, G, GG) antes de adicionar.');
        }
        return;
    }

    const itemExistente = carrinho.find(item => item.id === id && item.tamanho === tamanho);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ id, nome, preco: Number(preco), imagem, tamanho, quantidade: 1 });
    }

    salvarCarrinho();
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `Adicionado! Tam: ${tamanho}`,
            showConfirmButton: false,
            timer: 1200,
            background: '#0a0a0a',
            color: '#fff'
        });
    }
}

function salvarCarrinho() {
    localStorage.setItem('cyber_carrinho', JSON.stringify(carrinho));
    atualizarBadgeCarrinho();
}

function atualizarBadgeCarrinho() {
    const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
    document.getElementById('badge-carrinho').innerText = totalItens;
}

function abrirModalCarrinho() {
    const lista = document.getElementById('lista-carrinho');
    const totalEl = document.getElementById('valor-total-carrinho');
    lista.innerHTML = '';

    if (carrinho.length === 0) {
        lista.innerHTML = '<p class="text-center text-neutral-500 py-8 text-xs uppercase tracking-widest">Carrinho Vazio</p>';
        totalEl.innerText = 'R$ 0,00';
    } else {
        let total = 0;
        carrinho.forEach((item, index) => {
            const subtotal = item.preco * item.quantidade;
            total += subtotal;

            lista.innerHTML += `
                <div class="flex items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                    <img src="${item.imagem}" class="w-12 h-14 object-cover rounded bg-black">
                    <div class="flex-grow">
                        <div class="flex items-center gap-2">
                            <h5 class="font-bold text-xs uppercase text-white">${item.nome}</h5>
                            <span class="bg-neutral-900 border border-neutral-800 text-[9px] font-bold px-1.5 py-0.5 rounded text-neutral-300">Tam: ${item.tamanho}</span>
                        </div>
                        <p class="text-[10px] text-neutral-500 mt-0.5">R$ ${item.preco.toFixed(2)} x ${item.quantidade}</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="font-bold text-xs text-white">R$ ${subtotal.toFixed(2)}</span>
                        <button onclick="removerDoCarrinho(${index})" class="text-neutral-500 hover:text-rose-500 text-xs"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        totalEl.innerText = `R$ ${total.toFixed(2)}`;
    }

    document.getElementById('modal-carrinho').classList.remove('hidden');
}

function fecharModalCarrinho() {
    document.getElementById('modal-carrinho').classList.add('hidden');
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    salvarCarrinho();
    abrirModalCarrinho();
}

function iniciarCheckout() {
    if (carrinho.length === 0) return;
    fecharModalCarrinho();

    // Requisito: Se não estiver logado, abre a identificação do cliente
    if (!usuarioLogado) {
        abrirModalAuthCliente();
    } else {
        abrirModalPagamento();
    }
}

// ==========================================
// 5. MODAL DE PAGAMENTO (PIX / CARTÃO)
// ==========================================
function abrirModalPagamento() {
    document.getElementById('modal-pagamento').classList.remove('hidden');
}

function fecharModalPagamento() {
    document.getElementById('modal-pagamento').classList.add('hidden');
}

function selecionarMetodoPagamento(metodo) {
    metodoPagamentoSelecionado = metodo;
    const btnPix = document.getElementById('btn-pag-pix');
    const btnCartao = document.getElementById('btn-pag-cartao');
    const areaPix = document.getElementById('area-pag-pix');
    const areaCartao = document.getElementById('area-pag-cartao');

    if (metodo === 'pix') {
        btnPix.className = "border-2 border-white bg-neutral-900 p-4 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition";
        btnCartao.className = "border border-neutral-800 bg-neutral-950 p-4 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition";
        areaPix.classList.remove('hidden');
        areaCartao.classList.add('hidden');
    } else {
        btnCartao.className = "border-2 border-white bg-neutral-900 p-4 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition";
        btnPix.className = "border border-neutral-800 bg-neutral-950 p-4 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition";
        areaCartao.classList.remove('hidden');
        areaPix.classList.add('hidden');
    }
}

function copiarPix() {
    const chave = "00020126580014br.gov.bcb.pix0136cybermarket-chavedetestepix-20265204000053039865405100.005802BR5916CYBERMARKET_LOJA6008RECIFE62070503***6304E2CA";
    navigator.clipboard.writeText(chave);
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Chave PIX Copiada!',
            showConfirmButton: false,
            timer: 1200,
            background: '#0a0a0a',
            color: '#fff'
        });
    }
}

async function confirmarEFinalizarPedido() {
    fecharModalPagamento();
    finalizarPedidoAPI();
}

async function finalizarPedidoAPI() {
    try {
        const resposta = await fetch(`${API_URL}/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cliente: usuarioLogado,
                itens: carrinho,
                metodoPagamento: metodoPagamentoSelecionado,
                total: carrinho.reduce((sum, i) => sum + (i.preco * i.quantidade), 0)
            })
        });

        if (!resposta.ok) throw new Error('Erro no servidor');

        carrinho = [];
        salvarCarrinho();

        Swal.fire({
            icon: 'success',
            title: 'PAGAMENTO E PEDIDO CONFIRMADOS!',
            text: `Obrigado, ${usuarioLogado.nome}! Recebemos o seu pagamento via ${metodoPagamentoSelecionado.toUpperCase()}.`,
            background: '#0a0a0a',
            color: '#fff',
            confirmButtonColor: '#ffffff'
        });

    } catch (erro) {
        alert('Não foi possível registrar o pedido na API.');
    }
}

// ==========================================
// 6. PAINEL ADMIN (CADASTRAR / EDITAR / EXCLUIR)
// ==========================================
function abrirModalNovoProduto() {
    document.getElementById('modal-produto-titulo').innerText = 'Novo Item';
    document.getElementById('form-produto-admin').reset();
    document.getElementById('admin-prod-id').value = '';
    document.getElementById('modal-produto-admin').classList.remove('hidden');
}

function fecharModalProdutoAdmin() {
    document.getElementById('modal-produto-admin').classList.add('hidden');
}

function prepararEdicao(id, nome, preco, imagem) {
    document.getElementById('modal-produto-titulo').innerText = 'Editar Item';
    document.getElementById('admin-prod-id').value = id;
    document.getElementById('admin-prod-nome').value = nome;
    document.getElementById('admin-prod-preco').value = preco;
    document.getElementById('admin-prod-imagem').value = imagem;
    document.getElementById('modal-produto-admin').classList.remove('hidden');
}

async function salvarProdutoAdmin(event) {
    event.preventDefault();
    const id = document.getElementById('admin-prod-id').value;
    const nome = document.getElementById('admin-prod-nome').value;
    const preco = parseFloat(document.getElementById('admin-prod-preco').value);
    let imagem = document.getElementById('admin-prod-imagem').value.trim();

    if (imagem.includes('imgur.com') && !imagem.includes('i.imgur.com')) {
        const imgurId = imagem.split('/').pop().split('.')[0];
        imagem = `https://i.imgur.com/${imgurId}.jpg`;
    }

    const payload = { nome, preco, imagem };
    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/produtos/${id}` : `${API_URL}/produtos`;

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!resposta.ok) throw new Error('Falha ao salvar produto');

        fecharModalProdutoAdmin();
        carregarProdutos();

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'SALVO',
                text: 'Item gravado com sucesso no catálogo!',
                background: '#0a0a0a',
                color: '#fff',
                confirmButtonColor: '#ffffff'
            });
        }

    } catch (erro) {
        alert('Erro ao salvar item.');
    }
}

async function excluirProduto(id) {
    if (confirm('Excluir peça do catálogo?')) {
        try {
            const resposta = await fetch(`${API_URL}/produtos/${id}`, { method: 'DELETE' });
            if (!resposta.ok) throw new Error('Erro ao excluir');

            carregarProdutos();

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'EXCLUÍDO',
                    text: 'Item removido do catálogo!',
                    background: '#0a0a0a',
                    color: '#fff',
                    confirmButtonColor: '#ffffff'
                });
            }

        } catch (erro) {
            alert('Erro ao excluir item.');
        }
    }
}