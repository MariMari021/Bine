const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const apiKey = '28365924'; // Chave de API fixa

// Middleware
app.use(cors());
app.use(express.json());

// Array para armazenar o histórico das mensagens
const history = [];

// Função para criptografar uma mensagem
function encryptMessage(message) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(apiKey, 'salt', 32); // Usa a chave fixa
    const iv = crypto.randomBytes(16);  // Vetor de inicialização

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
    };
}

// Rota de criptografia
app.post('/encrypt', (req, res) => {
    const { message } = req.body; // Somente a mensagem é necessária

    if (!message) {
        return res.status(400).json({ error: 'Mensagem é obrigatória.' });
    }

    const encrypted = encryptMessage(message);
    
    // Adiciona a mensagem criptografada ao histórico
    history.push({
        message: message,
        encryptedData: encrypted.encryptedData,
        iv: encrypted.iv,
        timestamp: new Date() // Armazena o timestamp
    });
    
    res.json(encrypted);
});

// Rota para obter o histórico
app.get('/history', (req, res) => {
    res.json(history);
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Função para descriptografar uma mensagem
function decryptMessage(encryptedMessage, iv, apiKeyInput) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(apiKeyInput, 'salt', 32); // Usa a chave fornecida pelo usuário
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));

    let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

// Rota de descriptografia
app.post('/decrypt', (req, res) => {
    const { apiKey, messageIndex } = req.body;

    if (!apiKey || messageIndex == null) {
        return res.status(400).json({ error: 'Chave de API e índice da mensagem são obrigatórios.' });
    }

    if (apiKey !== apiKey) {
        return res.status(401).json({ error: 'Chave de API inválida.' });
    }

    const message = history[messageIndex];
    if (!message) {
        return res.status(404).json({ error: 'Mensagem não encontrada.' });
    }

    try {
        const decryptedMessage = decryptMessage(message.encryptedData, message.iv, apiKey);
        res.json({ decryptedMessage });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao descriptografar a mensagem.' });
    }
});
