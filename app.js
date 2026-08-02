// ==========================================
// CONFIGURACIÓN DE TU REPOSITORIO DE GITHUB
// ==========================================
const GITHUB_CONFIG = {
  owner: "Castillo305247054",          // Tu usuario de GitHub
  repo: "Master-LegalOps",             // Tu repositorio privado
  filePath: "master-legal.csv",        // Tu base de datos CSV
  token: "ghp_TU_TOKEN_REAL_DE_GITHUB" // Reemplaza por tu Personal Access Token (PAT)
};

// ==========================================
// FUNCIÓN PRINCIPAL DE ENVÍO
// ==========================================
async function enviarFormularioAWS() {
  // 1. Capturar y mapear los campos ingresados en el formulario HTML
  const nuevaDemanda = {
    idExpediente: `EXP-2026-${Math.floor(100 + Math.random() * 900)}`,
    fechaPresentacion: new Date().toISOString().split("T")[0],
    ciudad: document.getElementById("ciudad")?.value || "N/A",
    circuito: document.getElementById("circuito")?.value || "N/A",
    materia: document.getElementById("materia")?.value || "N/A",
    juzgado: document.getElementById("juzgado")?.value || "N/A",
    demandante: document.getElementById("demandante")?.value || "N/A",
    demandado: document.getElementById("demandado")?.value || "N/A",
    terceroInteresado: document.getElementById("terceroInteresado")?.value || "N/A",
    actoReclamado: (document.getElementById("actoReclamado")?.value || "").replace(/,/g, ";"), // Reemplaza comas para no romper el CSV
    estadoActual: "Pendiente de Radicación",
    fechaUltimoAcuerdo: new Date().toISOString().split("T")[0],
    montoReclamado: document.getElementById("montoReclamado")?.value || "0.00",
    linkExpedienteJson: "",
    linkDocumentoPdf: ""
  };

  try {
    mostrarEstadoBoton(true);
    await guardarDemandaEnGitHub(nuevaDemanda);
    alert(`✅ Demanda radicada con éxito en GitHub. ID Asignado: ${nuevaDemanda.idExpediente}`);
    
    // Opcional: Limpiar el formulario tras enviar
    const formulario = document.querySelector("form");
    if (formulario) formulario.reset();

  } catch (error) {
    console.error("Error al guardar en GitHub:", error);
    alert(`❌ Hubo un error al registrar la demanda: ${error.message}`);
  } finally {
    mostrarEstadoBoton(false);
  }
}

// ==========================================
// CONECTOR CON LA API DE GITHUB (REST API)
// ==========================================
async function guardarDemandaEnGitHub(datos) {
  const urlApi = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}`;

  // Paso A: Obtener el CSV actual y su SHA de versión
  const resGet = await fetch(urlApi, {
    headers: {
      "Authorization": `Bearer ${GITHUB_CONFIG.token}`,
      "Accept": "application/vnd.github.v3+json"
    }
  });

  if (!resGet.ok) {
    throw new Error("No se pudo conectar con el repositorio. Revisa tu Token de acceso.");
  }

  const fileData = await resGet.json();
  const shaActual = fileData.sha;
  
  // Decodificar contenido de Base64 a Texto Plano UTF-8
  const csvTextoActual = decodeURIComponent(escape(atob(fileData.content)));

  // Paso B: Formatear la nueva demanda en una línea de CSV
  const nuevaFilaCsv = `${datos.idExpediente},${datos.fechaPresentacion},"${datos.ciudad}","${datos.circuito}","${datos.materia}","${datos.juzgado}","${datos.demandante}","${datos.demandado}","${datos.terceroInteresado}","${datos.actoReclamado}","${datos.estadoActual}",${datos.fechaUltimoAcuerdo},${datos.montoReclamado},"${datos.linkExpedienteJson}","${datos.linkDocumentoPdf}"`;

  // Concatenar la nueva fila al archivo
  const csvTextoActualizado = `${csvTextoActual.trim()}\n${nuevaFilaCsv}`;

  // Codificar de vuelta a Base64
  const contenidoBase64 = btoa(unescape(encodeURIComponent(csvTextoActualizado)));

  // Paso C: Sobreescribir el archivo en GitHub
  const bodyPayload = {
    message: `feat: registro automático de demanda ${datos.idExpediente}`,
    content: contenidoBase64,
    sha: shaActual
  };

  const resPut = await fetch(urlApi, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${GITHUB_CONFIG.token}`,
      "Content-Type": "application/json",
      "Accept": "application/vnd.github.v3+json"
    },
    body: JSON.stringify(bodyPayload)
  });

  if (!resPut.ok) {
    const errorDetail = await resPut.json();
    throw new Error(errorDetail.message || "Error al actualizar la base de datos en GitHub.");
  }
}

// Opcional: Bloquea el botón mientras envía para evitar clics dobles
function mostrarEstadoBoton(cargando) {
  const botones = document.querySelectorAll("button");
  botones.forEach(btn => {
    if (btn.innerText.includes("Enviar") || btn.innerText.includes("AWS") || btn.getAttribute("onclick")?.includes("enviarFormularioAWS")) {
      btn.disabled = cargando;
      btn.innerText = cargando ? "Guardando en Master Legal..." : "Enviar Demanda";
    }
  });
}
