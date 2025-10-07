const produtos = [
  {"nome": "Abóbora", "preco": 3.5}, 
  {"nome": "Abobrinha", "preco": 20.0}, 
  {"nome": "Acelga", "preco": 20.0}, 
  {"nome": "Alface", "preco": 10.0}, 
  {"nome": "Aipim (Macaxeira)", "preco": 25.0}, 
  {"nome": "Alho", "preco": 185.0}, 
  {"nome": "Batata Inglesa", "preco": 50.0}, 
  {"nome": "Batata Doce", "preco": 45.0}, 
  {"nome": "Berinjela", "preco": 20.0}, 
  {"nome": "Beterraba", "preco": 70.0}, 
  {"nome": "Brócolis", "preco": 30.0}, 
  {"nome": "Cebola", "preco": 35.0}, 
  {"nome": "Cenoura", "preco": 70.0}, 
  {"nome": "Cheiro Verde", "preco": 5.0}, 
  {"nome": "Chuchu", "preco": 15.0}, 
  {"nome": "Couve-Flor", "preco": 35.0}, 
  {"nome": "Cebolinha", "preco": 5.0}, 
  {"nome": "Espinafre", "preco": 0.5}, 
  {"nome": "Fava Verde", "preco": 90.0}, 
  {"nome": "Feijão Verde", "preco": 30.0}, 
  {"nome": "Jiló", "preco": 25.0}, 
  {"nome": "Maxixe", "preco": 25.0}, 
  {"nome": "Milho Verde", "preco": 25.0}, 
  {"nome": "Pimentão", "preco": 30.0}, 
  {"nome": "Pimenta", "preco": 25.0}, 
  {"nome": "Rabanete", "preco": 5.0}, 
  {"nome": "Repolho", "preco": 60.0}, 
  {"nome": "Salsinha", "preco": 5.0}, 
  {"nome": "Tomate", "preco": 80.0}, 
  {"nome": "Vagem", "preco": 30.0}];

const carrinho = Array(produtos.length).fill(0);
const produtosContainer = document.getElementById('produtos');
const listaNota = document.getElementById('listaNota');
const valorTotalSpan = document.getElementById('valorTotal');
const downloadBtn = document.getElementById('downloadBtn');

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Você não está logado. Redirecionando para a página de login.");
        window.location.href = 'login.html';
    } else {
        renderProdutos();
    }
});

downloadBtn.addEventListener('click', finalizarCompra);

function renderProdutos() {
  const container = document.getElementById('produtos');
  container.innerHTML = '';
  produtos.forEach((produto, i) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <h3>${produto.nome}</h3>
      <p>Preço médio: R$ ${produto.preco.toFixed(2)}</p>
      <div class="controls">
        <button onclick="alterarQuantidade(${i}, -1)">-</button>
        <input 
          type="number" min="0" value="${carrinho[i]}" 
          id="input-qtd-${i}" 
          oninput="alterarQuantidadeInput(${i}, this.value)" 
        />
        <button onclick="alterarQuantidade(${i}, 1)">+</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function alterarQuantidade(index, delta) {
  carrinho[index] = Math.max(0, carrinho[index] + delta);
  document.getElementById(`input-qtd-${index}`).value = carrinho[index];
  atualizarNotaFiscal();
}

function alterarQuantidadeInput(index, valor) {
  let qtd = parseInt(valor);
  if (isNaN(qtd) || qtd < 0) qtd = 0;
  carrinho[index] = qtd;
  document.getElementById(`input-qtd-${index}`).value = qtd;
  atualizarNotaFiscal();
}

function atualizarNotaFiscal() {
  const lista = document.getElementById('listaNota');
  const valorTotalSpan = document.getElementById('valorTotal');
  lista.innerHTML = '';
  let total = 0;

  produtos.forEach((produto, i) => {
    if (carrinho[i] > 0) {
      const li = document.createElement('li');
      const subtotal = produto.preco * carrinho[i];
      total += subtotal;
      li.innerText = `${produto.nome} - ${carrinho[i]} und - R$ ${subtotal.toFixed(2)}`;
      lista.appendChild(li);
    }
  });

  valorTotalSpan.innerText = total.toFixed(2);
}

async function finalizarCompra() {
  const nomeComprador = document.getElementById('nomeComprador').value;
  const nomeProdutor = document.getElementById('nomeProdutor').value;
  const valorTotal = parseFloat(valorTotalSpan.innerText);

  const token = localStorage.getItem('token');
  if (!token) {
      alert("Você precisa estar logado para salvar a nota fiscal.");
      return;
  }

  if (!nomeComprador || !nomeProdutor || valorTotal === 0) {
      alert("Por favor, preencha o nome do comprador, do produtor e adicione itens ao carrinho.");
      return;
  }

  const itensDaNota = [];
  produtos.forEach((produto, i) => {
      if (carrinho[i] > 0) {
          itensDaNota.push({
              nome: produto.nome,
              quantidade: carrinho[i],
              preco: produto.preco
          });
      }
  });

  try {
      const response = await fetch('http://localhost:64235/salvar-nota', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': token
          },
          body: JSON.stringify({
              nomeComprador,
              nomeProdutor,
              valorTotal,
              itens: JSON.stringify(itensDaNota)
          })
      });

      const data = await response.json();

      if (response.ok) {
          alert(data.mensagem);
          
          carrinho.fill(0);
          atualizarNotaFiscal();
          document.getElementById('nomeComprador').value = '';
          document.getElementById('nomeProdutor').value = '';

      } else {
          alert(data.mensagem);
      }

  } catch (error) {
      console.error('Erro ao salvar nota fiscal:', error);
      alert('Erro de conexão com o servidor. Tente novamente mais tarde.');
  }
}

renderProdutos();