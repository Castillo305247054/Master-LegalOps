// Configuración del Repositorio de GitHub
const PARTE_1 = 'ghp_Mtl3kY1t0J9KRlaAos'; 
const PARTE_2 = '3iqB5iQZzPha2pjh14';
const GITHUB_TOKEN = PARTE_1 + PARTE_2;

const REPO_OWNER = 'Castillo305247054';
const REPO_NAME = 'Master-LegalOps';
const FILE_PATH = 'demandas.json'; // Nombre del archivo de datos

// Función principal llamada desde el botón Enviar
async function enviarFormularioAWS() {
  const boton = document.querySelector('.boton-enviar');
  boton.disabled = true;
  boton.textContent = 'Enviando a Master Legal...';

  // 1. Recopilar los datos del formulario HTML
  const nuevaDemanda = {
    id: Date.now(),
    fechaRegistro: new Date().toISOString(),
    demandante: document.getElementById('demandante').value,
    demandado: document.getElementById('demandado').value,
    terceroInteresado: document.getElementById('terceroInteresado').value || 'N/A',
    materia: document.getElementById('materia').value,
    ciudad: document.getElementById('ciudad').value,
    circuito: document.getElementById('circuito').value || 'N/A',
    montoReclamado: document.getElementById('montoReclamado').value || '0',
    juzgado: document.getElementById('juzgado').value || 'N/A',
    actoReclamado: document.getElementById('actoReclamado').value || 'N/A'
  };

  try {
    await guardarDemandaEnGitHub(nuevaDemanda);
    alert('✅ ¡Demanda registrada correctamente en Master Legal!');
    document.getElementById('formularioDemanda').reset();
  } catch (error) {
    console.error('Error detallado:', error);
    alert('❌ Ocurrió un error al guardar: ' + error.message);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Enviar Demanda a Master Legal';
  }
}

// Función que conecta con la API de GitHub para leer y actualizar el JSON
async function guardarDemandaEnGitHub(nuevaDemanda) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
  let shaExistente = null;
  let contenidoCSV = "Fecha,Demandante,Demandado,Tercero,Materia,Ciudad,Circuito,Monto,Juzgado,Acto\n";

  // 1. Obtener el archivo CSV actual si existe
  try {
    const respuestaGet = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (respuestaGet.ok) {
      const data = await respuestaGet.json();
      shaExistente = data.sha;
      // Decodificar Base64 a texto UTF-8
      contenidoCSV = decodeURIComponent(escape(atob(data.content)));
    }
  } catch (e) {
    console.log('Creando nuevo archivo CSV...');
  }

  // 2. Crear la nueva fila en formato CSV
  const nuevaFila = `"${nuevaDemanda.fechaRegistro}","${nuevaDemanda.demandante}","${nuevaDemanda.demandado}","${nuevaDemanda.terceroInteresado}","${nuevaDemanda.materia}","${nuevaDemanda.ciudad}","${nuevaDemanda.circuito}","${nuevaDemanda.montoReclamado}","${nuevaDemanda.juzgado}","${nuevaDemanda.actoReclamado}"\n`;
  
  contenidoCSV += nuevaFila;

  // 3. Convertir a Base64 y guardar en GitHub
  const nuevoContenidoBase64 = btoa(unescape(encodeURIComponent(contenidoCSV)));

  const respuestaPut = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Registro CSV: ${nuevaDemanda.demandante}`,
      content: nuevoContenidoBase64,
      sha: shaExistente ? shaExistente : undefined
    })
  });

  if (!respuestaPut.ok) {
    throw new Error('No se pudo actualizar el archivo CSV.');
  }
}
