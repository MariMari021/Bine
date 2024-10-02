let currentAction = null; // Variável para rastrear a ação atual

const chat = document.getElementById('chat');
const messageInput = document.getElementById('message-input');
const encryptBtn = document.getElementById('encrypt-btn');
const historyBtn = document.getElementById('history-btn');
const sendMessageBtn = document.getElementById('send-message');
const result = document.getElementById('result');
const encryptedMessage = document.getElementById('encrypted-message');
const historySection = document.getElementById('history');
const historyList = document.getElementById('history-list');

// Função para adicionar mensagem ao chat
function addChatMessage(message) {
    const msgElement = document.createElement('div');
    msgElement.textContent = message;
    chat.appendChild(msgElement);
}

// Iniciar a conversa
addChatMessage('Deseja criptografar uma mensagem ou ver o histórico?');

// Lidar com o botão de criptografar
encryptBtn.addEventListener('click', () => {
    currentAction = 'encrypt'; // Define a ação atual como 'encrypt'
    messageInput.style.display = 'block'; // Mostra o campo de mensagem
    result.style.display = 'none'; // Esconde o resultado
    historySection.style.display = 'none'; // Esconde o histórico
    addChatMessage('Você escolheu criptografar uma mensagem. Digite sua mensagem abaixo:');
});

// Lidar com o botão de ver histórico
historyBtn.addEventListener('click', async () => {
    currentAction = 'history'; // Define a ação atual como 'history'
    messageInput.style.display = 'none'; // Esconde o campo de mensagem
    result.style.display = 'none'; // Esconde o resultado
    historySection.style.display = 'block'; // Mostra o histórico
    addChatMessage('Você escolheu ver o histórico.');

    // Busca o histórico
    try {
        const response = await fetch('http://localhost:3000/history');
        if (response.ok) {
            const history = await response.json();
            historyList.innerHTML = ''; // Limpa a lista antes de adicionar novos itens

            history.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `IV: ${item.iv}, Criptografada: ${item.encryptedData}, Timestamp: ${item.timestamp}`;
                historyList.appendChild(li);
            });
        } else {
            addChatMessage('Erro ao obter histórico.');
        }
    } catch (error) {
        addChatMessage('Erro ao conectar-se ao servidor.');
    }
});

// Lidar com o envio de mensagem
sendMessageBtn.addEventListener('click', async () => {
    const message = document.getElementById('message').value;

    if (!currentAction) {
        addChatMessage('Opção inválida. Deseja criptografar uma mensagem ou ver o histórico?');
        return;
    }

    if (currentAction === 'encrypt') {
        try {
            const response = await fetch('http://localhost:3000/encrypt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }), // Envia a mensagem no formato JSON
            });

            const data = await response.json();

            if (response.ok) {
                encryptedMessage.textContent = `
                    IV: ${data.iv}
                    Mensagem Criptografada: ${data.encryptedData}
                `;
                result.style.display = 'block'; // Mostra o resultado
                addChatMessage('Mensagem criptografada com sucesso!');
            } else {
                encryptedMessage.textContent = `Erro: ${data.error}`;
                result.style.display = 'block'; // Mostra o erro
            }
        } catch (error) {
            encryptedMessage.textContent = 'Erro ao conectar-se ao servidor';
            result.style.display = 'block'; // Mostra o erro
        }
    } else {
        // Se a ação atual for 'history', exibe uma mensagem de erro
        addChatMessage('Opção inválida. Deseja criptografar uma mensagem ou ver o histórico?');
    }
    
    // Limpa o campo de mensagem
    document.getElementById('message').value = '';
});
