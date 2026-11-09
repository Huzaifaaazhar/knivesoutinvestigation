import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LEVEL_Y, LEVELS, ROOMS, ROOM_BY_ID, ZONE_BY_ID, locate, type Level } from '../data/layout';
import { FURNISHINGS, PATHS, TREES, placementY, type Placement } from '../data/furnishings';
import { INTERACTABLES } from '../data/interactables';
import { FURNITURE, Tree } from './furniture';
import { VISUALS } from './props';
import { RoomShells, Stairs, Exterior } from './Architecture';
import { Doors } from './Doors';
import { M, worldPlane } from './kit';
import { runtime, useGame } from '../state/store';
import { routeTo, type Waypoint } from '../systems/navigation';
import { NPCs } from './npc/NPCs';
import { ConversationCamera, FlashbackStage, PlayerAvatar } from './npc/Cinematics';
import { MEMORY_BY_ID } from '../data/relations';

// ───────────────────────── Visibility ─────────────────────────

export function visibleFor(room: string): { levels: Set<number>; exterior: boolean } {
  if (ZONE_BY_ID[room]) return { levels: new Set([0]), exterior: true };
  const rm = ROOM_BY_ID[room];
  if (!rm) return { levels: new Set([0]), exterior: true };
  if (rm.level === 0) {
    const s = new Set<number>([0]);
    if (room === 'backhall') s.add(-1);
    if (room === 'hall' || room === 'stairhall') s.add(1);
    return { levels: s, exterior: true };
  }
  if (rm.level === 1) {
    const s = new Set<number>([1]);
    if (room === 'landing') s.add(0);
    return { levels: s, exterior: false };
  }
  const s = new Set<number>([-1]);
  if (room === 'servcorr') s.add(0);
  return { levels: s, exterior: false };
}

function placementRoom(p: Placement) {
  const id = locate(p.x, p.z, p.level);
  return id && ROOM_BY_ID[id] ? id : 'exterior';
}

// ───────────────────────── Furniture ─────────────────────────

const Piece = memo(function Piece({ p }: { p: Placement }) {
  const entry = FURNITURE[p.t];
  if (!entry) return null;
  const C = entry.C;
  return (
    <group position={[p.x, placementY(p), p.z]} rotation={[0, p.r ?? 0, 0]}>
      <C {...(p.p ?? {})} />
    </group>
  );
});

const FurnitureGroup = memo(function FurnitureGroup({ items }: { items: Placement[] }) {
  return (
    <>
      {items.map((p, i) => (
        <Piece key={i} p={p} />
      ))}
    </>
  );
});

// ───────────────────────── Interactable objects ─────────────────────────

const InteractableModels = memo(function InteractableModels({ level }: { level: Level | 'exterior' }) {
  const examined = useGame((s) => s.examined);
  return (
    <>
      {INTERACTABLES.filter((it) => it.model && (level === 'exterior' ? !!ZONE_BY_ID[it.room] : it.level === level && !ZONE_BY_ID[it.room])).map((it) => {
        if (it.kind === 'pickup' && examined.includes(it.id)) return null;
        const V = VISUALS[it.model!.visual];
        return (
          <group key={it.id} position={it.model!.pos} rotation={[0, it.model!.rotY ?? 0, 0]}>
            <V.C {...(it.model!.props ?? {})} />
          </group>
        );
      })}
    </>
  );
});

// ───────────────────────── Lighting ─────────────────────────

interface Anchor {
  x: number;
  y: number;
  z: number;
  level: Level | 'exterior';
  color: string;
  intensity: number;
  distance: number;
  flicker?: boolean;
}

function anchorsFromFurnishings(): Anchor[] {
  const out: Anchor[] = [];
  for (const p of FURNISHINGS) {
    const y = placementY(p);
    const room = placementRoom(p);
    const lv: Level | 'exterior' = room === 'exterior' ? 'exterior' : p.level;
    const pp = (p.p ?? {}) as Record<string, number>;
    switch (p.t) {
      case 'chandelier':
        out.push({ x: p.x, y: y - (pp.drop ?? 1) - 0.1, z: p.z, level: lv, color: '#ffc488', intensity: room === 'hall' ? 55 : 22, distance: room === 'hall' ? 16 : 11 });
        break;
      case 'pendant':
        out.push({ x: p.x, y: y - (pp.drop ?? 0.8) - 0.2, z: p.z, level: lv, color: '#ffc98e', intensity: 12, distance: 8 });
        break;
      case 'bareBulb':
        out.push({ x: p.x, y: y - (pp.drop ?? 0.5) - 0.1, z: p.z, level: lv, color: '#ffd7a0', intensity: 11, distance: 9 });
        break;
      case 'floorLamp':
        out.push({ x: p.x, y: y + 1.55, z: p.z, level: lv, color: '#ffbf7a', intensity: 7, distance: 6 });
        break;
      case 'tableLamp':
        out.push({ x: p.x, y: y + 0.4, z: p.z, level: lv, color: '#ffbf7a', intensity: 4, distance: 5 });
        break;
      case 'fireplace':
        if ((p.p as any)?.lit !== false) {
          const r = p.r ?? 0;
          out.push({ x: p.x + Math.sin(r) * 0.7, y: y + 0.5, z: p.z + Math.cos(r) * 0.7, level: lv, color: '#ff8a3a', intensity: 14, distance: 9, flicker: true });
        }
        break;
      case 'lampPost':
        out.push({ x: p.x, y: y + 3.5, z: p.z, level: 'exterior', color: '#f0b060', intensity: 30, distance: 14 });
        break;
      case 'portico':
        out.push({ x: p.x, y: 3.6, z: p.z + 1.4, level: 'exterior', color: '#f0b060', intensity: 22, distance: 10 });
        break;
    }
  }
  return out;
}

const POOL = 8;

function LightPool({ levels, exterior }: { levels: Set<number>; exterior: boolean }) {
  const anchors = useMemo(anchorsFromFurnishings, []);
  const lights = useRef<(THREE.PointLight | null)[]>([]);
  const assigned = useRef<(Anchor | null)[]>(new Array(POOL).fill(null));
  const timer = useRef(0);
  const { camera } = useThree();
  useFrame(({ clock }, dt) => {
    timer.current -= dt;
    if (timer.current <= 0) {
      timer.current = 0.25;
      const cands = anchors.filter((a) => (a.level === 'exterior' ? exterior : levels.has(a.level)));
      const cx = camera.position.x;
      const cy = camera.position.y;
      const cz = camera.position.z;
      cands.sort((a, b) => (a.x - cx) ** 2 + (a.y - cy) ** 2 * 4 + (a.z - cz) ** 2 - ((b.x - cx) ** 2 + (b.y - cy) ** 2 * 4 + (b.z - cz) ** 2));
      const chosen = cands.slice(0, POOL);
      // keep lights that are still chosen in their slots to avoid popping
      const next: (Anchor | null)[] = assigned.current.map((a) => (a && chosen.includes(a) ? a : null));
      for (const c of chosen) if (!next.includes(c)) next[next.indexOf(null)] = c;
      assigned.current = next;
    }
    const t = clock.elapsedTime;
    assigned.current.forEach((a, i) => {
      const L = lights.current[i];
      if (!L) return;
      if (!a) {
        L.intensity = 0;
        return;
      }
      L.position.set(a.x, a.y, a.z);
      L.color.set(a.color);
      L.distance = a.distance;
      const target = a.flicker ? a.intensity * (0.8 + Math.sin(t * 11 + i) * 0.1 + Math.sin(t * 23) * 0.08) : a.intensity;
      L.intensity = THREE.MathUtils.damp(L.intensity, target, 8, dt);
    });
  });
  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <pointLight key={i} ref={(l) => (lights.current[i] = l)} intensity={0} decay={2} />
      ))}
    </>
  );
}

function Atmosphere({ exterior }: { exterior: boolean }) {
  const hemi = useRef<THREE.HemisphereLight>(null);
  const moon = useRef<THREE.DirectionalLight>(null);
  const flash = useRef(0);
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.FogExp2('#0b0f17', 0.02);
    scene.background = new THREE.Color('#06080c');
    const onFlash = (e: Event) => {
      const near = (e as CustomEvent).detail?.near;
      flash.current = near ? 1 : 0.4;
    };
    window.addEventListener('ko-lightning', onFlash);
    return () => window.removeEventListener('ko-lightning', onFlash);
  }, [scene]);
  useFrame((_, dt) => {
    const room = runtime.room;
    const outdoors = !!ZONE_BY_ID[room];
    const fog = scene.fog as THREE.FogExp2;
    fog.density = THREE.MathUtils.damp(fog.density, outdoors ? 0.022 : 0.006, 2, dt);
    flash.current = Math.max(0, flash.current - dt * 3.2);
    const f = flash.current > 0.5 || (flash.current > 0.2 && flash.current < 0.35) ? flash.current : 0;
    if (hemi.current) hemi.current.intensity = (outdoors ? 0.55 : runtime.level < 0 ? 0.35 : 0.6) + f * (outdoors ? 3 : 0.6);
    if (moon.current) moon.current.intensity = exterior ? 0.35 + f * 4 : 0;
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={['#3a4868', '#2a1c14', 0.6]} />
      <directionalLight ref={moon} position={[-40, 60, 30]} color="#9fb0d8" intensity={0.35} />
    </>
  );
}

// ───────────────────────── Grounds ─────────────────────────

function SkyDome() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {},
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `,
        fragmentShader: `varying vec3 vP;
          float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
          void main(){
            float y = clamp(vP.y, -0.2, 1.0);
            vec3 top = vec3(0.035,0.045,0.07);
            vec3 hor = vec3(0.09,0.10,0.13);
            vec3 c = mix(hor, top, smoothstep(0.0, 0.6, y));
            // moon glow
            vec3 md = normalize(vec3(-0.45, 0.42, -0.78));
            float m = max(dot(vP, md), 0.0);
            c += vec3(0.55,0.6,0.75) * pow(m, 900.0) * 2.0 + vec3(0.12,0.14,0.2) * pow(m, 18.0);
            // cloud banding
            float n = h(floor(vP.xz * 9.0 + vP.y * 3.0));
            c *= 0.9 + 0.1 * n;
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    [],
  );
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => ref.current?.position.copy(camera.position));
  return (
    <mesh ref={ref} material={mat} renderOrder={-1}>
      <sphereGeometry args={[400, 32, 16]} />
    </mesh>
  );
}

const Grounds = memo(function Grounds() {
  const grass = M.grass();
  const holes = { x0: -16, z0: -14, x1: 16, z1: 10 };
  const W = 260;
  const rects = [
    { x0: -W, z0: -W, x1: W, z1: holes.z0 },
    { x0: -W, z0: holes.z1, x1: W, z1: W },
    { x0: -W, z0: holes.z0, x1: holes.x0, z1: holes.z1 },
    { x0: holes.x1, z0: holes.z0, x1: W, z1: holes.z1 },
  ];
  const pathMat = (k: string) => (k === 'gravel' ? M.gravel() : k === 'stone' ? M.stone() : M.mud());
  return (
    <group>
      {rects.map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[(r.x0 + r.x1) / 2, -0.03, (r.z0 + r.z1) / 2]} geometry={worldPlane(r.x1 - r.x0, r.z1 - r.z0)} material={grass} />
      ))}
      {PATHS.map((p, i) => (
        <mesh
          key={`p${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[(p.x0 + p.x1) / 2, p.kind === 'mud' ? -0.012 : -0.02 + i * 0.0007, (p.z0 + p.z1) / 2]}
          geometry={worldPlane(p.x1 - p.x0, p.z1 - p.z0)}
          material={pathMat(p.kind)}
        />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.016, 22]} material={M.gravel()}>
        <circleGeometry args={[7, 40]} />
      </mesh>
      {/* county road beyond the gate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.018, 54]} material={M.color('#141518', 0.6)}>
        <planeGeometry args={[220, 9]} />
      </mesh>
      {TREES.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <Tree h={t.h} c={t.c} seed={t.seed} />
        </group>
      ))}
      <ForestRing />
      {/* fallen leaves */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, 20]}>
        <planeGeometry args={[90, 60]} />
        <meshStandardMaterial map={leafTex()} transparent depthWrite={false} roughness={1} />
      </mesh>
    </group>
  );
});

let _leaf: THREE.Texture | null = null;
function leafTex() {
  if (_leaf) return _leaf;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  const cols = ['#8a3a1c', '#a8541f', '#6b2a1a', '#b8862f', '#5d3b1a'];
  for (let i = 0; i < 900; i++) {
    g.fillStyle = cols[i % cols.length];
    g.globalAlpha = 0.4 + Math.random() * 0.5;
    g.beginPath();
    g.ellipse(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 4, 1 + Math.random() * 2, Math.random() * 3, 0, Math.PI * 2);
    g.fill();
  }
  _leaf = new THREE.CanvasTexture(c);
  _leaf.colorSpace = THREE.SRGBColorSpace;
  _leaf.wrapS = _leaf.wrapT = THREE.RepeatWrapping;
  _leaf.repeat.set(20, 14);
  return _leaf;
}

/** Instanced silhouettes of woodland beyond the estate hedge. */
function ForestRing() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = 160;
  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 62 + ((i * 37) % 30);
      const h = 10 + ((i * 13) % 9);
      m.compose(new THREE.Vector3(Math.cos(a) * r, h / 2, Math.sin(a) * r), q, new THREE.Vector3(3 + (i % 3), h, 3 + (i % 3)));
      ref.current!.setMatrixAt(i, m);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={M.foliage('#141a14')}>
      <coneGeometry args={[1, 1, 6]} />
    </instancedMesh>
  );
}

// ───────────────────────── Rain ─────────────────────────

function Rain() {
  const count = 2600;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 50;
      const y = Math.random() * 22;
      const z = (Math.random() - 0.5) * 50;
      pos.set([x, y, z, x + 0.03, y - 0.5, z + 0.02], i * 6);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const ref = useRef<THREE.LineSegments>(null);
  useFrame(({ camera }, dt) => {
    const ls = ref.current;
    if (!ls) return;
    const indoors = !ZONE_BY_ID[runtime.room] && useGame.getState().phase === 'playing';
    ls.visible = !indoors;
    if (indoors) return;
    const a = geo.attributes.position as THREE.BufferAttribute;
    const arr = a.array as Float32Array;
    const fall = 16 * dt;
    const cx = camera.position.x;
    const cz = camera.position.z;
    for (let i = 0; i < count; i++) {
      const o = i * 6;
      arr[o + 1] -= fall;
      arr[o + 4] -= fall;
      if (arr[o + 4] < -0.1) {
        const x = cx + (Math.random() - 0.5) * 50;
        const z = cz + (Math.random() - 0.5) * 50;
        const y = 18 + Math.random() * 6;
        arr[o] = x;
        arr[o + 1] = y;
        arr[o + 2] = z;
        arr[o + 3] = x + 0.03;
        arr[o + 4] = y - 0.5;
        arr[o + 5] = z + 0.02;
      }
    }
    a.needsUpdate = true;
  });
  return (
    <lineSegments ref={ref} geometry={geo} frustumCulled={false}>
      <lineBasicMaterial color="#9aa8c2" transparent opacity={0.5} depthWrite={false} />
    </lineSegments>
  );
}

// ───────────────────────── Guide trail ─────────────────────────

function GuideTrail() {
  const navTarget = useGame((s) => s.navTarget);
  const room = useGame((s) => s.player.room);
  const route = useRef<Waypoint[] | null>(null);
  const motes = useRef<THREE.InstancedMesh>(null);
  const beacon = useRef<THREE.Group>(null);
  useEffect(() => {
    route.current = navTarget ? routeTo({ x: runtime.x, z: runtime.z, level: runtime.level }, room, navTarget) : null;
  }, [navTarget, room]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const r = route.current;
    const m = motes.current;
    const b = beacon.current;
    if (!m || !b) return;
    if (!r || !r.length || !navTarget) {
      m.count = 0;
      b.visible = false;
      return;
    }
    // drop waypoints we have passed
    while (r.length > 1 && r[0].level === runtime.level && Math.hypot(r[0].x - runtime.x, r[0].z - runtime.z) < 1.0) r.shift();
    const next = r[0];
    b.visible = next.level === runtime.level;
    const ny = LEVEL_Y[next.level];
    b.position.set(next.x, ny, next.z);
    b.rotation.y = clock.elapsedTime * 0.8;
    // motes from the player toward the next waypoint
    const n = 14;
    const dx = next.x - runtime.x;
    const dz = next.z - runtime.z;
    const dist = Math.hypot(dx, dz);
    let k = 0;
    if (next.level === runtime.level) {
      for (let i = 1; i <= n; i++) {
        const t = ((i + clock.elapsedTime * 1.5) % n) / n;
        if (t * dist < 0.8) continue;
        tmp.position.set(runtime.x + dx * t, runtime.y + 0.25 + Math.sin(t * 9 + clock.elapsedTime * 2) * 0.05, runtime.z + dz * t);
        const s = 0.6 + Math.sin(t * Math.PI) * 0.6;
        tmp.scale.setScalar(s);
        tmp.updateMatrix();
        m.setMatrixAt(k++, tmp.matrix);
      }
    }
    m.count = k;
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={motes} args={[undefined, undefined, 16]} frustumCulled={false}>
        <sphereGeometry args={[0.03, 6, 4]} />
        <meshBasicMaterial color="#e6c98a" transparent opacity={0.8} />
      </instancedMesh>
      <group ref={beacon} visible={false}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.25, 0.4, 2.4, 16, 1, true]} />
          <meshBasicMaterial color="#b69a65" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.35, 0.42, 32]} />
          <meshBasicMaterial color="#e6c98a" transparent opacity={0.7} />
        </mesh>
      </group>
    </>
  );
}

// ───────────────────────── Assembly ─────────────────────────

export function World() {
  const room = useGame((s) => s.player.room);
  const phase = useGame((s) => s.phase);
  const memoryRoom = useGame((s) => {
    const a = s.flashback ? MEMORY_BY_ID[s.flashback.id].actors[0] : null;
    return a ? locate(a.x, a.z, a.level) : null;
  });
  const vis = phase === 'playing' ? visibleFor(memoryRoom ?? room) : { levels: new Set([0]), exterior: true };
  const byLevel = useMemo(() => {
    const out: Record<string, Placement[]> = { exterior: [], '-1': [], '0': [], '1': [] };
    for (const p of FURNISHINGS) {
      const rm = placementRoom(p);
      out[rm === 'exterior' ? 'exterior' : String(p.level)].push(p);
    }
    return out;
  }, []);
  const roomsByLevel = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const lv of LEVELS) out[lv] = ROOMS.filter((r) => r.level === lv).map((r) => r.id);
    return out;
  }, []);
  const levelsKey = [...vis.levels].sort().join(',');
  const levelSet = useMemo(() => new Set(levelsKey.split(',').map(Number)), [levelsKey]);
  return (
    <>
      <Atmosphere exterior={vis.exterior} />
      <LightPool levels={levelSet} exterior={vis.exterior} />
      <SkyDome />
      {LEVELS.map((lv) => (
        <group key={lv} visible={levelSet.has(lv)}>
          <RoomShells roomIds={roomsByLevel[lv]} />
          <FurnitureGroup items={byLevel[String(lv)]} />
          <InteractableModels level={lv} />
        </group>
      ))}
      <Stairs />
      <Doors levels={new Set(LEVELS)} />
      <group visible={vis.exterior}>
        <Exterior />
        <Grounds />
        <FurnitureGroup items={byLevel.exterior} />
        <InteractableModels level="exterior" />
      </group>
      <Rain />
      <GuideTrail />
      <NPCs />
      <PlayerAvatar />
      <ConversationCamera />
      <FlashbackStage />
    </>
  );
}
