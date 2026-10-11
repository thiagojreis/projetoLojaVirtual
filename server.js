import 'dotenv/config'; // Carrega o .env
import express from 'express';
import cors from 'cors';

// Importa Conexões
import conectarMongo from './config/mongo.js';
import conectarMySQL from './config/mysql.js';

// Importa Rotas
import rotas from './routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Acopla as rotas no caminho /api
app.use('/api', rotas);
app.get('/ping', (req, res) => {
    res.json({ mensagem: 'pong', status: 'OK' });
});

// Inicia as conexões
async function boot() {
    console.log("⚡ Iniciando a Operação Poliglota...");
    await conectarMongo();
    await conectarMySQL();
    // Redis conecta automaticamente no arquivo config/redis.js
}
boot();

app.get('/', (req, res) => {
    res.json({ mensagem: "Bem-vindo a API do CyberMarket!" });
});

// Liga o servidor
const PORTA = process.env.PORTA_API || 3000;
app.listen(PORTA, () => {
    console.log(`🚀 Servidor voando na porta http://localhost:${PORTA}`);
});