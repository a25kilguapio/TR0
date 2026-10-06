//--------------------------------------VARIABLES GLOBALS
const BACKEND = "http://a25kilguapio.daw.inspedralbes.cat:40001";
let preguntesActuals = [];

//--------------------------------FUNCIONS

function imatgeSrc(imatge) {
  if (!imatge) return "";
  if (imatge.indexOf("http") == 0) return imatge;
  return BACKEND + imatge;
}

function carregarPreguntes() {
  fetch(BACKEND + "/preguntes")
    .then(function (resposta) { return resposta.json(); })
    .then(function (preguntes) {
      preguntesActuals = preguntes;
      pintarLlista();
    });
}

function pintarLlista() {

  let html = "";

  for (let i = 0; i < preguntesActuals.length; i++) {

    const p = preguntesActuals[i];

    const imatgeHtml = p.imatge
      ? `<img src="${imatgeSrc(p.imatge)}" style="width:60px;height:60px;object-fit:contain;">`
      : "";

    let respostesHtml = "<ul class='mb-0 ps-3'>";
    for (let j = 0; j < p.respostes.length; j++) {
      const r = p.respostes[j];
      const marca = r.id == p.resposta_correcta ? " <strong>(correcta)</strong>" : "";
      respostesHtml += `<li>${r.etiqueta}${marca}</li>`;
    }
    respostesHtml += "</ul>";

    html += `
      <tr>
        <td>${imatgeHtml}</td>
        <td>${p.pregunta}${respostesHtml}</td>
        <td class="text-nowrap">
          <button type="button" class="btn btn-sm btn-outline-primary mb-1" onclick="carregarPerEditar(${p.id})">Editar</button>
          <button type="button" class="btn btn-sm btn-outline-danger mb-1" onclick="eliminarPregunta(${p.id})">Eliminar</button>
        </td>
      </tr>
    `;
  }

  document.getElementById("llistaPreguntes").innerHTML = html;
}

function carregarPerEditar(id) {

  let pregunta = null;
  for (let i = 0; i < preguntesActuals.length; i++) {
    if (preguntesActuals[i].id == id) {
      pregunta = preguntesActuals[i];
    }
  }

  if (!pregunta) return;

  document.getElementById("titolFormulari").textContent = "Editant pregunta #" + pregunta.id;
  document.getElementById("editId").value = pregunta.id;
  document.getElementById("campPregunta").value = pregunta.pregunta;
  document.getElementById("campResposta1").value = pregunta.respostes[0].etiqueta;
  document.getElementById("campResposta2").value = pregunta.respostes[1].etiqueta;
  document.getElementById("campResposta3").value = pregunta.respostes[2].etiqueta;
  document.getElementById("campResposta4").value = pregunta.respostes[3].etiqueta;
  document.getElementById("campCorrecta").value = pregunta.resposta_correcta;

  window.scrollTo(0, 0);
}

function netejarFormulari() {
  document.getElementById("titolFormulari").textContent = "Nova pregunta";
  document.getElementById("formPregunta").reset();
  document.getElementById("editId").value = "";
}

function eliminarPregunta(id) {
  fetch(BACKEND + "/preguntes/" + id, { method: "DELETE" })
    .then(function () {
      carregarPreguntes();
    });
}

//------------------------------MAIN------------------------
window.addEventListener("load", function () {

  document.getElementById("btnCancelar").addEventListener("click", netejarFormulari);

  document.getElementById("formPregunta").addEventListener("submit", function (e) {
    e.preventDefault();

    const dades = new FormData();
    dades.append("pregunta", document.getElementById("campPregunta").value);
    dades.append("resposta1", document.getElementById("campResposta1").value);
    dades.append("resposta2", document.getElementById("campResposta2").value);
    dades.append("resposta3", document.getElementById("campResposta3").value);
    dades.append("resposta4", document.getElementById("campResposta4").value);
    dades.append("resposta_correcta", document.getElementById("campCorrecta").value);

    const fitxer = document.getElementById("campImatge").files[0];
    if (fitxer) {
      dades.append("imatge", fitxer);
    }

    const id = document.getElementById("editId").value;
    const url = id ? BACKEND + "/preguntes/" + id : BACKEND + "/preguntes";
    const metode = id ? "PUT" : "POST";

    fetch(url, { method: metode, body: dades })
      .then(function (resposta) { return resposta.json(); })
      .then(function () {
        netejarFormulari();
        carregarPreguntes();
      });
  });

  carregarPreguntes();

});
