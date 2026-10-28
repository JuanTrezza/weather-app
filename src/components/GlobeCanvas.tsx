import { useEffect, useImperativeHandle, useRef, type RefObject } from 'react';
import {
  AmbientLight,
  Color,
  DataTexture,
  DirectionalLight,
  FrontSide,
  ImageBitmapLoader,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Texture,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from 'three';
import colorUrl from '../assets/textures/earth_color_2048.webp';
import nubesUrl from '../assets/textures/earth_clouds_alpha_1024.webp';
import normalUrl from '../assets/textures/earth_normal_2048.webp';
import specularUrl from '../assets/textures/earth_specular_2048.webp';
import { prefiereMenosMovimiento } from '../utils/motion';

export interface GloboHandle {
  /** Gira el globo hasta dejar (lat, lon) de frente. Sin animación si hay reduced motion. */
  girarHacia: (lat: number, lon: number) => Promise<void>;
}

interface Props {
  handle: RefObject<GloboHandle | null>;
  /** false con la pantalla oculta, el globo fuera del viewport o la pestaña en segundo plano */
  animar: boolean;
  /** Ciudad buscada antes de que el 3D estuviera listo (el globo arranca mirándola) */
  destinoInicial: () => { lat: number; lon: number } | null;
  /** Primer frame dibujado: el componente padre hace el fundido desde la imagen fija */
  onListo: () => void;
  /** Sin WebGL o sin la textura principal: queda la imagen fija */
  onFallo: () => void;
  className: string;
}

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
const NORMAL_SCALE = 0.6;
const SPECULAR = new Color(0x4488aa);
const FUNDIDO_DETALLE_MS = 800;

/** Diferencia angular más corta de `desde` a `hacia`, en (-π, π] */
const deltaAngular = (desde: number, hacia: number) => {
  const d = (((hacia - desde) % TAU) + TAU) % TAU;
  return d > Math.PI ? d - TAU : d;
};

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Devuelve el hilo principal entre pasos de la inicialización (así no hay una tarea larga única) */
const ceder = () => new Promise<void>((r) => setTimeout(r));

/** Con createImageBitmap la imagen se decodifica fuera del hilo principal */
async function cargarTextura(url: string): Promise<Texture> {
  if (typeof createImageBitmap !== 'function') return new TextureLoader().loadAsync(url);
  const bitmap = await new ImageBitmapLoader().setOptions({ imageOrientation: 'flipY' }).loadAsync(url);
  const tex = new Texture(bitmap);
  tex.flipY = false; // ya viene invertida (WebGL ignora flipY con ImageBitmap)
  tex.needsUpdate = true;
  tex.addEventListener('dispose', () => bitmap.close());
  return tex;
}

/** Textura de 1×1 que ocupa el lugar del mapa de normales y del specular hasta que llegan */
function pixelNeutro() {
  const tex = new DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
  tex.needsUpdate = true;
  return tex;
}

/** Globo 3D con Three.js, arrastrable con mouse y touch. Se carga con React.lazy desde Globe. */
export default function GlobeCanvas({ handle, animar, destinoInicial, onListo, onFallo, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const control = useRef<{
    iniciar: () => void;
    detener: () => void;
    girarHacia: GloboHandle['girarHacia'];
  } | null>(null);
  const animarRef = useRef(animar);

  useImperativeHandle(
    handle,
    () => ({
      // Antes de estar listo no hay nada que girar (Globe recuerda el destino para el arranque)
      girarHacia: (lat, lon) => control.current?.girarHacia(lat, lon) ?? Promise.resolve(),
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelado = false;
    const recursos: { dispose: () => void }[] = [];
    let limpiarEventos = () => {};

    // Registra un recurso de GPU para liberarlo al desmontar (o ya mismo, si llegó tarde)
    const usar = <T extends { dispose: () => void }>(r: T) => {
      if (cancelado) r.dispose();
      else recursos.push(r);
      return r;
    };

    const iniciar = async () => {
      // ── Renderer (falla si el navegador no tiene WebGL: queda la imagen fija) ──
      let renderer: WebGLRenderer;
      try {
        renderer = usar(new WebGLRenderer({ canvas, antialias: true, alpha: true }));
      } catch {
        onFallo();
        return;
      }
      // Más resolución que 2x (1,5x en pantallas chicas) no se nota en un globo de 300 px y cuesta GPU
      const dprMax = window.matchMedia('(max-width: 767px)').matches ? 1.5 : 2;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprMax));
      let size = canvas.clientWidth || 280;
      renderer.setSize(size, size, false);

      // ── Texturas: primero color y nubes; normales y specular después, en segundo plano ──
      let color: Texture;
      let nubes: Texture;
      try {
        [color, nubes] = await Promise.all([cargarTextura(colorUrl), cargarTextura(nubesUrl)]);
      } catch {
        if (!cancelado) onFallo();
        return;
      }
      usar(color);
      usar(nubes);
      if (cancelado) return;

      // Escena y cámara
      const scene = new Scene();
      const camera = new PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.z = 2.4;

      // ── Iluminación ──────────────────────────────
      // Luz ambiente tenue (lado nocturno no queda completamente negro)
      scene.add(new AmbientLight(0x112244, 1.8));

      // Luz solar principal (viene del frente-izquierda-arriba)
      const sunLight = new DirectionalLight(0xfff5e0, 3.2);
      sunLight.position.set(4, 2, 5);
      scene.add(sunLight);

      // ── Esfera terrestre ─────────────────────────
      // Normales y specular arrancan apagados (con texturas de 1×1, para no recompilar el shader cuando llegan)
      const earthMat = usar(
        new MeshPhongMaterial({
          map: color,
          specularMap: usar(pixelNeutro()),
          normalMap: usar(pixelNeutro()),
          normalScale: new Vector2(0, 0),
          specular: new Color(0x000000),
          shininess: 18,
        }),
      );
      // Una sola esfera de radio 1 para la Tierra, las nubes y el halo (cada malla se escala): construirla cuesta
      const esfera = usar(new SphereGeometry(1, 64, 64));
      const earthMesh = new Mesh(esfera, earthMat);
      scene.add(earthMesh);

      // ── Marcador de la ciudad (hijo de la Tierra, así gira con ella) ──
      const marcador = new Mesh(
        usar(new SphereGeometry(0.022, 16, 16)),
        usar(new MeshBasicMaterial({ color: 0x4fc3f7 })),
      );
      const auraMarcador = new Mesh(
        usar(new SphereGeometry(0.05, 24, 24)),
        usar(new MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.35, depthWrite: false })),
      );
      marcador.add(auraMarcador);
      marcador.visible = false;
      earthMesh.add(marcador);

      // ── Capa de nubes (la textura es solo el canal alfa: las nubes son blancas) ──
      const cloudsMesh = new Mesh(
        esfera,
        usar(
          new MeshPhongMaterial({
            color: 0xffffff,
            alphaMap: nubes,
            transparent: true,
            opacity: 0.78,
            depthWrite: false,
          }),
        ),
      );
      cloudsMesh.scale.setScalar(1.012);
      scene.add(cloudsMesh);

      // ── Halo atmosférico (glow) ──────────────────
      const glowMesh = new Mesh(
        esfera,
        usar(
          new MeshPhongMaterial({
            color: 0x2277cc,
            side: FrontSide,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
          }),
        ),
      );
      glowMesh.scale.setScalar(1.08);
      scene.add(glowMesh);

      // ── Subida a la GPU y compilación, cada una en su propia tarea ──
      await ceder();
      if (cancelado) return;
      renderer.initTexture(color);
      await ceder();
      if (cancelado) return;
      renderer.initTexture(nubes);
      await ceder();
      if (cancelado) return;
      await renderer.compileAsync(scene, camera);
      await ceder();
      if (cancelado) return;

      // ── Giro animado hacia una ciudad ────────────
      let giro: {
        desdeX: number;
        desdeY: number;
        dx: number;
        dy: number;
        inicio: number;
        duracion: number;
        resolver: () => void;
      } | null = null;

      const terminarGiro = () => {
        giro?.resolver();
        giro = null;
      };

      // Rota la Tierra (y las nubes con ella) a una orientación absoluta
      const orientar = (x: number, y: number) => {
        cloudsMesh.rotation.x += x - earthMesh.rotation.x;
        cloudsMesh.rotation.y += y - earthMesh.rotation.y;
        earthMesh.rotation.x = x;
        earthMesh.rotation.y = y;
      };

      // Punto (lat, lon) sobre la esfera (textura equirectangular, u = 0 en -180°) y orientación que lo deja de frente
      const apuntar = (lat: number, lon: number) => {
        const latR = lat * RAD;
        const lonR = lon * RAD;
        marcador.position.set(Math.cos(lonR) * Math.cos(latR), Math.sin(latR), -Math.sin(lonR) * Math.cos(latR));
        marcador.visible = true;
        return { x: latR, y: -Math.PI / 2 - lonR };
      };

      const inicial = destinoInicial();
      if (inicial) {
        const hacia = apuntar(inicial.lat, inicial.lon);
        orientar(hacia.x, hacia.y);
      }

      // ── Interacción: arrastrar para rotar ────────
      let isDragging = false;
      let prevX = 0;
      let prevY = 0;
      let velX = 0;
      let velY = 0;

      const empezar = (x: number, y: number) => {
        terminarGiro(); // si el usuario agarra el globo, manda él
        isDragging = true;
        prevX = x;
        prevY = y;
      };
      const mover = (x: number, y: number) => {
        if (!isDragging) return;
        velX = (x - prevX) * 0.005;
        velY = (y - prevY) * 0.003;
        prevX = x;
        prevY = y;
      };
      const soltar = () => {
        isDragging = false;
      };

      const onMouseDown = (e: MouseEvent) => empezar(e.clientX, e.clientY);
      const onMouseMove = (e: MouseEvent) => mover(e.clientX, e.clientY);
      const onTouchStart = (e: TouchEvent) => {
        const t = e.touches[0];
        if (t) empezar(t.clientX, t.clientY);
      };
      const onTouchMove = (e: TouchEvent) => {
        const t = e.touches[0];
        if (t) mover(t.clientX, t.clientY);
      };

      canvas.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', soltar);
      window.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchend', soltar);
      window.addEventListener('touchmove', onTouchMove, { passive: true });

      let frameId: number | null = null;

      // El tamaño del canvas cambia con los breakpoints
      const resizeObserver = new ResizeObserver(() => {
        const nuevo = canvas.clientWidth;
        if (nuevo > 0 && nuevo !== size) {
          size = nuevo;
          renderer.setSize(size, size, false);
          if (frameId === null) renderer.render(scene, camera);
        }
      });
      resizeObserver.observe(canvas);

      limpiarEventos = () => {
        resizeObserver.disconnect();
        canvas.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', soltar);
        window.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchend', soltar);
        window.removeEventListener('touchmove', onTouchMove);
      };

      // Fundido de las normales y el brillo del océano cuando llegan sus texturas
      let detalle: number | null = null;
      const aplicarDetalle = (k: number) => {
        earthMat.normalScale.setScalar(NORMAL_SCALE * k);
        earthMat.specular.copy(SPECULAR).multiplyScalar(k);
      };

      // ── Loop de animación ────────────────────────
      const animate = (ahora: number) => {
        frameId = requestAnimationFrame(animate);

        if (giro) {
          const t = Math.min(1, (ahora - giro.inicio) / giro.duracion);
          const k = easeInOutCubic(t);
          orientar(giro.desdeX + giro.dx * k, giro.desdeY + giro.dy * k);
          if (t === 1) terminarGiro();
        } else if (isDragging) {
          earthMesh.rotation.y += velX;
          earthMesh.rotation.x += velY;
          cloudsMesh.rotation.y += velX;
          cloudsMesh.rotation.x += velY;
          velX *= 0.85;
          velY *= 0.85;
        } else if (!prefiereMenosMovimiento()) {
          // Auto-rotación suave (quieta si el usuario pidió menos movimiento)
          earthMesh.rotation.y += 0.0015;
          cloudsMesh.rotation.y += 0.0018; // nubes van un poco más rápido
        }

        if (detalle !== null) {
          const k = Math.min(1, (ahora - detalle) / FUNDIDO_DETALLE_MS);
          aplicarDetalle(k);
          if (k === 1) detalle = null;
        }

        // El marcador "late" suavemente
        if (marcador.visible) auraMarcador.scale.setScalar(1 + 0.25 * Math.sin(ahora / 300));

        renderer.render(scene, camera);
      };

      control.current = {
        iniciar: () => {
          if (frameId === null) frameId = requestAnimationFrame(animate);
        },
        detener: () => {
          if (frameId !== null) cancelAnimationFrame(frameId);
          frameId = null;
          terminarGiro();
        },
        girarHacia: (lat, lon) => {
          terminarGiro();
          const hacia = apuntar(lat, lon);
          const dx = deltaAngular(earthMesh.rotation.x, hacia.x);
          const dy = deltaAngular(earthMesh.rotation.y, hacia.y);

          if (frameId === null || prefiereMenosMovimiento()) {
            orientar(earthMesh.rotation.x + dx, earthMesh.rotation.y + dy);
            if (frameId === null) renderer.render(scene, camera);
            return Promise.resolve();
          }

          return new Promise<void>((resolver) => {
            const distancia = Math.min(1, Math.hypot(dx, dy) / Math.PI);
            giro = {
              desdeX: earthMesh.rotation.x,
              desdeY: earthMesh.rotation.y,
              dx,
              dy,
              inicio: performance.now(),
              duracion: 650 + 550 * distancia,
              resolver,
            };
          });
        },
      };

      // Primer frame y fundido cruzado desde la imagen fija
      renderer.render(scene, camera);
      if (animarRef.current) control.current.iniciar();
      onListo();

      // ── Detalle en segundo plano ─────────────────
      try {
        const [normal, specular] = await Promise.all([cargarTextura(normalUrl), cargarTextura(specularUrl)]);
        usar(normal);
        usar(specular);
        if (cancelado) return;
        const previas = [earthMat.normalMap, earthMat.specularMap];
        renderer.initTexture(normal);
        await ceder();
        if (cancelado) return;
        renderer.initTexture(specular);
        earthMat.normalMap = normal;
        earthMat.specularMap = specular;
        for (const tex of previas) tex?.dispose();
        if (frameId !== null && !prefiereMenosMovimiento()) {
          detalle = performance.now();
        } else {
          aplicarDetalle(1);
          if (frameId === null) renderer.render(scene, camera);
        }
      } catch {
        // Sin normales ni specular el globo se ve igual de bien, solo sin relieve ni brillo
      }
    };

    void iniciar();

    // ── Limpieza al desmontar ────────────────────
    return () => {
      cancelado = true;
      control.current?.detener();
      control.current = null;
      limpiarEventos();
      for (const r of recursos) r.dispose();
    };
  }, [destinoInicial, onFallo, onListo]);

  // Pausar/reanudar (se declara después del efecto que crea la escena)
  useEffect(() => {
    animarRef.current = animar;
    if (animar) control.current?.iniciar();
    else control.current?.detener();
  }, [animar]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
