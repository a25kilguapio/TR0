const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("node:fs");
const path = require("node:path");
const db = require("./db_conexion");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("static"));

fs.mkdirSync(path.join(__dirname, "static", "images"), { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "static", "images"));
    },
    filename: function (req, file, cb) {
      cb(null, "pregunta_" + Date.now() + path.extname(file.originalname));
    }
  })
});

// GET - totes les preguntes amb les seves respostes
app.get("/preguntes", async function (req, res) {

  try {

    const [preguntesFiles] = await db.query("SELECT id, pregunta, imatge FROM preguntes ORDER BY id");
    const [respostesFiles] = await db.query("SELECT pregunta_id, ordre, etiqueta, es_correcta FROM respostes ORDER BY pregunta_id, ordre");

    const preguntes = [];

    for (let i = 0; i < preguntesFiles.length; i++) {

      const p = preguntesFiles[i];
      const respostes = [];
      let respostaCorrecta = null;

      for (let j = 0; j < respostesFiles.length; j++) {
        const r = respostesFiles[j];
        if (r.pregunta_id == p.id) {
          respostes.push({ id: r.ordre, etiqueta: r.etiqueta });
          if (r.es_correcta) {
            respostaCorrecta = r.ordre;
          }
        }
      }

      preguntes.push({
        id: p.id,
        pregunta: p.pregunta,
        imatge: p.imatge,
        respostes: respostes,
        resposta_correcta: respostaCorrecta
      });
    }

    res.json(preguntes);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error llegint les preguntes");
  }
});

// GET - una pregunta concreta amb les seves respostes
app.get("/preguntes/:id", async function (req, res) {

  try {

    const id = req.params.id;

    const [preguntesFiles] = await db.query("SELECT id, pregunta, imatge FROM preguntes WHERE id = ?", [id]);

    if (preguntesFiles.length == 0) {
      return res.status(404).send("Pregunta no trobada");
    }

    const [respostesFiles] = await db.query("SELECT ordre, etiqueta, es_correcta FROM respostes WHERE pregunta_id = ? ORDER BY ordre", [id]);

    const respostes = [];
    let respostaCorrecta = null;

    for (let i = 0; i < respostesFiles.length; i++) {
      const r = respostesFiles[i];
      respostes.push({ id: r.ordre, etiqueta: r.etiqueta });
      if (r.es_correcta) {
        respostaCorrecta = r.ordre;
      }
    }

    res.json({
      id: preguntesFiles[0].id,
      pregunta: preguntesFiles[0].pregunta,
      imatge: preguntesFiles[0].imatge,
      respostes: respostes,
      resposta_correcta: respostaCorrecta
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error llegint la pregunta");
  }
});

// GET - 10 preguntes a l'atzar per començar una partida
app.get("/iniciar", async function (req, res) {

  try {

    const [preguntesFiles] = await db.query("SELECT id, pregunta, imatge FROM preguntes ORDER BY id");
    const [respostesFiles] = await db.query("SELECT pregunta_id, ordre, etiqueta, es_correcta FROM respostes ORDER BY pregunta_id, ordre");

    const totes = [];

    for (let i = 0; i < preguntesFiles.length; i++) {

      const p = preguntesFiles[i];
      const respostes = [];

      for (let j = 0; j < respostesFiles.length; j++) {
        const r = respostesFiles[j];
        if (r.pregunta_id == p.id) {
          respostes.push({ id: r.ordre, etiqueta: r.etiqueta });
        }
      }

      totes.push({ id: p.id, pregunta: p.pregunta, imatge: p.imatge, respostes: respostes });
    }

    for (let i = totes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = totes[i];
      totes[i] = totes[j];
      totes[j] = temp;
    }

    const seleccionades = totes.slice(0, 10);

    res.json({ questions: seleccionades });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error carregant les preguntes");
  }
});

// POST - comprova les respostes enviades per l'usuari
app.post("/enviar", async function (req, res) {

  const respostes = req.body.respostes;

  let correctes = 0;

  try {

    for (let i = 0; i < respostes.length; i++) {

      const idPregunta = respostes[i].idPregunta;
      const idResposta = respostes[i].idResposta;

      const [files] = await db.query(
        "SELECT ordre FROM respostes WHERE pregunta_id = ? AND es_correcta = 1",
        [idPregunta]
      );

      if (files.length > 0 && files[0].ordre == idResposta) {
        correctes++;
      }
    }

    res.json({
      correctes: correctes,
      incorrectes: respostes.length - correctes,
      total: respostes.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error comprovant les respostes");
  }
});

// POST - crear una pregunta nova amb les seves 4 respostes (multipart/form-data, amb imatge opcional)
app.post("/preguntes", upload.single("imatge"), async function (req, res) {

  try {

    const pregunta = req.body.pregunta;
    const respostaCorrecta = Number(req.body.resposta_correcta);
    const imatge = req.file ? "/images/" + req.file.filename : null;

    const [resultat] = await db.query(
      "INSERT INTO preguntes (pregunta, imatge) VALUES (?, ?)",
      [pregunta, imatge]
    );

    const idPregunta = resultat.insertId;

    for (let ordre = 1; ordre <= 4; ordre++) {
      const etiqueta = req.body["resposta" + ordre];
      await db.query(
        "INSERT INTO respostes (pregunta_id, ordre, etiqueta, es_correcta) VALUES (?, ?, ?, ?)",
        [idPregunta, ordre, etiqueta, ordre == respostaCorrecta]
      );
    }

    res.json({ missatge: "Pregunta creada", id: idPregunta });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error creant la pregunta");
  }
});

// PUT - modificar una pregunta existent (multipart/form-data, la imatge només es canvia si se n'envia una de nova)
app.put("/preguntes/:id", upload.single("imatge"), async function (req, res) {

  try {

    const id = req.params.id;
    const pregunta = req.body.pregunta;
    const respostaCorrecta = Number(req.body.resposta_correcta);

    let imatge = null;
    if (req.file) {
      imatge = "/images/" + req.file.filename;
    } else {
      const [actual] = await db.query("SELECT imatge FROM preguntes WHERE id = ?", [id]);
      imatge = actual.length > 0 ? actual[0].imatge : null;
    }

    await db.query(
      "UPDATE preguntes SET pregunta = ?, imatge = ? WHERE id = ?",
      [pregunta, imatge, id]
    );

    await db.query("DELETE FROM respostes WHERE pregunta_id = ?", [id]);

    for (let ordre = 1; ordre <= 4; ordre++) {
      const etiqueta = req.body["resposta" + ordre];
      await db.query(
        "INSERT INTO respostes (pregunta_id, ordre, etiqueta, es_correcta) VALUES (?, ?, ?, ?)",
        [id, ordre, etiqueta, ordre == respostaCorrecta]
      );
    }

    res.json({ missatge: "Pregunta modificada" });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error modificant la pregunta");
  }
});

// DELETE - eliminar una pregunta (i la seva imatge del disc, si en tenia)
app.delete("/preguntes/:id", async function (req, res) {

  try {

    const id = req.params.id;

    const [files] = await db.query("SELECT imatge FROM preguntes WHERE id = ?", [id]);

    await db.query("DELETE FROM preguntes WHERE id = ?", [id]);

    if (files.length > 0 && files[0].imatge && files[0].imatge.indexOf("/images/") == 0) {
      fs.unlink(path.join(__dirname, "static", files[0].imatge), function () {});
    }

    res.json({ missatge: "Pregunta eliminada" });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error eliminant la pregunta");
  }
});

const PORT = process.argv[2] || 40001;

app.listen(PORT, function () {
  console.log("Servidor funcionant a http://localhost:" + PORT);
});
