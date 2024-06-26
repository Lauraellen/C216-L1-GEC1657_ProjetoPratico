const restify = require('restify');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres', // Usuário do banco de dados
    host: process.env.POSTGRES_HOST || 'db', // Este é o nome do serviço do banco de dados no Docker Compose
    database: process.env.POSTGRES_DB || 'biblioteca',
    password: process.env.POSTGRES_PASSWORD || 'password', // Senha do banco de dados
    port: process.env.POSTGRES_PORT || 5432,
});

// iniciar o servidor
var server = restify.createServer({
    name: 'projeto',
});

// Iniciando o banco de dados
async function initDatabase() {
    try {
        await pool.query('DROP TABLE IF EXISTS biblioteca');
        await pool.query('CREATE TABLE IF NOT EXISTS biblioteca (id SERIAL PRIMARY KEY, titulo VARCHAR(255) NOT NULL, autor VARCHAR(255) NOT NULL, ano_publicacao VARCHAR(255), edicao INTEGER, genero VARCHAR(255) )');

        console.log('Banco de dados inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao iniciar o banco de dados, tentando novamente em 5 segundos:', error);
        setTimeout(initDatabase, 5000);
    }
}

// Middleware para permitir o parsing do corpo da requisição
server.use(restify.plugins.bodyParser());

// Endpoint para inserir um novo livro
server.post('/api/v1/biblioteca/inserir', async (req, res, next) => {
  const { titulo, autor, ano_publicacao, edicao, genero } = req.body;
  try {
      const result = await pool.query(
        'INSERT INTO biblioteca (titulo, autor, ano_publicacao, edicao, genero) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [titulo, autor, ano_publicacao, edicao, genero]
      );
      res.send(201, result.rows[0]);
      console.log('Livro inserido com sucesso:', result.rows[0]);
    } catch (error) {
      console.error('Erro ao inserir livro:', error);
      res.send(500, { message: 'Erro ao inserir livro' });
    }
  return next();
});

// Endpoint para listar todos os livros da biblioteca
server.get('/api/v1/biblioteca/listar', async (req, res, next) => {
  try {
      const result = await pool.query('SELECT * FROM biblioteca');
      res.send(result.rows);
      console.log('Livros encontrados:', result.rows);
  } catch (error) {
      console.error('Erro ao listar livros:', error);
      res.send(500, { message: 'Erro ao listar livros' });
  }
  return next();
});

// Endpoint para atualizar um livro existente
server.post('/api/v1/biblioteca/atualizar', async (req, res, next) => {
  const { id, titulo, autor, ano_publicacao, edicao, genero } = req.body;

  try {
      const result = await pool.query(
        'UPDATE biblioteca SET titulo = $1, autor = $2, ano_publicacao = $3, edicao = $4, genero = $5 WHERE id = $6 RETURNING *',
        [titulo, autor, ano_publicacao, edicao, genero, id]
      );
      if (result.rowCount === 0) {
        res.send(404, { message: 'Professor não encontrado' });
      } else {
        res.send(200, result.rows[0]);
        console.log('Professor atualizado com sucesso:', result.rows[0]);
      }
    } catch (error) {
      console.error('Erro ao atualizar professor:', error);
      res.send(500, { message: 'Erro ao atualizar professor' });
    }

  return next();
});

// Endpoint para excluir um livro pelo ID
server.post('/api/v1/biblioteca/excluir', async (req, res, next) => {
    const { id } = req.body;

    try {
        const result = await pool.query('DELETE FROM biblioteca WHERE id = $1', [id]);
        if (result.rowCount === 0) {
          res.send(404, { message: 'Livro não encontrado' });
        } else {
          res.send(200, { message: 'Livro excluído com sucesso' });
          console.log('Livro excluído com sucesso');
        }
    } catch (error) {
        console.error('Erro ao excluir livro:', error);
        res.send(500, { message: 'Erro ao excluir livro' });
    }
    return next();
});

// endpoint para resetar o banco de dados
server.del('/api/v1/database/reset', async (req, res, next) => {
    try {
      await pool.query('DROP TABLE IF EXISTS biblioteca');
      // await pool.query('CREATE TABLE biblioteca (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, author VARCHAR(255) NOT NULL, year_publication VARCHAR(50), number_edition VARCHAR(10), book_genre VARCHAR(50) )');
      await pool.query('CREATE TABLE IF NOT EXISTS biblioteca (id SERIAL PRIMARY KEY, titulo VARCHAR(255) NOT NULL, autor VARCHAR(255) NOT NULL, ano_publicacao VARCHAR(255), edicao INTEGER, genero VARCHAR(255) )');

      res.send(200, { message: 'Banco de dados resetado com sucesso' });
      console.log('Banco de dados resetado com sucesso');
    } catch (error) {
      console.error('Erro ao resetar o banco de dados:', error);
      res.send(500, { message: 'Erro ao resetar o banco de dados' });
    }
  
    return next();
});

// iniciar o servidor
var port = process.env.PORT || 5000;
// configurando o CORS
server.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Content-Length, X-Requested-With'
    );
    if (req.method === 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});

server.listen(port, function() {
    console.log('Servidor iniciado', server.name, ' na url http://localhost:' + port);
    // Iniciando o banco de dados
    console.log('Iniciando o banco de dados');
    initDatabase();
});
