import mysql from 'mysql2/promise';
async function conectarMySQL() {
    try {
        const conexao = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT || 3307,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASS,
            database: process.env.MYSQL_DB
        });
        console.log('🟠 [MySQL] - Conectado com sucesso ao Banco Relacional!');
        return conexao;
    } catch (erro) {
        console.error('🔴 [MySQL] - Erro de conexão (Verifique se o XAMPP está ligado):', erro.message);
    }
}

export default conectarMySQL;