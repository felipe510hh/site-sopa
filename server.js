const express = require('express');
const cors = require('cors');
const { createCanvas } = require('canvas');
const path = require('path');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());
app.use(cors());

// Serve os arquivos do site
app.use(express.static(path.join(__dirname, '..')));

// Configurando o cliente do WhatsApp no servidor
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    console.log('\n--- ESCANEIE ESTE QR CODE COM O WHATSAPP DA LOJA ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Robô do WhatsApp conectado e pronto para enviar os pedidos!');
});

client.initialize();

// Substitua pelo número da loja com DDI e DDD (Ex: 55 + DDD + Número + @c.us)
const NUMERO_LOJA = '558499863991@c.us';

// Rota que recebe o pedido, gera o comprovante e envia direto no WhatsApp
app.post('/gerar-comprovante', async (req, res) => {
    try {
        const { nome, endereco, pagamento, itens, total } = req.body;

        if (!nome || !endereco || !itens) {
            return res.status(400).json({ erro: 'Dados incompletos.' });
        }

        // Criando a imagem do recibo no servidor
        const canvas = createCanvas(400, 600);
        const ctx = canvas.getContext('2d');

        // Fundo Branco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 400, 600);

        // Cabeçalho
        ctx.fillStyle = '#E65100';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('A MULHER DA SOPA', 200, 40);

        ctx.fillStyle = '#555555';
        ctx.font = '12px Arial';
        ctx.fillText('Sopa de rua, feita com amor!', 200, 65);

        // Linha divisória
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, 80);
        ctx.lineTo(380, 80);
        ctx.stroke();

        // Dados do Cliente
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Cliente: ${nome}`, 20, 115);
        ctx.fillText(`Endereço: ${endereco}`, 20, 145);
        ctx.fillText(`Pagamento: ${pagamento}`, 20, 175);

        // Linha divisória
        ctx.beginPath();
        ctx.moveTo(20, 200);
        ctx.lineTo(380, 200);
        ctx.stroke();

        // Itens do Pedido
        ctx.font = 'bold 14px Arial';
        ctx.fillText('ITENS DO PEDIDO:', 20, 230);

        let posicaoY = 260;
        ctx.font = '14px Arial';
        
        itens.forEach(item => {
            const textoItem = `${item.qtd}x ${item.nome}`;
            const precoItem = `R$ ${(item.preco * item.qtd).toFixed(2).replace('.', ',')}`;
            
            ctx.fillText(textoItem, 20, posicaoY);
            ctx.textAlign = 'right';
            ctx.fillText(precoItem, 380, posicaoY);
            
            ctx.textAlign = 'left';
            posicaoY += 30;
        });

        // Linha divisória do total
        ctx.beginPath();
        ctx.moveTo(20, posicaoY + 10);
        ctx.lineTo(380, posicaoY + 10);
        ctx.stroke();

        // Total
        ctx.font = 'bold 18px Arial';
        ctx.fillText('TOTAL:', 20, posicaoY + 45);
        ctx.textAlign = 'right';
        ctx.fillText(`R$ ${total.replace('.', ',')}`, 380, posicaoY + 45);

        // Converte o canvas para Base64
        const buffer = canvas.toBuffer('image/png');
        const base64Image = buffer.toString('base64');

        // Cria a mídia para o WhatsApp
        const media = new MessageMedia('image/png', base64Image, 'comprovante-pedido.png');

        let itensTexto = '';
        itens.forEach(item => {
            const sub = item.preco * item.qtd;
            itensTexto += `• ${item.qtd}x ${item.nome} (R$ ${sub.toFixed(2).replace('.', ',')})\n`;
        });

        const legenda = `*NOVO PEDIDO - A MULHER DA SOPA*\n\n` +
            `*Cliente:* ${nome}\n` +
            `*Endereço:* ${endereco}\n` +
            `*Pagamento:* ${pagamento}\n\n` +
            `*ITENS:*\n${itensTexto}\n` +
            `*TOTAL:* R$ ${total.replace('.', ',')}`;

        // Envia a imagem e o texto diretamente para o WhatsApp da loja
        await client.sendMessage(NUMERO_LOJA, media, { caption: legenda });

        res.json({ sucesso: true, mensagem: 'Pedido enviado diretamente para o WhatsApp da loja!' });

    } catch (erro) {
        console.error('Erro ao enviar mensagem:', erro);
        res.status(500).json({ erro: 'Erro ao enviar para o WhatsApp.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});