import redisClient from '../config/redis.js';

const carrinhosEmMemoria = new Map();

export const adicionarAoCarrinho = async (req, res) => {
    try {
        const { idUsuario, produto, quantidade, preco } = req.body;
        const chave = `carrinho:${idUsuario}`;
        const item = { produto, quantidade, preco };

        if (!redisClient || !redisClient.isOpen) {
            const atual = carrinhosEmMemoria.get(chave) || [];
            atual.push(item);
            carrinhosEmMemoria.set(chave, atual);
            return res.status(200).json({ mensagem: 'Item adicionado ao carrinho temporário em memória!', carrinho: atual });
        }

        await redisClient.lPush(chave, JSON.stringify(item));
        await redisClient.expire(chave, 3600);

        return res.status(200).json({ mensagem: 'Item adicionado ao carrinho temporário!' });
    } catch (erro) {
        const { idUsuario, produto, quantidade, preco } = req.body;
        const chave = `carrinho:${idUsuario}`;
        const atual = carrinhosEmMemoria.get(chave) || [];
        atual.push({ produto, quantidade, preco });
        carrinhosEmMemoria.set(chave, atual);
        return res.status(200).json({ mensagem: 'Redis indisponível; item salvo em memória.', carrinho: atual });
    }
};

export const verCarrinho = async (req, res) => {
    try {
        const { idUsuario } = req.params;
        const chave = `carrinho:${idUsuario}`;

        if (!redisClient || !redisClient.isOpen) {
            const itens = carrinhosEmMemoria.get(chave) || [];
            return res.status(200).json({ usuario: idUsuario, itens });
        }

        const itens = await redisClient.lRange(chave, 0, -1);
        const itensFormatados = itens.map(i => JSON.parse(i));

        return res.status(200).json({ usuario: idUsuario, itens: itensFormatados });
    } catch (erro) {
        const { idUsuario } = req.params;
        const chave = `carrinho:${idUsuario}`;
        const itens = carrinhosEmMemoria.get(chave) || [];
        return res.status(200).json({ usuario: idUsuario, itens });
    }
};