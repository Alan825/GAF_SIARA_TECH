document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.mensagem);
      // Salva o token de autenticação no armazenamento local
      localStorage.setItem('token', data.token); 
      window.location.href = 'index.html';
    } else {
      alert(data.mensagem);
    }

  } catch (error) {
    console.error('Erro na requisição:', error);
    alert('Erro de conexão com o servidor.');
  }
});