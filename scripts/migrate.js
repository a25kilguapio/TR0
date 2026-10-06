const fs = require("node:fs");
const path = require("node:path");
const db = require("../db_conexion");

async function migrate() {

  const marquesData = fs.readFileSync(path.join(__dirname, "..", "marques.json"), "utf8");
  const preguntes = JSON.parse(marquesData).preguntes;

  const conn = await db.getConnection();

  try {

    await conn.beginTransaction();

    await conn.query("DELETE FROM respostes");
    await conn.query("DELETE FROM preguntes");
    await conn.query("ALTER TABLE respostes AUTO_INCREMENT = 1");
    await conn.query("ALTER TABLE preguntes AUTO_INCREMENT = 1");

    for (let i = 0; i < preguntes.length; i++) {

      const p = preguntes[i];

      const [resultat] = await conn.query(
        "INSERT INTO preguntes (pregunta, imatge) VALUES (?, ?)",
        [p.pregunta, p.imatge || null]
      );

      const idPregunta = resultat.insertId;

      for (let j = 0; j < p.respostes.length; j++) {
        const r = p.respostes[j];
        await conn.query(
          "INSERT INTO respostes (pregunta_id, ordre, etiqueta, es_correcta) VALUES (?, ?, ?, ?)",
          [idPregunta, r.id, r.etiqueta, r.id == p.resposta_correcta]
        );
      }
    }

    await conn.commit();
    console.log("Migrades " + preguntes.length + " preguntes des de marques.json.");

  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

migrate().then(function () {
  process.exit(0);
}).catch(function (error) {
  console.error("Error durant la migració:", error);
  process.exit(1);
});
