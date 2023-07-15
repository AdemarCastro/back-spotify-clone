// Importando pacotes
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import mysql from 'mysql2';
import cors from 'cors';

dotenv.config();
const server = express();
server.use(bodyParser.json());
server.use(express.json());


// Configurando o CORS
server.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Authorization', 'Content-Type'],
}));

const db = mysql.createConnection(process.env.DATABASE_URL)

db.connect(function (error) {
  if (error) {
    console.log("Ocorreu um erro com a conexão do BD");
  } else {
    console.log("Conexão bem sucedida com o BD");
  }
});

server.listen(process.env.PORT || 8080, function check(error) {
  if (error) {
    console.log("Erro ao iniciar o servidor");
  } else {
    console.log("Servidor iniciado com sucesso");
  }
});

// Cria a música no Banco de Dados
server.post("/favoritos/add", (req, res) => {
  let details = {
    id: req.body.id,
    titulo: req.body.titulo,
    tempo: req.body.tempo,
    album_id: req.body.album_id,
    album_imagemUrl: req.body.album_imagemUrl,
    album_nome: req.body.album_nome,
    artistas: req.body.artistas
  };

  let sql_favorito = `INSERT INTO favorito (id, titulo, tempo, album_id, album_imagemUrl, album_nome) VALUES (?, ?, ?, ?, ?, ?);`;
  let values_favorito = [
    details.id,
    details.titulo,
    details.tempo,
    details.album_id,
    details.album_imagemUrl,
    details.album_nome,
  ];

  db.query(sql_favorito, values_favorito, (error, results) => {
    if (error) {
      res.send({
        status: false,
        message: "Criação da música nos favoritos falhou!",
      });
    } else {
      for (let i = 0; i < details.artistas.length; i++) {
        let artista_id = details.artistas[i].id;
        let artista_nome = details.artistas[i].nome;

        let sql_artista = `INSERT INTO artista (id, nome) VALUES (?, ?);`;
        let values_artista = [artista_id, artista_nome];

        db.query(sql_artista, values_artista, (error, results) => {
          if (error && error.code !== "ER_DUP_ENTRY") {
            res.send({ status: false, message: "Criação do artista falhou!" });
          } else {
            let sql_favorito_artista = `INSERT IGNORE INTO favorito_artista (favorito_id, artista_id) VALUES (?, ?);`;
            let values_favorito_artista = [details.id, artista_id];

            db.query(
              sql_favorito_artista,
              values_favorito_artista,
              (error, results) => {
                if (error) {
                  res.send({
                    status: false,
                    message: "Associação entre o artista e o favorito falhou!",
                  });
                }
              }
            );
          }
        });
      }

      res.send({
        status: true,
        message: "Música adicionada aos favoritos com sucesso!",
      });
    }
  });
});

// Exibe a lista de favoritos
server.get("/favoritos", (req, res) => {
  var sql =
    "SELECT f.id, f.titulo, GROUP_CONCAT(a.id SEPARATOR ', ') AS artista_id, GROUP_CONCAT(a.nome SEPARATOR ', ') AS artista_nome, f.album_id, f.album_imagemUrl, f.album_nome, f.tempo " +
    "FROM favorito f " +
    "JOIN favorito_artista fa ON f.id = fa.favorito_id " +
    "JOIN artista a ON fa.artista_id = a.id " +
    "GROUP BY f.id;";
  db.query(sql, function (error, result) {
    if (error) {
      console.log("Ocorreu um error ao tentar se conectar ao BD!");
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.json({ status: true, data: result });
      console.log("Operação realizada com sucesso!");
    }
  });
});

// Deletar música no Banco de Dados
server.delete("/deletar-musica/:id", (req, res) => {
  let idMusica = req.params.id;

  // Verificar ID do artista relacionado à música
  let sql = "SELECT artista_id FROM favorito_artista WHERE favorito_id = ?;";
  db.query(sql, [idMusica], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send("Erro ao verificar artistas relacionados à música.");
      return;
    }

    // Verificar se o artista da música está relacionado a outras músicas no Banco de Dados
    if (results.length > 0) {
      let artistaId = results[0].artista_id;
      sql = "SELECT COUNT(*) AS Total FROM favorito_artista WHERE artista_id = ?;";
      db.query(sql, [artistaId], (error, results) => {
        if (error) {
          console.error(error);
          res.status(500).send("Erro ao verificar quantas músicas o artista está relacionado.");
          return;
        }

        // Se o artista estiver relacionado a apenas uma música, exclua a música e o artista do Banco de Dados
        if (results[0].total === 1) {
          sql = "DELETE FROM favorito_artista WHERE artista_id = ?;";

          db.query(sql, [artistaId], (error, results) => {
            if (error) {
              console.error(error);
              res.status(500).send("Erro ao excluir artista relacionado à música.");
              return;
            }

            sql = "DELETE FROM artista WHERE id = ?;";
            db.query(sql, [artistaId], (error, results) => {
              if (error) {
                console.error(error);
                res.status(500).send("Erro ao excluir artista.");
                return;
              }

              sql = "DELETE FROM favorito WHERE id = ?;";
              db.query(sql, [idMusica], (error, results) => {
                if (error) {
                  console.error(error);
                  res.status(500).send("Erro ao excluir música.");
                  return;
                }

                res.send({ status: 200, data: results });
                console.log(`Música com ID ${idMusica} e artista com ID ${artistaId} excluídos com sucesso.`);
              });
            });
          });
        }

        // Se o artista estiver relacionado a mais de uma música, exclua apenas a música
        else {
          sql = "DELETE FROM favorito_artista WHERE favorito_id = ?;";
          db.query(sql, [idMusica], (error, results) => {
            if (error) {
              console.error(error);
              res.status(500).send("Erro ao excluir música.");
              return;
            }

            sql = "DELETE FROM favorito WHERE id = ?;";
            db.query(sql, [idMusica], (error, results) => {
            if (error) {
              console.error(error);
              res.status(500).send("Erro ao excluir música.");
              return;
            }


            });

            res.send({ status: 200, data: results });
            console.log(`Música com ID ${idMusica} excluída com sucesso.`);
          });
        }
      });
    }

    // Se não houver um artista relacionado à música, exclua apenas a música
    else {
      let sql = "DELETE FROM favorito_artista WHERE favorito_id = ?;";
      db.query(sql, [idMusica], (error, results) => {
        if (error) {
          console.error(error);
          res.status(500).send("Erro ao excluir música.");
          return;
        }

        sql = "DELETE FROM favorito WHERE id = ?;";
        db.query(sql, [idMusica], (error, results) => {
        if (error) {
          console.error(error);
          res.status(500).send("Erro ao excluir música.");
          return;
        }
        });

        res.send({ status: 200, data: results });
        console.log(`Música com ID ${idMusica} excluída com sucesso.`);
      });
    }
  });
});

// Verificar lista de favoritos
server.get("/verificar-favorito/:id", (req, res) => {
  let idMusica = req.params.id;

  let verificar = "SELECT COUNT(*) AS quantidade " +
  "FROM favorito WHERE id = ?;";

  db.query(verificar, [idMusica], (error, resultados) => {
    if (error) {
      console.log("Erro ao verificar favorito!");
      res.status(500).send("Erro ao verificar favorito!");
      return;
    } else {
      const quantidade = resultados[0].quantidade;
      const estaNosFavoritos = quantidade > 0;
      res.send({ status: true, data: estaNosFavoritos });
      console.log("Verificação executada com sucesso!");
    }
  });

});
