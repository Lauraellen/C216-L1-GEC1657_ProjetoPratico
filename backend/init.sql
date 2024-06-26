CREATE TABLE biblioteca (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(255) NOT NULL,
  ano_publicacao VARCHAR(255),
  edicao INTEGER,
  genero VARCHAR(255),
  disponivel VARCHAR(50)
)