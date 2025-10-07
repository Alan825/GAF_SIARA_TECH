document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    carregarNotasFiscais();
});

async function carregarNotasFiscais() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:64235/notas', {
            headers: {
                'Authorization': token
            }
        });

        if (response.ok) {
            const notas = await response.json();
            renderizarNotas(notas);
            gerarGraficos(notas);
        } else if (response.status === 401) {
            alert("Sua sessão expirou. Por favor, faça login novamente.");
            window.location.href = 'login.html';
        } else {
            alert("Erro ao carregar notas fiscais.");
            console.error('Erro:', response.statusText);
        }
    } catch (error) {
        console.error('Erro ao carregar notas fiscais:', error);
        alert('Erro de conexão com o servidor. Tente novamente mais tarde.');
    }
}

function renderizarNotas(notas) {
    const tabelaBody = document.getElementById('tabelaNotasBody');
    tabelaBody.innerHTML = '';
    notas.forEach(nota => {
        const tr = document.createElement('tr');
        const dataFormatada = new Date(nota.createdAt).toLocaleDateString('pt-BR');
        tr.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${nota.nomeComprador}</td>
            <td>R$ ${nota.valorTotal.toFixed(2)}</td>
            <td><button onclick="downloadNota(${nota.id})">Download</button></td>
        `;
        tabelaBody.appendChild(tr);
    });
}

function gerarGraficos(notas) {
    const vendasPorDia = notas.reduce((acc, nota) => {
        const data = new Date(nota.createdAt).toLocaleDateString('pt-BR');
        acc[data] = (acc[data] || 0) + nota.valorTotal;
        return acc;
    }, {});

    const labels = Object.keys(vendasPorDia).sort();
    const data = labels.map(label => vendasPorDia[label]);
    
    const ctx = document.getElementById('vendasChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas Totais por Dia (R$)',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function downloadNota(notaId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:64235/get-nota/${notaId}`, {
            headers: {
                'Authorization': token
            }
        });
        const nota = await response.json();

        if (response.ok) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            let y = 20;

            doc.setFontSize(18);
            doc.text('NOTA FISCAL', 105, y, null, null, 'center');
            y += 10;
            
            const dataNota = new Date(nota.createdAt).toLocaleDateString('pt-BR');
            doc.setFontSize(11);
            doc.text(`Data: ${dataNota}`, 105, y, null, null, 'center');
            y += 15;
            
            doc.setFontSize(12);
            doc.text(`Comprador: ${nota.nomeComprador}`, 10, y);
            y += 8;
            doc.text(`Produtor: ${nota.nomeProdutor}`, 10, y);
            y += 15;

            doc.text('Itens:', 10, y);
            y += 8;

            const itens = JSON.parse(nota.itens);
            itens.forEach(item => {
                const linha = `${item.nome} - ${item.quantidade} und - R$ ${item.preco.toFixed(2)}`;
                doc.text(linha, 10, y);
                y += 8;
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
            });

            y += 10;
            doc.setFontSize(14);
            doc.text(`Total: R$ ${nota.valorTotal.toFixed(2)}`, 10, y);

            doc.save(`comprovante_${notaId}.pdf`);
        } else if (response.status === 401) {
            alert("Sua sessão expirou. Por favor, faça login novamente.");
            window.location.href = 'login.html';
        } else {
            alert('Erro ao baixar nota fiscal. Tente novamente mais tarde.');
        }
    } catch (error) {
        console.error('Erro ao baixar nota fiscal:', error);
        alert('Erro ao baixar nota fiscal. Tente novamente mais tarde.');
    }
}