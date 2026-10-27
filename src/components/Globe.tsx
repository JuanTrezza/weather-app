import { useEffect, useRef, useState } from 'react';
import {
  AmbientLight,
  Color,
  DirectionalLight,
  FrontSide,
  Mesh,
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

interface Props {
  /** false mientras la pantalla está oculta: se pausa la animación */
  activo: boolean;
}

/** Globo terráqueo 3D con Three.js, arrastrable con mouse y touch */
export default function Globe({ activo }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animacion = useRef<{ iniciar: () => void; detener: () => void } | null>(null);
  const [sinWebGL, setSinWebGL] = useState(false);

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

    // ── Interacción: arrastrar para rotar ────────
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let velX = 0;
    let velY = 0;

    const empezar = (x: number, y: number) => {
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

    // El tamaño del canvas cambia con el breakpoint de 480px
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

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      if (isDragging) {
        earthMesh.rotation.y += velX;
        earthMesh.rotation.x += velY;
        cloudsMesh.rotation.y += velX;
        cloudsMesh.rotation.x += velY;
        velX *= 0.85;
        velY *= 0.85;
      } else {
        // Auto-rotación suave
        earthMesh.rotation.y += 0.0015;
        cloudsMesh.rotation.y += 0.0018; // nubes van un poco más rápido
      }

      renderer.render(scene, camera);
    };

    animacion.current = {
      iniciar: () => {
        if (frameId === null) animate();
      },
      detener: () => {
        if (frameId !== null) cancelAnimationFrame(frameId);
        frameId = null;
      },
    };

    // ── Limpieza al desmontar ────────────────────
    return () => {
      animacion.current?.detener();
      animacion.current = null;
      resizeObserver.disconnect();

      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', soltar);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', soltar);
      window.removeEventListener('touchmove', onTouchMove);

      for (const mesh of [earthMesh, cloudsMesh, glowMesh]) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      for (const tex of texturas) tex.dispose();
      renderer.dispose();
    };
  }, []);

  // Pausar/reanudar según la pantalla visible (se declara después del efecto que crea la escena)
  useEffect(() => {
    if (activo) animacion.current?.iniciar();
    else animacion.current?.detener();
  }, [activo]);

  return (
    <div
      ref={wrapRef}
      className="globo-wrap relative mb-12 h-[280px] w-[280px] cursor-grab active:cursor-grabbing max-[480px]:h-[200px] max-[480px]:w-[200px]"
    >
      {sinWebGL ? (
        <img
          src={tierraUrl}
          alt="Mapa de la Tierra"
          className="block h-full w-full rounded-full object-cover"
        />
      ) : (
        <canvas
          ref={canvasRef}
          className="block h-full w-full rounded-full"
          role="img"
          aria-label="Globo terráqueo 3D. Arrastralo para girarlo."
        />
      )}
      {/* Sombra debajo del globo */}
      <div className="sombra-globo" aria-hidden="true" />
    </div>
  );
}
