// ================================
// API KEY Y CONFIGURACIÓN
// ================================

const API_KEY = '8c335fb9e2c889756966196d6839bfc0';
const API_BASE = 'https://api.openweathermap.org/data/2.5';

// ================================
// SELECTORES
// ================================

const pantallaBusqueda  = document.getElementById('pantalla-busqueda');
const pantallaClima     = document.getElementById('pantalla-clima');
const inputCiudad       = document.getElementById('input-ciudad');
const btnBuscar         = document.getElementById('btn-buscar');
const btnGeo            = document.getElementById('btn-geolocalizacion');
const btnVolver         = document.getElementById('btn-volver');
const btnCerrarError    = document.getElementById('btn-cerrar-error');
const historialWrap     = document.getElementById('historial-wrap');
const historialDiv      = document.getElementById('historial');
const loading           = document.getElementById('loading');
const errorMsg          = document.getElementById('error-msg');
const errorTexto        = document.getElementById('error-texto');
const estrellasDiv      = document.getElementById('estrellas');

// Elementos de clima
const ciudadNombre   = document.getElementById('ciudad-nombre');
const ciudadPais     = document.getElementById('ciudad-pais');
const fechaHora      = document.getElementById('fecha-hora');
const iconoClima     = document.getElementById('icono-clima');
const temperatura    = document.getElementById('temperatura');
const descripcion    = document.getElementById('descripcion');
const sensacion      = document.getElementById('sensacion');
const humedad        = document.getElementById('humedad');
const viento         = document.getElementById('viento');
const visibilidad    = document.getElementById('visibilidad');
const presion        = document.getElementById('presion');
const pronosticoDiv  = document.getElementById('pronostico');

// ================================
// ESTADO
// ================================

let historial = JSON.parse(localStorage.getItem('weatherHistorial')) || [];

// Estado extra
let abortController    = null;
const climaCache       = new Map(); // clave → { current, forecast, ts }
const CACHE_TTL        = 10 * 60 * 1000; // 10 min en ms
let errorTimeout       = null;
let currentWeatherData  = null;
let currentForecastData = null;
let esCelsius           = true;

// ================================
// ESTRELLAS
// ================================

function crearEstrellas() {
  // Creamos 150 estrellas con posición, tamaño y velocidad de titileo aleatorios
  for (let i = 0; i < 150; i++) {
    const estrella = document.createElement('span');
    estrella.classList.add('estrella');

    // Posición aleatoria en % para que sea responsive
    estrella.style.left   = Math.random() * 100 + '%';
    estrella.style.top    = Math.random() * 100 + '%';

    // Tamaño entre 1px y 3px
    const size = Math.random() * 2 + 1;
    estrella.style.width  = size + 'px';
    estrella.style.height = size + 'px';

    // Cada estrella titila a su propio ritmo
    estrella.style.setProperty('--duracion', (Math.random() * 3 + 1) + 's');
    estrella.style.animationDelay = Math.random() * 3 + 's';

    estrellasDiv.appendChild(estrella);
  }
}

// ================================
// HISTORIAL
// ================================

function guardarHistorial(ciudad) {
  // Quitamos si ya existía para no duplicar
  historial = historial.filter(c => c.toLowerCase() !== ciudad.toLowerCase());
  // La agregamos al principio
  historial.unshift(ciudad);
  // Máximo 5 ciudades
  historial = historial.slice(0, 5);
  // Guardamos en localStorage
  localStorage.setItem('weatherHistorial', JSON.stringify(historial));
  renderizarHistorial();
}

function renderizarHistorial() {
  historialWrap.style.display = 'flex';

  if (historial.length === 0) {
    historialDiv.innerHTML = '<span class="historial-vacio">Sin búsquedas recientes</span>';
    return;
  }

  historialDiv.innerHTML = historial.map(ciudad => `
    <button class="btn-historial" data-ciudad="${ciudad}">
      📍 ${ciudad}
    </button>
  `).join('');

  // Click en ciudad del historial → busca esa ciudad
  document.querySelectorAll('.btn-historial').forEach(btn => {
    btn.addEventListener('click', () => {
      buscarClima(btn.dataset.ciudad);
    });
  });
}

// ================================
// FETCH A LA API
// ================================

async function buscarClima(ciudad) {
  // Cancelar petición anterior si aún está en vuelo
  if (abortController) abortController.abort();
  abortController = new AbortController();
  const signal = abortController.signal;

  // Verificar caché (10 min)
  const cacheKey = ciudad.trim().toLowerCase();
  const cached = climaCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    esCelsius = true;
    guardarHistorial(cached.current.name);
    mostrarClima(cached.current, cached.forecast);
    return;
  }

  mostrarLoading(true);

  try {
    const resCurrent = await fetch(
      `${API_BASE}/weather?q=${encodeURIComponent(ciudad)}&appid=${API_KEY}&units=metric&lang=es`,
      { signal }
    );

    // Si la respuesta no fue exitosa (ej: ciudad no encontrada)
    if (!resCurrent.ok) {
      if (resCurrent.status === 404) throw new Error('Ciudad no encontrada. Verificá el nombre.');
      if (resCurrent.status === 401) throw new Error('API key inválida.');
      throw new Error('Error al obtener el clima. Intentá de nuevo.');
    }

    const dataCurrent = await resCurrent.json();

    // Petición al pronóstico de 5 días
    const resForecast = await fetch(
      `${API_BASE}/forecast?q=${encodeURIComponent(ciudad)}&appid=${API_KEY}&units=metric&lang=es`,
      { signal }
    );
    const dataForecast = await resForecast.json();

    // Guardar en caché
    climaCache.set(cacheKey, { current: dataCurrent, forecast: dataForecast, ts: Date.now() });

    mostrarLoading(false);
    esCelsius = true;
    guardarHistorial(dataCurrent.name);
    mostrarClima(dataCurrent, dataForecast);

  } catch (error) {
    if (error.name === 'AbortError') return; // petición cancelada intencionalmente
    mostrarLoading(false);
    mostrarError(error.message);
  }
}

async function buscarPorCoordenadas(lat, lon) {
  if (abortController) abortController.abort();
  abortController = new AbortController();
  const signal = abortController.signal;

  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = climaCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    esCelsius = true;
    guardarHistorial(cached.current.name);
    mostrarClima(cached.current, cached.forecast);
    return;
  }

  mostrarLoading(true);

  try {
    const resCurrent = await fetch(
      `${API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`,
      { signal }
    );

    if (!resCurrent.ok) throw new Error('No se pudo obtener el clima de tu ubicación.');

    const dataCurrent = await resCurrent.json();

    const resForecast = await fetch(
      `${API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`,
      { signal }
    );
    const dataForecast = await resForecast.json();

    climaCache.set(cacheKey, { current: dataCurrent, forecast: dataForecast, ts: Date.now() });

    mostrarLoading(false);
    esCelsius = true;
    guardarHistorial(dataCurrent.name);
    mostrarClima(dataCurrent, dataForecast);

  } catch (error) {
    if (error.name === 'AbortError') return;
    mostrarLoading(false);
    mostrarError(error.message);
  }
}

// ================================
// MOSTRAR CLIMA
// ================================

function mostrarClima(current, forecast) {
  // Guardar para el toggle de unidades y re-render sin fetch
  currentWeatherData  = current;
  currentForecastData = forecast;

  // Conversión según unidad activa
  const conv   = val => esCelsius ? Math.round(val) : Math.round(val * 9 / 5 + 32);
  const unidad = esCelsius ? '°' : '°F';

  // Datos básicos
  ciudadNombre.textContent = current.name;
  ciudadPais.textContent   = `${current.sys.country} · ${current.coord.lat.toFixed(2)}°, ${current.coord.lon.toFixed(2)}°`;
  temperatura.textContent  = conv(current.main.temp) + unidad;
  descripcion.textContent  = current.weather[0].description;
  sensacion.textContent    = `Sensación térmica: ${conv(current.main.feels_like)}${unidad}`;
  humedad.textContent      = current.main.humidity + '%';
  viento.textContent       = `${Math.round(current.wind.speed * 3.6)} km/h ${dirViento(current.wind.deg || 0)}`;
  visibilidad.textContent  = (current.visibility / 1000).toFixed(1) + ' km';
  presion.textContent      = current.main.pressure + ' hPa';

  // Amanecer y atardecer en hora local de la ciudad
  const amanecerEl  = document.getElementById('amanecer');
  const atardecerEl = document.getElementById('atardecer');
  if (amanecerEl)  amanecerEl.textContent  = formatHoraUTC(current.sys.sunrise, current.timezone);
  if (atardecerEl) atardecerEl.textContent = formatHoraUTC(current.sys.sunset,  current.timezone);

  // Botón toggle: muestra la unidad a la que se puede cambiar
  const btnToggle = document.getElementById('btn-toggle-unidad');
  if (btnToggle) btnToggle.textContent = esCelsius ? '°F' : '°C';

  // Fecha y hora LOCAL de la ciudad (usa el offset timezone de la API, no el del navegador)
  const tzOffset  = current.timezone; // segundos desde UTC
  const nowUTC    = Math.floor(Date.now() / 1000);
  const localDate = new Date((nowUTC + tzOffset) * 1000);

  const DIAS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
                 'septiembre','octubre','noviembre','diciembre'];

  const diaStr  = `${DIAS[localDate.getUTCDay()]} ${localDate.getUTCDate()} de ${MESES[localDate.getUTCMonth()]}`;
  const horaStr = `${String(localDate.getUTCHours()).padStart(2,'0')}:${String(localDate.getUTCMinutes()).padStart(2,'0')}`;

  fechaHora.innerHTML = `${diaStr}<br>${horaStr} <span class="hora-local-label">(hora local)</span>`;

  // Icono y tema visual según el clima
  const condicion = current.weather[0].main.toLowerCase();
  const esNoche   = current.weather[0].icon.includes('n');
  iconoClima.textContent = obtenerIcono(condicion, esNoche);
  aplicarTema(condicion, esNoche);

  // Pronóstico 5 días — agrupado por día en hora local de la ciudad
  const diasUnicos = {};
  forecast.list.forEach(item => {
    const d    = new Date((item.dt + tzOffset) * 1000);
    const key  = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    const hora = d.getUTCHours();
    if (!diasUnicos[key] || Math.abs(hora - 12) < Math.abs(new Date((diasUnicos[key].dt + tzOffset) * 1000).getUTCHours() - 12)) {
      diasUnicos[key] = item;
    }
  });

  const diasArray = Object.values(diasUnicos).slice(0, 5);

  pronosticoDiv.innerHTML = diasArray.map(item => {
    const d      = new Date((item.dt + tzOffset) * 1000);
    const diaNom = DIAS[d.getUTCDay()].slice(0, 3);
    const diaNum = d.getUTCDate();
    const mesNom = MESES[d.getUTCMonth()].slice(0, 3);
    const cond   = item.weather[0].main.toLowerCase();
    const icono  = obtenerIcono(cond, false);
    return `
      <div class="dia-card">
        <span class="dia-nombre">${diaNom} ${diaNum} ${mesNom}</span>
        <span class="dia-icono">${icono}</span>
        <span class="dia-temp-max">${conv(item.main.temp_max)}°</span>
        <span class="dia-temp-min">${conv(item.main.temp_min)}°</span>
      </div>
    `;
  }).join('');

  mostrarPantalla('clima');
}

// ================================
// ICONOS Y TEMAS
// ================================

function obtenerIcono(condicion, esNoche) {
  if (esNoche) return '🌙';
  const iconos = {
    clear:        '☀️',
    clouds:       '☁️',
    rain:         '🌧️',
    drizzle:      '🌦️',
    thunderstorm: '⛈️',
    snow:         '❄️',
    mist:         '🌫️',
    fog:          '🌫️',
    haze:         '🌫️',
    smoke:        '🌫️',
    dust:         '🌪️',
    tornado:      '🌪️',
  };
  return iconos[condicion] || '🌤️';
}

function aplicarTema(condicion, esNoche) {
  // Quitamos todos los temas anteriores
  document.body.className = '';

  if (esNoche) {
    document.body.classList.add('tema-noche');
    return;
  }

  const temas = {
    clear:        'tema-sol',
    clouds:       'tema-nublado',
    rain:         'tema-lluvia',
    drizzle:      'tema-lluvia',
    thunderstorm: 'tema-tormenta',
    snow:         'tema-nieve',
  };

  const tema = temas[condicion];
  if (tema) document.body.classList.add(tema);
}

// ================================
// UTILIDADES UI
// ================================

function mostrarPantalla(cual) {
  pantallaBusqueda.classList.add('oculto');
  pantallaClima.classList.add('oculto');

  if (cual === 'busqueda') pantallaBusqueda.classList.remove('oculto');
  if (cual === 'clima')    pantallaClima.classList.remove('oculto');
}

function mostrarLoading(estado) {
  if (estado) {
    loading.classList.remove('oculto');
    btnBuscar.disabled = true;
    btnBuscar.style.opacity = '0.6';
  } else {
    loading.classList.add('oculto');
    btnBuscar.disabled = false;
    btnBuscar.style.opacity = '';
  }
}

function mostrarError(mensaje) {
  clearTimeout(errorTimeout);
  errorTexto.textContent = mensaje;
  errorMsg.classList.remove('oculto');
  errorTimeout = setTimeout(() => errorMsg.classList.add('oculto'), 4000);
}

// ================================
// EVENTOS
// ================================

// Buscar al hacer click
btnBuscar.addEventListener('click', () => {
  const ciudad = inputCiudad.value.trim();
  if (!ciudad) return mostrarError('Ingresá el nombre de una ciudad.');
  buscarClima(ciudad);
});

// Buscar al presionar Enter
inputCiudad.addEventListener('keydown', e => {
  if (e.key === 'Enter') btnBuscar.click();
});

// Geolocalización
btnGeo.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return mostrarError('Tu navegador no soporta geolocalización.');
  }

  mostrarLoading(true);

  // navigator.geolocation es una API del navegador — no necesita librería
  navigator.geolocation.getCurrentPosition(
    pos => buscarPorCoordenadas(pos.coords.latitude, pos.coords.longitude),
    ()  => {
      mostrarLoading(false);
      mostrarError('No se pudo obtener tu ubicación. Permití el acceso.');
    }
  );
});

// Volver a la búsqueda
btnVolver.addEventListener('click', () => {
  mostrarPantalla('busqueda');
  document.body.className = ''; // reseteamos el tema
  inputCiudad.value = '';
});

// Cerrar error manualmente
btnCerrarError.addEventListener('click', () => {
  clearTimeout(errorTimeout);
  errorMsg.classList.add('oculto');
});

// Toggle °C / °F
document.getElementById('btn-toggle-unidad')?.addEventListener('click', () => {
  esCelsius = !esCelsius;
  if (currentWeatherData && currentForecastData) {
    mostrarClima(currentWeatherData, currentForecastData);
  }
});

// ================================
// HELPERS
// ================================

// Convierte grados azimutales a punto cardinal
function dirViento(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(deg / 45) % 8];
}

// Formatea hora Unix (UTC) ajustada al timezone de la ciudad
function formatHoraUTC(unixSec, tzOffsetSec) {
  const d = new Date((unixSec + tzOffsetSec) * 1000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

// ================================
// INIT
// ================================

function init() {
  crearEstrellas();
  renderizarHistorial();
  iniciarGlobo3D();
}

document.addEventListener('DOMContentLoaded', init);

// ================================
// GLOBO 3D — THREE.JS
// ================================

function iniciarGlobo3D() {
  const canvas = document.getElementById('globo-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const SIZE = canvas.parentElement.clientWidth || 280;
  canvas.width  = SIZE;
  canvas.height = SIZE;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(SIZE, SIZE);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Escena y cámara
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 2.4;

  // ── Iluminación ──────────────────────────────
  // Luz ambiente tenue (lado nocturno no queda completamente negro)
  const ambientLight = new THREE.AmbientLight(0x112244, 1.8);
  scene.add(ambientLight);

  // Luz solar principal (viene del frente-izquierda-arriba)
  const sunLight = new THREE.DirectionalLight(0xfff5e0, 3.2);
  sunLight.position.set(4, 2, 5);
  scene.add(sunLight);

  // ── Texturas (NASA / Three.js examples) ──────
  const loader = new THREE.TextureLoader();

  const earthTex   = loader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
  const specTex    = loader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');
  const normalTex  = loader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');
  const cloudsTex  = loader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png');

  // ── Esfera terrestre ─────────────────────────
  const earthGeo = new THREE.SphereGeometry(1, 64, 64);
  const earthMat = new THREE.MeshPhongMaterial({
    map:         earthTex,
    specularMap: specTex,
    normalMap:   normalTex,
    normalScale: new THREE.Vector2(0.6, 0.6),
    specular:    new THREE.Color(0x4488aa),
    shininess:   18,
  });
  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  scene.add(earthMesh);

  // ── Capa de nubes ────────────────────────────
  const cloudsGeo = new THREE.SphereGeometry(1.012, 64, 64);
  const cloudsMat = new THREE.MeshPhongMaterial({
    map:         cloudsTex,
    transparent: true,
    opacity:     0.78,
    depthWrite:  false,
  });
  const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
  scene.add(cloudsMesh);

  // ── Halo atmosférico (glow) ──────────────────
  const glowGeo = new THREE.SphereGeometry(1.08, 64, 64);
  const glowMat = new THREE.MeshPhongMaterial({
    color:       0x2277cc,
    side:        THREE.FrontSide,
    transparent: true,
    opacity:     0.10,
    depthWrite:  false,
  });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  scene.add(glowMesh);

  // ── Interacción: arrastrar para rotar ────────
  let isDragging = false;
  let prevX = 0, prevY = 0;
  let velX = 0, velY = 0;

  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
  });
  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    velX = (e.clientX - prevX) * 0.005;
    velY = (e.clientY - prevY) * 0.003;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  // Touch
  canvas.addEventListener('touchstart', e => {
    isDragging = true;
    prevX = e.touches[0].clientX;
    prevY = e.touches[0].clientY;
  });
  window.addEventListener('touchend', () => { isDragging = false; });
  window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    velX = (e.touches[0].clientX - prevX) * 0.005;
    velY = (e.touches[0].clientY - prevY) * 0.003;
    prevX = e.touches[0].clientX;
    prevY = e.touches[0].clientY;
  });

  // ── Loop de animación ────────────────────────
  function animate() {
    requestAnimationFrame(animate);

    if (isDragging) {
      earthMesh.rotation.y  += velX;
      earthMesh.rotation.x  += velY;
      cloudsMesh.rotation.y += velX;
      cloudsMesh.rotation.x += velY;
      velX *= 0.85;
      velY *= 0.85;
    } else {
      // Auto-rotación suave
      earthMesh.rotation.y  += 0.0015;
      cloudsMesh.rotation.y += 0.0018; // nubes van un poco más rápido
    }

    renderer.render(scene, camera);
  }

  animate();
}