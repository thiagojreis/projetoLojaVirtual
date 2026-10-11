import conectarMySQL from '../config/mysql.js';

const pedidosEmMemoria = [];

export const finalizarPedido = async (req, res) => {
    try {
        const { idUsuario, total } = req.body;
        const conexao = await conectarMySQL();

        if (!conexao) {
            const pedido = {
                id_pedido: pedidosEmMemoria.length + 1,
                idUsuario,
                total,
                data_compra: new Date().toISOString()
            };
            pedidosEmMemoria.push(pedido);
            return res.status(201).json({
                mensagem: 'Pagamento aprovado e salvo em memória (MySQL indisponível).',
                id_pedido: pedido.id_pedido,
                pedido
            });
        }

        await conexao.execute(`
            CREATE TABLE IF NOT EXISTS pedidos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT NOT NULL,
                total DECIMAL(10, 2) NOT NULL,
                data_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const [resultado] = await conexao.execute(
            'INSERT INTO pedidos (id_usuario, total) VALUES (?, ?)',
            [idUsuario, total]
        );

        return res.status(201).json({
            mensagem: 'Pagamento Aprovado e Salvo no Relacional!',
            id_pedido: resultado.insertId
        });

    } catch (erro) {
        const { idUsuario, total } = req.body;
        const pedido = {
            id_pedido: pedidosEmMemoria.length + 1,
            idUsuario,
            total,
            data_compra: new Date().toISOString()
        };
        pedidosEmMemoria.push(pedido);
        return res.status(201).json({
            mensagem: 'MySQL indisponível; pedido registrado em memória.',
            id_pedido: pedido.id_pedido,
            pedido
        });
    }
};