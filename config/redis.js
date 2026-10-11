import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL && process.env.REDIS_URL.startsWith('redis://')
    ? process.env.REDIS_URL
    : 'redis://localhost:6379';

const redisClient = createClient({
    url: redisUrl,
    socket: { reconnectStrategy: false }
});

redisClient.on('error', (err) => console.warn('⚠️ [Redis] - Não conectado:', err.message || err));
redisClient.on('connect', () => console.log('🔵 [Redis] - Conectado com sucesso ao banco em Memória!'));

redisClient.connect().catch((err) => console.warn('⚠️ [Redis] - Sem servidor Redis disponível:', err.message || err));

export default redisClient;