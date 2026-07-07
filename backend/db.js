// db.js — conexao unica com o PostgreSQL usando Pool
require('dotenv').config();
const { Pool } = require('pg');

// Le a string de conexao do arquivo .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// query() usado por todas as rotas
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
