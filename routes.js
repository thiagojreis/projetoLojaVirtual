import { Router } from 'express';
import { listarProdutos, criarProduto, atualizarProduto, deletarProduto } from './Controllers/produtoController.js';
import { adicionarAoCarrinho, verCarrinho } from './Controllers/carrinhoController.js';
import { finalizarPedido } from './Controllers/pedidoController.js';
import redisClient from './config/redis.js';

const router = Router();

// Rotas do Catálogo de Produtos (CRUD Completo)
router.get('/produtos', listarProdutos);
router.post('/produtos', criarProduto);
router.put('/produtos/:id', atualizarProduto);
router.delete('/produtos/:id', deletarProduto);

// Rotas do Carrinho e Pedidos
router.post('/carrinho', adicionarAoCarrinho);
router.get('/carrinho/:idUsuario', verCarrinho);
router.post('/pedidos', finalizarPedido);

// Rota de Teste Ping
router.get('/ping', (req, res) => {
    res.json({ mensagem: 'pong', status: 'OK' });
});

// Teste Redis
router.post('/redis/set', async (req, res) => {
    try {
        const { key, value } = req.body;
        await redisClient.set(key, value);
        res.json({ mensagem: 'Dado gravado com sucesso no Redis!', key, value });
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

export default router;