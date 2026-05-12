# 🌍 WeatherWorld - Clima Global

Una aplicación web moderna e interactiva para consultar el clima en tiempo real de cualquier lugar del planeta.

## 🎯 Características

- 🔍 **Búsqueda por ciudad**: Ingresa el nombre de cualquier ciudad para obtener información del clima
- 📍 **Geolocalización**: Usa tu ubicación actual para obtener el clima automáticamente
- 📋 **Historial de búsquedas**: Acceso rápido a las últimas 5 ciudades consultadas
- 🌤️ **Temas dinámicos**: El fondo cambia según las condiciones climáticas
- ⭐ **Efecto visual de estrellas**: Animación de estrellas titilantes en el fondo
- 🌐 **Globo terráqueo interactivo**: Visualización 3D del planeta que rota continuamente
- 📅 **Pronóstico de 5 días**: Predicción del clima para los próximos días
- 📱 **Diseño responsive**: Funciona perfectamente en dispositivos de cualquier tamaño

## 📊 Información Mostrada

### Clima Actual
- Temperatura actual
- Sensación térmica
- Descripción de las condiciones
- Humedad
- Velocidad del viento
- Visibilidad
- Presión atmosférica

### Pronóstico
- Temperatura máxima y mínima diaria
- Condiciones climáticas previstas
- 5 días de predicción

## 🛠️ Tecnologías Utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Estilos avanzados con gradientes y animaciones
- **JavaScript (Vanilla)** - Lógica de la aplicación sin dependencias externas
- **OpenWeatherMap API** - Datos meteorológicos en tiempo real
- **Geolocation API** - Obtención de ubicación del usuario

## 🚀 Cómo Usar

1. **En la pantalla principal**, ingresa el nombre de una ciudad en el buscador
2. **Haz clic en "Ver clima"** o presiona Enter
3. La aplicación mostrará:
   - Condiciones climáticas actuales
   - Detalles meteorológicos
   - Pronóstico de 5 días
   - Un tema visual basado en el clima

### Funciones Adicionales

- 📍 **Botón de geolocalización**: Obtén el clima de tu ubicación actual
- 🔙 **Botón Volver**: Regresa a la pantalla de búsqueda
- 💾 **Historial**: Haz clic en ciudades recientes para búsquedas rápidas

## 🎨 Temas Visuales

La aplicación adapta su apariencia según el clima:
- ☀️ **Día despejado**: Gradientes cálidos y tonos solares
- ☁️ **Nublado**: Tonos grises y azules suaves
- 🌧️ **Lluvia**: Tonos oscuros y azules intensos
- ⛈️ **Tormenta**: Colores dramáticos y oscuros
- ❄️ **Nieve**: Tonos fríos y azulados
- 🌙 **Noche**: Tema nocturno oscuro

## 📁 Estructura de Archivos

```
weather-app/
├── index.html      # Estructura HTML
├── style.css       # Estilos y animaciones
├── app.js          # Lógica de la aplicación
├── tierra.jpg      # Textura del globo terráqueo
└── README.md       # Este archivo
```

## 🔑 API Key

La aplicación utiliza la API gratuita de **OpenWeatherMap**. La clave API está incluida en el código.

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
