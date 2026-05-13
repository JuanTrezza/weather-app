# 🌍 WeatherWorld - Clima Global

Una aplicación web moderna e interactiva para consultar el clima en tiempo real de cualquier lugar del planeta.

## 🎯 Características

- 🔍 **Búsqueda por ciudad**: Ingresá el nombre de cualquier ciudad para obtener información del clima
- 📍 **Geolocalización**: Usá tu ubicación actual para obtener el clima automáticamente
- 📋 **Historial de búsquedas**: Acceso rápido a las últimas 5 ciudades consultadas, con estado vacío cuando no hay historial
- 🌤️ **Temas dinámicos**: El fondo cambia según las condiciones climáticas
- ⭐ **Efecto visual de estrellas**: Animación de estrellas titilantes en el fondo
- 🌐 **Globo terráqueo 3D**: Renderizado WebGL con Three.js, texturas NASA de alta resolución, capa de nubes, mapa de normales y brillo especular oceánico. Arrastrá el globo para rotarlo
- 📅 **Pronóstico de 5 días**: Muestra día, fecha exacta, ícono, máxima y mínima en la hora local de la ciudad
- 🌡️ **Toggle °C / °F**: Cambiá la unidad de temperatura sin hacer una nueva búsqueda
- 🕐 **Hora local correcta**: La hora mostrada es la de la ciudad buscada (no la del navegador)
- 🌅 **Amanecer y atardecer**: Horarios en la zona horaria local de la ciudad
- 💨 **Dirección del viento**: Velocidad + punto cardinal (N, NE, E, SE…)
- 📱 **Diseño responsive**: Funciona en dispositivos de cualquier tamaño

## 📊 Información Mostrada

### Clima Actual
- Temperatura actual con toggle °C / °F
- Sensación térmica
- Descripción de las condiciones
- Humedad
- Velocidad y dirección del viento
- Visibilidad
- Presión atmosférica
- Hora y fecha local de la ciudad
- Horario de amanecer y atardecer

### Pronóstico
- Temperatura máxima y mínima diaria
- Condiciones climáticas previstas
- 5 días de predicción con fecha exacta

## 🛠️ Tecnologías Utilizadas

- **HTML5** — Estructura semántica con atributos aria para accesibilidad
- **CSS3** — Estilos avanzados con gradientes y animaciones
- **JavaScript (Vanilla)** — Lógica de la aplicación sin dependencias adicionales
- **Three.js** — Globo terráqueo 3D con WebGL
- **OpenWeatherMap API** — Datos meteorológicos en tiempo real
- **Geolocation API** — Obtención de ubicación del usuario

## 🚀 Cómo Usar

1. **En la pantalla principal**, ingresá el nombre de una ciudad en el buscador
2. **Hacé clic en "Ver clima"** o presioná Enter
3. La aplicación mostrará:
   - Condiciones climáticas actuales
   - Detalles meteorológicos
   - Pronóstico de 5 días
   - Un tema visual basado en el clima

### Funciones Adicionales

- 📍 **Botón de geolocalización**: Obtené el clima de tu ubicación actual
- 🌡️ **Botón °F / °C**: Cambiá la unidad junto a la temperatura
- 🔙 **Botón Volver**: Regresá a la pantalla de búsqueda
- 💾 **Historial**: Hacé clic en ciudades recientes para búsquedas rápidas
- 🌐 **Globo interactivo**: Arrastrá con el mouse o con el dedo para rotarlo

## 🎨 Temas Visuales

La aplicación adapta su apariencia según el clima:
- ☀️ **Día despejado**: Gradientes cálidos y tonos solares
- ☁️ **Nublado**: Tonos grises y azules suaves
- 🌧️ **Lluvia**: Tonos oscuros y azules intensos
- ⛈️ **Tormenta**: Colores dramáticos y oscuros
- ❄️ **Nieve**: Tonos fríos y azulados
- 🌙 **Noche**: Tema nocturno oscuro

## ⚡ Optimizaciones Técnicas

- **Caché de 10 minutos**: Buscar la misma ciudad dos veces seguidas no genera un nuevo fetch
- **Cancelación de requests**: Si se inicia una nueva búsqueda antes de que termine la anterior, la petición vieja se cancela automáticamente con `AbortController`
- **Anti-spam**: El botón "Ver clima" se deshabilita durante la carga
- **Fix de errores**: El timeout del mensaje de error se reinicia correctamente si aparece uno nuevo

## 📁 Estructura de Archivos

```
weather-app/
├── index.html      # Estructura HTML
├── style.css       # Estilos y animaciones
├── app.js          # Lógica de la aplicación
├── tierra.jpg      # Textura fallback del globo
└── README.md       # Este archivo
```

## 🔑 API

La aplicación utiliza la API gratuita de **OpenWeatherMap** para datos meteorológicos y las texturas del globo provienen de los ejemplos oficiales de **Three.js** (NASA Earth textures).

Para usar tu propia API key:
1. Regístrate en [openweathermap.org](https://openweathermap.org)
2. Obtén tu API key
3. Reemplaza el valor de `API_KEY` en `app.js`

## 💾 Almacenamiento Local

Las búsquedas se guardan automáticamente en el almacenamiento local del navegador (localStorage), por lo que el historial persiste entre sesiones.

## 📱 Compatibilidad

- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Dispositivos móviles y de escritorio
- Requiere conexión a Internet

## 🌟 Características Destacadas

- **Sin dependencias externas** - Utiliza JavaScript vanilla puro
- **Animaciones suaves** - Transiciones CSS para mejor UX
- **Diseño atractivo** - Interfaz moderna y visualmente agradable
- **Información completa** - Todos los datos meteorológicos importantes
- **Experiencia inmersiva** - Efectos visuales que mejoran la experiencia

## 📝 Notas

- Los datos se obtienen en tiempo real de OpenWeatherMap
- La geolocalización requiere permiso del usuario
- Algunos navegadores pueden requerir HTTPS para acceso completo a ciertas funciones

---

**Desarrollado con ❤️ para entusiastas del clima y el desarrollo web**
