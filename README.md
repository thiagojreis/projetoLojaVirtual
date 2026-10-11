🛒 CyberMarket - API Poliglota

Bem-vindos ao backend do nosso E-commerce! Esta é a base da nossa API Poliglota, projetada para a disciplina de Banco de Dados II (Turma DS/13-N).

Aqui, quebramos a regra do "banco único" e utilizamos a ferramenta certa para o trabalho certo:

🍃 MongoDB (Documentos): Catálogo de Produtos flexível.

⚡ Redis (Chave-Valor): Carrinho de compras ultra-rápido com expiração (TTL).

🐬 MySQL (Relacional): Fechamento de pedidos e integridade financeira.

🚀 Como rodar o projeto na sua máquina

Siga os passos abaixo rigorosamente para levantar a API antes de plugar o seu Frontend.

1. Instale as dependências

Abra o terminal na pasta do projeto e instale os pacotes (Express, Mongoose, Redis, MySQL2, Cors, Dotenv):

npm install


2. Configure as Variáveis de Ambiente

Para a API funcionar, ela precisa saber onde estão os seus bancos de dados.

Crie uma cópia do arquivo .env.example e renomeie para .env (com o ponto na frente e sem o ".example").

Abra o arquivo .env e preencha as senhas e URLs dos seus bancos (MongoDB Atlas, Redis Labs e MySQL local).

3. Ligue os Motores

Com as senhas preenchidas e pacotes instalados, rode o servidor:

npm start


Se tudo der certo, você verá no terminal as mensagens de conexão bem-sucedida aos três bancos!

📡 Endpoints (Rotas da API)

Use estas rotas no seu fetch() ou axios no Frontend:

📦 Catálogo (MongoDB)

GET /api/produtos - Lista todos os produtos da loja.

POST /api/produtos - Cadastra um novo produto (Envie nome e preco no body JSON).

🛒 Carrinho (Redis)

POST /api/carrinho - Adiciona um item. (Body: idUsuario, produto, quantidade, preco). O carrinho expira sozinho em 1 hora!

GET /api/carrinho/:idUsuario - Lista os itens atuais no carrinho de um usuário específico.

💳 Pedidos (MySQL)

POST /api/pedidos - Finaliza a compra. (Body: idUsuario, total). Salva no banco relacional gerando um ID de pedido com segurança ACID.

Professor: Alison Matheus

Botem pra torar! Desenvolvam interfaces incríveis e conectem nessa base!