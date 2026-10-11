import mongoose from 'mongoose';

async function conectarMongo() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('🟢 [MongoDB] - Conectado com sucesso ao banco de Documentos!');
    } catch (erro) {
        console.error('🔴 [MongoDB] - Erro de conexão:', erro.message);
    }
}

export default conectarMongo;