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
  if (historial.length === 0) {
    historialWrap.style.display = 'none';
    return;
  }

  historialWrap.style.display = 'flex';
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
  mostrarLoading(true);

  try {
    // Petición al clima actual
    // &units=metric → temperaturas en Celsius
    // &lang=es → descripciones en español
    const resCurrent = await fetch(
      `${API_BASE}/weather?q=${encodeURIComponent(ciudad)}&appid=${API_KEY}&units=metric&lang=es`
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
      `${API_BASE}/forecast?q=${encodeURIComponent(ciudad)}&appid=${API_KEY}&units=metric&lang=es`
    );
    const dataForecast = await resForecast.json();

    // Todo salió bien — mostramos los datos
    mostrarLoading(false);
    guardarHistorial(dataCurrent.name);
    mostrarClima(dataCurrent, dataForecast);

  } catch (error) {
    mostrarLoading(false);
    mostrarError(error.message);
  }
}

async function buscarPorCoordenadas(lat, lon) {
  mostrarLoading(true);

  try {
    const resCurrent = await fetch(
      `${API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`
    );

    if (!resCurrent.ok) throw new Error('No se pudo obtener el clima de tu ubicación.');

    const dataCurrent = await resCurrent.json();

    const resForecast = await fetch(
      `${API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`
    );
    const dataForecast = await resForecast.json();

    mostrarLoading(false);
    guardarHistorial(dataCurrent.name);
    mostrarClima(dataCurrent, dataForecast);

  } catch (error) {
    mostrarLoading(false);
    mostrarError(error.message);
  }
}

// ================================
// MOSTRAR CLIMA
// ================================

function mostrarClima(current, forecast) {
  // Datos básicos
  ciudadNombre.textContent = current.name;
  ciudadPais.textContent   = `${current.sys.country} · ${current.coord.lat.toFixed(2)}°, ${current.coord.lon.toFixed(2)}°`;
  temperatura.textContent  = Math.round(current.main.temp) + '°';
  descripcion.textContent  = current.weather[0].description;
  sensacion.textContent    = `Sensación térmica: ${Math.round(current.main.feels_like)}°`;
  humedad.textContent      = current.main.humidity + '%';
  viento.textContent       = Math.round(current.wind.speed * 3.6) + ' km/h';
  visibilidad.textContent  = (current.visibility / 1000).toFixed(1) + ' km';
  presion.textContent      = current.main.pressure + ' hPa';

  // Fecha y hora local
  const ahora = new Date();
  fechaHora.innerHTML = `
    ${ahora.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
    <br>${ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
  `;

  // Icono y tema visual según el clima
  const condicion = current.weather[0].main.toLowerCase();
  const esNoche   = current.weather[0].icon.includes('n');
  iconoClima.textContent = obtenerIcono(condicion, esNoche);
  aplicarTema(condicion, esNoche);

  // Pronóstico 5 días
  // La API devuelve datos cada 3 horas — tomamos uno por día (el del mediodía)
  const diasUnicos = {};
  forecast.list.forEach(item => {
    const fecha = new Date(item.dt * 1000);
    const dia   = fecha.toLocaleDateString('es-AR', { weekday: 'short' });
    const hora  = fecha.getHours();

    // Tomamos el dato más cercano al mediodía de cada día
    if (!diasUnicos[dia] || Math.abs(hora - 12) < Math.abs(new Date(diasUnicos[dia].dt * 1000).getHours() - 12)) {
      diasUnicos[dia] = item;
    }
  });

  // Tomamos máximo 5 días
  const diasArray = Object.values(diasUnicos).slice(0, 5);

  pronosticoDiv.innerHTML = diasArray.map(item => {
    const fecha   = new Date(item.dt * 1000);
    const diaNom  = fecha.toLocaleDateString('es-AR', { weekday: 'short' });
    const cond    = item.weather[0].main.toLowerCase();
    const icono   = obtenerIcono(cond, false);
    return `
      <div class="dia-card">
        <span class="dia-nombre">${diaNom}</span>
        <span class="dia-icono">${icono}</span>
        <span class="dia-temp-max">${Math.round(item.main.temp_max)}°</span>
        <span class="dia-temp-min">${Math.round(item.main.temp_min)}°</span>
      </div>
    `;
  }).join('');

  // Mostramos la pantalla de clima
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
  } else {
    loading.classList.add('oculto');
  }
}

function mostrarError(mensaje) {
  errorTexto.textContent = mensaje;
  errorMsg.classList.remove('oculto');
  // Se oculta solo después de 4 segundos
  setTimeout(() => errorMsg.classList.add('oculto'), 4000);
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
  errorMsg.classList.add('oculto');
});

// ================================
// INIT
// ================================

function init() {
  crearEstrellas();
  renderizarHistorial();
}

document.addEventListener('DOMContentLoaded', init);