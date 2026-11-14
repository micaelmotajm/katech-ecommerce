let urlJaLida = false;

// Lê o carrinho passado na URL (#cart=...) apenas uma vez ao abrir a página
function lerCarrinhoDaURL() {
    if (urlJaLida) return null;
    urlJaLida = true;

    const hash = window.location.hash;
    if (hash && hash.startsWith('#cart=')) {
        try {
            const dados = decodeURIComponent(hash.substring(6));
            const itens = JSON.parse(dados);
            if (Array.isArray(itens)) {
                localStorage.setItem('carrinhoKaTech', JSON.stringify(itens));
                return itens;
            }
        } catch (e) {}
    }
    return null;
}

// Recupera o carrinho salvo no LocalStorage
function obterCarrinho() {
    const daUrl = lerCarrinhoDaURL();
    if (daUrl !== null) {
        return daUrl;
    }

    try {
        return JSON.parse(localStorage.getItem('carrinhoKaTech')) || [];
    } catch (e) {
        return [];
    }
}

// Mantém os links entre index.html e carrinho.html sincronizados com o carrinho atual
function sincronizarLinks(carrinho) {
    const hashCart = '#cart=' + encodeURIComponent(JSON.stringify(carrinho));
    document.querySelectorAll('a[href^="index.html"], a[href^="carrinho.html"]').forEach(link => {
        const baseHref = link.getAttribute('href').split('#')[0];
        link.setAttribute('href', baseHref + hashCart);
    });
}

// Salva o carrinho atualizado no LocalStorage e atualiza a interface
function salvarCarrinho(carrinho) {
    localStorage.setItem('carrinhoKaTech', JSON.stringify(carrinho));
    atualizarContador();
    sincronizarLinks(carrinho);
}

// Formata números para o padrão brasileiro (R$ 0,00)
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Atualiza o número de itens ao lado do ícone do carrinho no menu
function atualizarContador() {
    const carrinho = obterCarrinho();
    const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    const badge = document.getElementById('contador-carrinho');
    if (badge) {
        badge.textContent = totalItens;
    }
}

// Atualiza a contagem de produtos nos botões Todos, Hardware e Periféricos
function atualizarContadoresCategorias() {
    const cards = document.querySelectorAll('.card-produto');
    if (!cards.length) return;

    const total = cards.length;
    let hardware = 0;
    let perifericos = 0;

    cards.forEach(card => {
        if (card.dataset.categoria === 'hardware') hardware++;
        if (card.dataset.categoria === 'perifericos') perifericos++;
    });

    document.querySelectorAll('.btn-filtro').forEach(btn => {
        const acao = btn.getAttribute('onclick') || '';
        if (acao.includes("'todos'")) btn.textContent = `Todos (${total})`;
        if (acao.includes("'hardware'")) btn.textContent = `Hardware (${hardware})`;
        if (acao.includes("'perifericos'")) btn.textContent = `Periféricos (${perifericos})`;
    });
}

// Exibe notificação flutuante no canto da tela
function mostrarNotificacao(mensagem, mostrarLinkCarrinho = false) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <span>${mensagem}</span>
        ${mostrarLinkCarrinho ? '<a href="carrinho.html">Ver carrinho →</a>' : ''}
    `;

    container.appendChild(toast);
    sincronizarLinks(obterCarrinho());

    setTimeout(() => {
        toast.remove();
    }, 3200);
}

// Adicionar produto ao carrinho (usado na index.html)
function adicionarAoCarrinho(id, nome, preco, imagem) {
    const carrinho = obterCarrinho();
    const itemExistente = carrinho.find(produto => produto.id === id);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            id: id,
            nome: nome,
            preco: preco,
            imagem: imagem,
            quantidade: 1
        });
    }

    salvarCarrinho(carrinho);
    mostrarNotificacao(`<strong>${nome}</strong> adicionado ao carrinho.`, true);
}

// Renderizar os itens na página carrinho.html
function renderizarCarrinho() {
    const listaEl = document.getElementById('lista-carrinho');
    const vazioEl = document.getElementById('carrinho-vazio');
    const conteudoEl = document.getElementById('carrinho-conteudo');
    const totalEl = document.getElementById('valor-total');
    const qtdResumoEl = document.getElementById('qtd-itens-resumo');

    if (!listaEl) return;

    const carrinho = obterCarrinho();
    listaEl.innerHTML = '';

    if (carrinho.length === 0) {
        vazioEl.style.display = 'block';
        conteudoEl.style.display = 'none';
        return;
    }

    vazioEl.style.display = 'none';
    conteudoEl.style.display = 'grid';

    let valorTotalCompra = 0;
    let quantidadeTotalItens = 0;

    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        valorTotalCompra += subtotal;
        quantidadeTotalItens += item.quantidade;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-carrinho';
        itemDiv.innerHTML = `
            <div class="item-info">
                <img src="${item.imagem}" alt="${item.nome}">
                <div>
                    <h3>${item.nome}</h3>
                    <p>Unitário: ${formatarMoeda(item.preco)}</p>
                </div>
            </div>

            <div class="controles-qtd">
                <button onclick="alterarQuantidade(${item.id}, -1)" aria-label="Diminuir">-</button>
                <span><strong>${item.quantidade}</strong></span>
                <button onclick="alterarQuantidade(${item.id}, 1)" aria-label="Aumentar">+</button>
            </div>

            <div class="subtotal-item">
                <p>Subtotal</p>
                <strong>${formatarMoeda(subtotal)}</strong>
            </div>

            <button class="btn-remover" onclick="removerProduto(${item.id})" aria-label="Remover produto">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                    <path d="M10 11v6"></path>
                    <path d="M14 11v6"></path>
                </svg>
                <span>Remover</span>
            </button>
        `;
        listaEl.appendChild(itemDiv);
    });

    totalEl.textContent = formatarMoeda(valorTotalCompra);
    if (qtdResumoEl) {
        qtdResumoEl.textContent = quantidadeTotalItens;
    }
}

// Alterar quantidade de um item (+1 ou -1)
function alterarQuantidade(id, delta) {
    let carrinho = obterCarrinho();
    const item = carrinho.find(produto => produto.id === id);

    if (item) {
        item.quantidade += delta;
        if (item.quantidade <= 0) {
            carrinho = carrinho.filter(produto => produto.id !== id);
        }
        salvarCarrinho(carrinho);
        renderizarCarrinho();
    }
}

// Remover produto completamente do carrinho
function removerProduto(id) {
    let carrinho = obterCarrinho();
    carrinho = carrinho.filter(produto => produto.id !== id);
    salvarCarrinho(carrinho);
    renderizarCarrinho();
    mostrarNotificacao('Item removido do carrinho.');
}

// Finalizar compra exibindo tela de confirmação e limpando os dados
function finalizarCompra() {
    salvarCarrinho([]);

    const conteudoEl = document.getElementById('carrinho-conteudo');
    const vazioEl = document.getElementById('carrinho-vazio');
    const finalizadoEl = document.getElementById('pedido-finalizado');

    if (conteudoEl) conteudoEl.style.display = 'none';
    if (vazioEl) vazioEl.style.display = 'none';
    if (finalizadoEl) finalizadoEl.style.display = 'block';
}

// Filtro por categoria e barra de busca (usado na index.html)
let categoriaAtual = 'todos';

function selecionarCategoria(categoria, botaoClicado) {
    categoriaAtual = categoria;

    document.querySelectorAll('.btn-filtro').forEach(btn => {
        btn.classList.remove('ativo');
    });
    botaoClicado.classList.add('ativo');

    filtrarProdutos();
}

function filtrarProdutos() {
    const campoBusca = document.getElementById('campo-busca');
    if (!campoBusca) return;

    const termo = campoBusca.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.card-produto');
    let visiveis = 0;

    cards.forEach(card => {
        const titulo = card.querySelector('h3').textContent.toLowerCase();
        const descricao = card.querySelector('.descricao').textContent.toLowerCase();
        const categoriaCard = card.dataset.categoria;

        const bateTexto = titulo.includes(termo) || descricao.includes(termo);
        const bateCategoria = categoriaAtual === 'todos' || categoriaCard === categoriaAtual;

        if (bateTexto && bateCategoria) {
            card.style.display = 'flex';
            visiveis++;
        } else {
            card.style.display = 'none';
        }
    });

    const aviso = document.getElementById('mensagem-sem-resultados');
    if (aviso) {
        aviso.style.display = visiveis === 0 ? 'block' : 'none';
    }
}

// Executa ao carregar qualquer uma das páginas
function inicializarLoja() {
    const carrinho = obterCarrinho();
    atualizarContador();
    atualizarContadoresCategorias();
    sincronizarLinks(carrinho);
    renderizarCarrinho();
}

document.addEventListener('DOMContentLoaded', inicializarLoja);