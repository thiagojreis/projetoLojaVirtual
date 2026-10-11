import mongoose from 'mongoose';

// Roupas padrão para quando o MongoDB não estiver conectado
let produtosEmMemoria = [
    { _id: 'prod-01', nome: 'Camisa Manga Curta Black', preco: 89.90, imagem: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80' },
    { _id: 'prod-02', nome: 'Camisa Manga Longa Oversized', preco: 129.90, imagem: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80' },
    { _id: 'prod-03', nome: 'Calça Jeans Wide Leg', preco: 179.90, imagem: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80' }
];

const ProdutoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    preco: { type: Number, required: true },
    imagem: { type: String }
}, { strict: false, versionKey: false });

const Produto = mongoose.model('Produto', ProdutoSchema, 'produtos');

// LISTAR
export const listarProdutos = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json(produtosEmMemoria);
        }
        const produtos = await Produto.find();
        return res.status(200).json(produtos.length ? produtos : produtosEmMemoria);
    } catch (erro) {
        return res.status(200).json(produtosEmMemoria);
    }
};

// CRIAR
export const criarProduto = async (req, res) => {
    try {
        const dados = {
            nome: req.body.nome,
            preco: Number(req.body.preco),
            imagem: req.body.imagem || ''
        };

        if (mongoose.connection.readyState !== 1) {
            const novo = { _id: `prod-${Date.now()}`, ...dados };
            produtosEmMemoria.push(novo);
            return res.status(201).json({ mensagem: 'Produto criado com sucesso!', produto: novo });
        }

        const novo = await Produto.create(dados);
        return res.status(201).json({ mensagem: 'Produto criado com sucesso!', produto: novo });
    } catch (erro) {
        const novo = { _id: `prod-${Date.now()}`, ...req.body, preco: Number(req.body.preco) };
        produtosEmMemoria.push(novo);
        return res.status(201).json({ mensagem: 'Produto salvo em memória.', produto: novo });
    }
};

// ATUALIZAR (EDITAR)
export const atualizarProduto = async (req, res) => {
    const { id } = req.params;
    const { nome, preco, imagem } = req.body;

    try {
        if (mongoose.connection.readyState !== 1) {
            const idx = produtosEmMemoria.findIndex(p => p._id === id || p.id === id);
            if (idx !== -1) {
                produtosEmMemoria[idx] = {
                    ...produtosEmMemoria[idx],
                    nome,
                    preco: Number(preco),
                    imagem: imagem || produtosEmMemoria[idx].imagem
                };
                return res.status(200).json({ mensagem: 'Produto atualizado com sucesso!', produto: produtosEmMemoria[idx] });
            }
            return res.status(404).json({ mensagem: 'Produto não encontrado.' });
        }

        const produtoAtualizado = await Produto.findByIdAndUpdate(
            id,
            { nome, preco: Number(preco), imagem },
            { new: true }
        );

        if (!produtoAtualizado) {
            return res.status(404).json({ mensagem: 'Produto não encontrado.' });
        }

        return res.status(200).json({ mensagem: 'Produto atualizado com sucesso!', produto: produtoAtualizado });
    } catch (erro) {
        // Fallback para alterar no array em memória caso o id seja um mock
        const idx = produtosEmMemoria.findIndex(p => p._id === id || p.id === id);
        if (idx !== -1) {
            produtosEmMemoria[idx] = { ...produtosEmMemoria[idx], nome, preco: Number(preco), imagem };
            return res.status(200).json({ mensagem: 'Produto atualizado em memória!', produto: produtosEmMemoria[idx] });
        }
        return res.status(500).json({ mensagem: 'Erro ao atualizar produto.', erro: erro.message });
    }
};

// DELETAR (EXCLUIR)
export const deletarProduto = async (req, res) => {
    const { id } = req.params;

    try {
        if (mongoose.connection.readyState !== 1) {
            produtosEmMemoria = produtosEmMemoria.filter(p => p._id !== id && p.id !== id);
            return res.status(200).json({ mensagem: 'Produto removido com sucesso!' });
        }

        const removido = await Produto.findByIdAndDelete(id);

        if (!removido) {
            // Tenta remover do array em memória se for id sintético
            produtosEmMemoria = produtosEmMemoria.filter(p => p._id !== id && p.id !== id);
        }

        return res.status(200).json({ mensagem: 'Produto removido com sucesso!' });
    } catch (erro) {
        produtosEmMemoria = produtosEmMemoria.filter(p => p._id !== id && p.id !== id);
        return res.status(200).json({ mensagem: 'Produto removido do catálogo em memória.' });
    }
};