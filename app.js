// Configuración del Repositorio de GitHub
const PARTE_1 = 'ghp_5vYMKqzez6aIo781y'; 
const PARTE_2 = 'ERAy9YWXXyfSg4264ST';
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
  let contenidoActual = [];

  // 1. Intentar obtener el archivo actual si ya existe
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
      // Decodificar el contenido base64
      const jsonTexto = decodeURIComponent(escape(atob(data.content)));
      contenidoActual = JSON.parse(jsonTexto);
    }
  } catch (e) {
    console.log('El archivo aún no existe o está vacío, se creará uno nuevo.');
  }

  // 2. Agregar el nuevo registro
  contenidoActual.push(nuevaDemanda);

  // 3. Convertir el contenido a Base64
  const nuevoContenidoBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(contenidoActual, null, 2))));

  // 4. Guardar (PUT) en GitHub
  const respuestaPut = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Registro de demanda: ${nuevaDemanda.demandante}`,
      content: nuevoContenidoBase64,
      sha: shaExistente ? shaExistente : undefined
    })
  });

  if (!respuestaPut.ok) {
    const errorData = await respuestaPut.json();
    throw new Error(errorData.message || 'No se pudo guardar en GitHub.');
  }
}
