let currentAction = null; // Variável para rastrear a ação atual
let selectedMessageIndex = null; // Armazena o índice da mensagem selecionada para descriptografia

const chat = document.getElementById('chat');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message');

// Função para adicionar mensagem ao chat
function addChatMessage(message, type) {
    const msgElement = document.createElement('div');
    msgElement.textContent = message;
    msgElement.classList.add('message', type);
    chat.appendChild(msgElement);
    chat.scrollTop = chat.scrollHeight; // Rolagem automática para a mensagem mais recente
}

// Função para adicionar botões de ação
function addActionButtons() {
    const optionsElement = document.createElement('div');
    optionsElement.classList.add('options');

    const encryptBtn = document.createElement('button');
    encryptBtn.textContent = 'Criptografar uma Mensagem';
    encryptBtn.addEventListener('click', () => {
        currentAction = 'encrypt'; // Define a ação atual como 'encrypt'
        messageInput.style.display = 'block'; // Mostra o campo de mensagem
        addChatMessage('Você escolheu criptografar uma mensagem. Digite sua mensagem abaixo:', 'received');
        optionsElement.remove(); // Remove os botões
    });

    const historyBtn = document.createElement('button');
    historyBtn.textContent = 'Ver o Histórico';
    historyBtn.addEventListener('click', async () => {
        currentAction = 'history'; // Define a ação atual como 'history'
        messageInput.style.display = 'none'; // Esconde o campo de mensagem
        addChatMessage('Você escolheu ver o histórico.', 'received');

        // Busca o histórico
        try {
            const response = await fetch('http://localhost:3000/history');
            if (response.ok) {
                const history = await response.json();
                addChatMessage('Histórico de Mensagens:', 'received'); // Adiciona uma mensagem de cabeçalho

                history.forEach((item, index) => {
                    addChatMessage(`Mensagem ${index + 1}: IV: ${item.iv}, Criptografada: ${item.encryptedData}, Timestamp: ${item.timestamp}`, 'received');
                });

                // Pergunta se deseja descriptografar
                askToDecrypt();
            } else {
                addChatMessage('Erro ao obter histórico.', 'received');
            }
        } catch (error) {
            addChatMessage('Erro ao conectar-se ao servidor.', 'received');
        }
    });

    optionsElement.appendChild(encryptBtn);
    optionsElement.appendChild(historyBtn);
    chat.appendChild(optionsElement);
}

// Função para perguntar se deseja descriptografar alguma mensagem
function askToDecrypt() {
    addChatMessage('Deseja descriptografar alguma delas?', 'received');
    
    const optionsElement = document.createElement('div');
    optionsElement.classList.add('options');

    const yesBtn = document.createElement('button');
    yesBtn.textContent = 'Sim';
    yesBtn.addEventListener('click', () => {
        addChatMessage('Selecione o número da mensagem que deseja descriptografar:', 'received');
        currentAction = 'select-message'; // Ação para selecionar a mensagem
        optionsElement.remove(); // Remove os botões
        messageInput.style.display = 'block'; // Mostra o campo de mensagem para seleção
    });

    const noBtn = document.createElement('button');
    noBtn.textContent = 'Não';
    noBtn.addEventListener('click', () => {
        addChatMessage('Ok, deseja criptografar uma nova mensagem ou ver o histórico?', 'received');
        addActionButtons(); // Volta para as ações iniciais
        optionsElement.remove();
    });

    optionsElement.appendChild(yesBtn);
    optionsElement.appendChild(noBtn);
    chat.appendChild(optionsElement);
}

// Função para solicitar a chave de API
function askForApiKey() {
    addChatMessage('Insira a chave de API para descriptografar:', 'received');
    currentAction = 'api-key'; // Define a ação para coletar a chave de API
    messageInput.style.display = 'block'; // Mostra o campo de entrada de mensagem
}

// Lidar com o envio de mensagem
sendMessageBtn.addEventListener('click', async () => {
    const message = document.getElementById('message').value;

    if (!currentAction) {
        addChatMessage('Opção inválida. Deseja criptografar uma mensagem ou ver o histórico?', 'received');
        return;
    }

    if (currentAction === 'encrypt') {
        addChatMessage(message, 'sent'); // Adiciona a mensagem enviada ao chat
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
                addChatMessage('Mensagem criptografada com sucesso!', 'received');
            } else {
                addChatMessage('Erro ao criptografar a mensagem.', 'received');
            }
        } catch (error) {
            addChatMessage('Erro ao conectar-se ao servidor.', 'received');
        }

        addChatMessage('Deseja criptografar uma mensagem ou ver o histórico?', 'received'); // Pergunta novamente
        addActionButtons(); // Adiciona os botões de ação novamente
    } else if (currentAction === 'select-message') {
        // Ação para selecionar a mensagem a descriptografar
        selectedMessageIndex = parseInt(message) - 1;
        if (isNaN(selectedMessageIndex)) {
            addChatMessage('Número inválido. Por favor, insira um número de mensagem válido.', 'received');
        } else {
            askForApiKey(); // Solicita a chave de API após selecionar a mensagem
        }
    } else if (currentAction === 'api-key') {
        // Ação para descriptografar a mensagem
        const apiKey = message;
        try {
            const response = await fetch('http://localhost:3000/decrypt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ apiKey, messageIndex: selectedMessageIndex }), // Envia o índice da mensagem e a chave de API
            });

            const data = await response.json();

            if (response.ok) {
                addChatMessage(`Mensagem descriptografada: ${data.decryptedMessage}`, 'received');
            } else {
                addChatMessage('Erro ao descriptografar a mensagem. Verifique a chave de API.', 'received');
            }
        } catch (error) {
            addChatMessage('Erro ao conectar-se ao servidor.', 'received');
        }

        addChatMessage('Deseja criptografar uma nova mensagem ou ver o histórico?', 'received'); // Pergunta novamente
        addActionButtons(); // Adiciona os botões de ação novamente
    }

    // Limpa o campo de mensagem
    document.getElementById('message').value = '';
});

// Iniciar a conversa
addChatMessage('Deseja criptografar uma mensagem ou ver o histórico?', 'received');
addActionButtons(); // Adiciona os botões de ação ao chat
