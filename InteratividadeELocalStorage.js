// Recupera o carrinho salvo no navegador ou inicia uma lista vazia
function obterCarrinho() {
    return JSON.parse(localStorage.getItem('carrinhoKaTech')) || [];
}

// Salva o carrinho atualizado no LocalStorage e atualiza o contador do topo
function salvarCarrinho(carrinho) {
    localStorage.setItem('carrinhoKaTech', JSON.stringify(carrinho));
    atualizarContador();
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
    alert(`"${nome}" foi adicionado ao seu carrinho!`);
}

// Renderizar os itens na página carrinho.html
function renderizarCarrinho() {
    const listaEl = document.getElementById('lista-carrinho');
    const vazioEl = document.getElementById('carrinho-vazio');
    const resumoEl = document.getElementById('resumo-carrinho');
    const totalEl = document.getElementById('valor-total');

    // Só executa se estiver na página carrinho.html
    if (!listaEl) return;

    const carrinho = obterCarrinho();
    listaEl.innerHTML = '';

    // Exibe mensagem se o carrinho estiver vazio
    if (carrinho.length === 0) {
        vazioEl.style.display = 'block';
        resumoEl.style.display = 'none';
        return;
    }

    vazioEl.style.display = 'none';
    resumoEl.style.display = 'block';

    let valorTotalCompra = 0;

    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        valorTotalCompra += subtotal;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-carrinho';
        itemDiv.innerHTML = `
            <div class="item-info">
                <img src="${item.imagem}" alt="${item.nome}">
                <div>
                    <h3>${item.nome}</h3>
                    <p>Preço unitário: ${formatarMoeda(item.preco)}</p>
                </div>
            </div>

            <div class="controles-qtd">
                <button onclick="alterarQuantidade(${item.id}, -1)">-</button>
                <span><strong>${item.quantidade}</strong></span>
                <button onclick="alterarQuantidade(${item.id}, 1)">+</button>
            </div>

            <div>
                <p>Subtotal:</p>
                <strong>${formatarMoeda(subtotal)}</strong>
            </div>

            <button class="btn-remover" onclick="removerProduto(${item.id})">Remover</button>
        `;
        listaEl.appendChild(itemDiv);
    });

    totalEl.textContent = formatarMoeda(valorTotalCompra);
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
}

// Finalizar compra
function finalizarCompra() {
    alert('Pedido finalizado com sucesso! Obrigado por comprar na KaTech!');
    localStorage.removeItem('carrinhoKaTech');
    atualizarContador();
    renderizarCarrinho();
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
document.addEventListener('DOMContentLoaded', () => {
    atualizarContador();
    renderizarCarrinho();
});