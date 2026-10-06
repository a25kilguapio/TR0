//--------------------------------------VARIABLES GLOBALS
const BACKEND = "http://a25kilguapio.daw.inspedralbes.cat:40001";
let preguntesPartida = [];
let totalPreguntes = 10;
let indexActual = 0;
let contadorRespostes = 0;
let respostesUsuari = [];
let segonsComptador = 0;
let idTimer;

//--------------------------------FUNCIONS

function imatgeSrc(imatge) {
  if (imatge.indexOf("http") == 0) return imatge;
  return BACKEND + imatge;
}

function renderitzarPregunta() {

  const pregunta = preguntesPartida[indexActual];
  const respostaMarcada = respostesUsuari[indexActual] ? respostesUsuari[indexActual].idResposta : null;

  let botonsHtml = "";
  for (let i = 0; i < pregunta.respostes.length; i++) {
    const seleccionada = pregunta.respostes[i].id == respostaMarcada;
    const classe = seleccionada ? "btn btn-primary resposta-btn" : "btn btn-outline-primary resposta-btn";
    botonsHtml += `<button class="${classe}" data-id-resp="${pregunta.respostes[i].id}">${pregunta.respostes[i].etiqueta}</button>`;
  }

  const imatgeHtml = pregunta.imatge
    ? `<img src="${imatgeSrc(pregunta.imatge)}" class="img-fluid rounded mb-3" style="max-width:180px;max-height:180px;object-fit:contain;">`
    : "";

  document.getElementById("partida").innerHTML = `
    <div class="card mb-4 shadow-sm">
      <div class="card-body text-center">
        <div class="text-muted small mb-2">Pregunta ${indexActual + 1} de ${totalPreguntes}</div>
        <h5 class="card-title mb-3">${pregunta.pregunta}</h5>
        ${imatgeHtml}
        <div class="d-grid gap-2 col-10 mx-auto">${botonsHtml}</div>
      </div>
    </div>
  `;

  document.getElementById("btnAnterior").disabled = indexActual == 0;
  document.getElementById("btnSeguent").disabled = indexActual == totalPreguntes - 1;
}

function marcar(idResposta) {

  const pregunta = preguntesPartida[indexActual];

  if (respostesUsuari[indexActual] == null) {
    contadorRespostes++;
  }

  respostesUsuari[indexActual] = {
    idPregunta: pregunta.id,
    idResposta: idResposta
  };

  renderitzarPregunta();
  renderitzarMarcador();

  if (contadorRespostes == totalPreguntes) {
    document.getElementById("sendAnswers").classList.remove("hidden");
    clearInterval(idTimer);
  }
}

function renderitzarMarcador() {

  const percentatge = (contadorRespostes / totalPreguntes) * 100;

  document.getElementById("marcador").innerHTML = `
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between mb-2">
          <span class="fw-semibold">Progrés</span>
          <span>${contadorRespostes} / ${totalPreguntes}</span>
        </div>
        <div class="progress" style="height:10px;">
          <div class="progress-bar" style="width:${percentatge}%"></div>
        </div>
      </div>
    </div>
  `;
}

function enviarRespostes() {

  fetch(BACKEND + "/enviar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ respostes: respostesUsuari })
  })
    .then(function (resposta) { return resposta.json(); })
    .then(function (resultat) {
      document.getElementById("sendAnswers").classList.add("hidden");
      Swal.fire({
        icon: resultat.correctes == resultat.total ? "success" : "info",
        title: "Resultat de la partida",
        html: "Has encertat <strong>" + resultat.correctes + "</strong> de <strong>" + resultat.total + "</strong> preguntes."
      });
    });
}

//------------------------------MAIN------------------------
window.addEventListener("load", function () {

  // NOM GUARDAT A LOCALSTORAGE
  const nomLS = localStorage.getItem("nom");

  if (nomLS != null) {
    document.getElementById("benvinguda").textContent = "Benvingut/a, " + nomLS + "!";
    document.getElementById("benvinguda").classList.remove("hidden");
    document.getElementById("btnEsborrar").classList.remove("hidden");
  } else {
    document.getElementById("formNom").classList.remove("hidden");
  }

  document.getElementById("btnGuardar").addEventListener("click", function () {
    const contingutInputNom = document.getElementById("inputNom").value;
    localStorage.setItem("nom", contingutInputNom);

    document.getElementById("formNom").classList.add("hidden");
    document.getElementById("benvinguda").textContent = "Benvingut/a, " + contingutInputNom + "!";
    document.getElementById("benvinguda").classList.remove("hidden");
    document.getElementById("btnEsborrar").classList.remove("hidden");
  });

  document.getElementById("btnEsborrar").addEventListener("click", function () {
    localStorage.removeItem("nom");

    document.getElementById("benvinguda").classList.add("hidden");
    document.getElementById("btnEsborrar").classList.add("hidden");
    document.getElementById("inputNom").value = "";
    document.getElementById("formNom").classList.remove("hidden");
  });

  // CRONOMETRE
  idTimer = setInterval(function () {
    segonsComptador++;
    document.getElementById("comptador").textContent = "Temps: " + segonsComptador + " s";
  }, 1000);

  // BOTONS ANTERIOR / SEGÜENT
  document.getElementById("btnAnterior").addEventListener("click", function () {
    if (indexActual > 0) {
      indexActual--;
      renderitzarPregunta();
    }
  });

  document.getElementById("btnSeguent").addEventListener("click", function () {
    if (indexActual < totalPreguntes - 1) {
      indexActual++;
      renderitzarPregunta();
    }
  });

  // CLIC EN UNA RESPOSTA
  document.getElementById("partida").addEventListener("click", function (e) {
    if (e.target.classList.contains("resposta-btn")) {
      marcar(Number(e.target.dataset.idResp));
    }
  });

  // ENVIAR RESPOSTES
  document.getElementById("sendAnswers").addEventListener("click", enviarRespostes);

  // CARREGAR LES PREGUNTES DEL SERVIDOR
  fetch(BACKEND + "/iniciar")
    .then(function (resposta) { return resposta.json(); })
    .then(function (dades) {
      preguntesPartida = dades.questions;
      totalPreguntes = preguntesPartida.length;
      renderitzarPregunta();
      renderitzarMarcador();
    });

});
