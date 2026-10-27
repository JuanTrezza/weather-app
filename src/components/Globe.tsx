import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import {
  AmbientLight,
  Color,
  DirectionalLight,
  FrontSide,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  TextureLoader,
  Vector2,
  WebGLRenderer,
  type Texture,
} from 'three';
import earthUrl from '../assets/textures/earth_atmos_2048.jpg';
import specularUrl from '../assets/textures/earth_specular_2048.jpg';
import normalUrl from '../assets/textures/earth_normal_2048.jpg';
import cloudsUrl from '../assets/textures/earth_clouds_1024.png';
import tierraUrl from '../assets/textures/tierra.webp';
import { prefiereMenosMovimiento } from '../utils/motion';

export interface GloboHandle {
  /** Gira el globo hasta dejar (lat, lon) de frente. Sin animación si hay reduced motion. */
  girarHacia: (lat: number, lon: number) => Promise<void>;
}

interface Props {
  /** false mientras la pantalla está oculta: se pausa la animación */
  activo: boolean;
  ref?: Ref<GloboHandle>;
}

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;

/** Diferencia angular más corta de `desde` a `hacia`, en (-π, π] */
const deltaAngular = (desde: number, hacia: number) => {
  const d = (((hacia - desde) % TAU) + TAU) % TAU;
  return d > Math.PI ? d - TAU : d;
};

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Globo terráqueo 3D con Three.js, arrastrable con mouse y touch */
export default function Globe({ activo, ref }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const control = useRef<{
    iniciar: () => void;
    detener: () => void;
    girarHacia: GloboHandle['girarHacia'];
  } | null>(null);
  const [sinWebGL, setSinWebGL] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      // Sin WebGL (o antes de montar) no hay nada que girar
      girarHacia: (lat, lon) => control.current?.girarHacia(lat, lon) ?? Promise.resolve(),
    }),
    [],
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    // Renderer (falla si el navegador no tiene WebGL: mostramos la imagen fija)
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      setSinWebGL(true);
      return;
    }
    let size = wrap.clientWidth || 280;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size, false);

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

    // ── Texturas (NASA / Three.js examples, empaquetadas con la app) ──
    const loader = new TextureLoader();
    const texturas: Texture[] = [];
    const cargar = (url: string, onError?: () => void) => {
      const tex = loader.load(url, undefined, undefined, onError);
      texturas.push(tex);
      return tex;
    };

    // ── Esfera terrestre ─────────────────────────
    const earthMat = new MeshPhongMaterial({
      // Si falla la textura principal, usamos tierra.webp
      map: cargar(earthUrl, () => {
        earthMat.map = cargar(tierraUrl);
        earthMat.needsUpdate = true;
      }),
      specularMap: cargar(specularUrl),
      normalMap: cargar(normalUrl),
      normalScale: new Vector2(0.6, 0.6),
      specular: new Color(0x4488aa),
      shininess: 18,
    });
    const earthMesh = new Mesh(new SphereGeometry(1, 64, 64), earthMat);
    scene.add(earthMesh);

    // ── Marcador de la ciudad (hijo de la Tierra, así gira con ella) ──
    const marcador = new Mesh(new SphereGeometry(0.022, 16, 16), new MeshBasicMaterial({ color: 0x4fc3f7 }));
    const auraMarcador = new Mesh(
      new SphereGeometry(0.05, 24, 24),
      new MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    marcador.add(auraMarcador);
    marcador.visible = false;
    earthMesh.add(marcador);

    // ── Capa de nubes ────────────────────────────
    const cloudsMesh = new Mesh(
      new SphereGeometry(1.012, 64, 64),
      new MeshPhongMaterial({
        map: cargar(cloudsUrl),
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      }),
    );
    scene.add(cloudsMesh);

    // ── Halo atmosférico (glow) ──────────────────
    const glowMesh = new Mesh(
      new SphereGeometry(1.08, 64, 64),
      new MeshPhongMaterial({
        color: 0x2277cc,
        side: FrontSide,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
      }),
    );
    scene.add(glowMesh);

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

    // El tamaño del canvas cambia con los breakpoints
    const resizeObserver = new ResizeObserver(() => {
      const nuevo = wrap.clientWidth;
      if (nuevo > 0 && nuevo !== size) {
        size = nuevo;
        renderer.setSize(size, size, false);
      }
    });
    resizeObserver.observe(wrap);

    // ── Loop de animación ────────────────────────
    let frameId: number | null = null;

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

        // Punto (lat, lon) sobre la esfera de Three.js (textura equirectangular, u = 0 en -180°)
        const latR = lat * RAD;
        const lonR = lon * RAD;
        marcador.position.set(Math.cos(lonR) * Math.cos(latR), Math.sin(latR), -Math.sin(lonR) * Math.cos(latR));
        marcador.visible = true;

        // Orientación que deja ese punto mirando a la cámara (eje +Z)
        const hacia = { x: latR, y: -Math.PI / 2 - lonR };
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

    // ── Limpieza al desmontar ────────────────────
    return () => {
      control.current?.detener();
      control.current = null;
      resizeObserver.disconnect();

      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', soltar);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', soltar);
      window.removeEventListener('touchmove', onTouchMove);

      for (const mesh of [earthMesh, marcador, auraMarcador, cloudsMesh, glowMesh]) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      for (const tex of texturas) tex.dispose();
      renderer.dispose();
    };
  }, []);

  // Pausar/reanudar según la pantalla visible (se declara después del efecto que crea la escena)
  useEffect(() => {
    if (activo) control.current?.iniciar();
    else control.current?.detener();
  }, [activo]);

  return (
    <div
      ref={wrapRef}
      className="relative aspect-square w-[min(72vw,300px)] cursor-grab active:cursor-grabbing md:w-[380px] lg:w-[440px]"
    >
      <div className="halo-globo" aria-hidden="true" />
      {sinWebGL ? (
        <img src={tierraUrl} alt="Mapa de la Tierra" className="relative block h-full w-full rounded-full object-cover" />
      ) : (
        <canvas
          ref={canvasRef}
          className="relative block h-full w-full rounded-full"
          role="img"
          aria-label="Globo terráqueo 3D. Arrastralo para girarlo."
        />
      )}
      {/* Sombra debajo del globo */}
      <div className="sombra-globo" aria-hidden="true" />
    </div>
  );
}
