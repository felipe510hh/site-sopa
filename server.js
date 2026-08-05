const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());
app.use(cors()); // Permite que o site (GitHub Pages) se comunique com o seu servidor local

// Configuração do Robô do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Escaneie o QR Code abaixo com o WhatsApp da loja:');
});

client.on('ready', () => {
    console.log('Robô do WhatsApp conectado e pronto!');
});

client.initialize();

// Rota que o site chama ao finalizar o pedido
app.post('/pedido', async (req, res) => {
    try {
        const { nome, endereco, whatsapp, pagamento, carrinho, total } = req.body;

        // Monta a lista de itens
        let textoItens = '';
        const precos = { '350ml': 7, '500ml': 10, '1L': 20 };
        
        for (const [tamanho, quantidade] of Object.entries(carrinho)) {
            if (quantidade > 0) {
                textoItens += `• ${quantidade}x Sopa ${tamanho} (R$ ${(quantidade * precos[tamanho]).toFixed(2).replace('.', ',')})\n`;
            }
        }

        const mensagem = `*NOVO PEDIDO - SOPARIA*\n\n` +
                         `*Cliente:* ${nome}\n` +
                         `*Endereço:* ${endereco}\n` +
                         `*WhatsApp:* ${whatsapp}\n\n` +
                         `*Itens do Pedido:*\n${textoItens}\n` +
                         `*Total:* R$ ${total}\n` +
                         `*Forma de Pagamento:* ${pagamento}`;

        // Número da Loja (ex: 55 + DDD + Número)
        const numeroLoja = '5584999863991@c.us';

        // Envia a mensagem automaticamente pelo WhatsApp
        await client.sendMessage(numeroLoja, mensagem);

        console.log(`✅ Pedido de ${nome} processado e enviado para o WhatsApp!`);
        res.status(200).json({ success: true, message: 'Pedido enviado com sucesso!' });

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
