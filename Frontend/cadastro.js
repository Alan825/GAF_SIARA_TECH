document.getElementById('cadastroForm').addEventListener('submit', async function(event) {
  event.preventDefault(); // Impede o envio padrão do formulário

  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  try {
    const response = await fetch('http://localhost:3000/cadastro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nome, email, senha })
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.mensagem); // "Usuário cadastrado com sucesso!"
      window.location.href = 'login.html'; // Redireciona para a página de login
    } else {
      alert(data.mensagem); // "E-mail já cadastrado." ou "Erro ao cadastrar usuário."
    }

  } catch (error) {
    console.error('Erro na requisição:', error);
    alert('Erro de conexão com o servidor.');
  }
});