import { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import * as THREE from 'three';
import { INTERACTABLE_BY_ID, type Hotspot } from '../data/interactables';
import { EVIDENCE_BY_ID, CATEGORY_LABEL } from '../data/evidence';
import { placeName } from '../data/layout';
import { keyHotspots, useGame } from '../state/store';
import { VISUALS } from '../world/props';
import { DocumentView } from './DocumentView';
import { audio } from '../audio/audio';

function HotspotMarker({ h, seen, active, onClick }: { h: Hotspot; seen: boolean; active: boolean; onClick: () => void }) {
  return (
    <Html position={h.at} center zIndexRange={[30, 20]}>
      <button
        data-hotspot={h.id}
        onClick={onClick}
        aria-label={seen ? h.label : 'Examine detail'}
        className="group relative flex h-9 w-9 items-center justify-center"
      >
        {!seen && <span className="pulse-ring absolute h-5 w-5 rounded-full border border-gold/80" />}
        <span className={`h-3 w-3 rounded-full border-2 transition ${active ? 'scale-125 border-ivory bg-blood' : seen ? 'border-gold bg-gold/70' : 'border-gold bg-shadow/40 group-hover:bg-gold/40'}`} />
        {seen && <span className="pointer-events-none absolute left-9 whitespace-nowrap rounded-sm bg-shadow/70 px-2 py-0.5 font-ui text-[10px] text-ivory/90">{h.label}</span>}
      </button>
    </Html>
  );
}

function Turntable({ id, onDetail, active }: { id: string; onDetail: (h: string) => void; active: string | null }) {
  const def = INTERACTABLE_BY_ID[id];
  const key = def.inspectVisual?.visual ?? def.model?.visual ?? 'letter';
  const V = VISUALS[key];
  const props = def.inspectVisual?.props ?? def.model?.props ?? {};
  const seen = useGame((s) => s.details[id] ?? []);
  const reduced = useGame((s) => s.settings.reducedMotion);
  const [touched, setTouched] = useState(false);
  const r = def.inspectVisual?.distance ? def.inspectVisual.distance / 2.4 : V.radius;
  const center = useMemo(() => new THREE.Vector3(...V.center), [V]);
  const isWall = key === 'portrait' || key === 'trellis' || key === 'knifeWheel' || key === 'latch' || key === 'plaque' || key === 'fuseBox';
  const camPos: [number, number, number] = isWall ? [center.x + r * 0.4, center.y + r * 0.15, center.z + r * 2.4] : [center.x + r * 1.4, center.y + r * 1.5, center.z + r * 1.9];
  return (
    <Canvas
      camera={{ position: camPos, fov: 38, near: 0.01, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.25;
      }}
      onPointerDown={() => setTouched(true)}
    >
      <ambientLight intensity={0.5} color="#b8a890" />
      <spotLight position={[center.x + r * 3, center.y + r * 4, center.z + r * 3]} angle={0.6} penumbra={0.8} intensity={60 * r * r + 8} color="#ffd9a8" />
      <pointLight position={[center.x - r * 3, center.y + r, center.z - r * 2]} intensity={20 * r * r + 3} color="#8aa0d0" />
      <pointLight position={[center.x, center.y - r * 2, center.z + r * 2]} intensity={6 * r * r + 1} color="#ff9a60" />
      <Suspense fallback={null}>
        <group>
          <V.C {...props} />
          {(def.hotspots ?? [])
            .filter((h) => h.at)
            .map((h) => (
              <HotspotMarker key={h.id} h={h} seen={seen.includes(h.id)} active={active === h.id} onClick={() => onDetail(h.id)} />
            ))}
        </group>
      </Suspense>
      {!isWall && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, -0.002, center.z]}>
          <circleGeometry args={[r * 2.2, 48]} />
          <meshStandardMaterial color="#1a1310" roughness={0.9} />
        </mesh>
      )}
      <OrbitControls
        target={center}
        enablePan={false}
        minDistance={r * 0.7}
        maxDistance={r * 5}
        autoRotate={!touched && !reduced && !isWall}
        autoRotateSpeed={0.6}
        enableDamping
        minPolarAngle={0.15}
        maxPolarAngle={isWall ? Math.PI * 0.62 : Math.PI * 0.55}
        minAzimuthAngle={isWall ? -0.9 : -Infinity}
        maxAzimuthAngle={isWall ? 0.9 : Infinity}
      />
    </Canvas>
  );
}

export function InspectionOverlay() {
  const id = useGame((s) => s.inspecting);
  const overlay = useGame((s) => s.overlay);
  const seen = useGame((s) => (id ? s.details[id] ?? [] : []));
  const collected = useGame((s) => {
    const ev = id ? INTERACTABLE_BY_ID[id]?.evidence : undefined;
    return ev ? !!s.evidence[ev] : false;
  });
  const [active, setActive] = useState<string | null>(null);
  const [loupe, setLoupe] = useState(true);
  if (overlay !== 'inspect' || !id) return null;
  const def = INTERACTABLE_BY_ID[id];
  const hotspots = def.hotspots ?? [];
  const keys = keyHotspots(id);
  const keySeen = keys.filter((k) => seen.includes(k)).length;
  const ev = def.evidence ? EVIDENCE_BY_ID[def.evidence] : null;
  const canCollect = !!ev && !collected && (keySeen > 0 || keys.length === 0);
  const activeHs = hotspots.find((h) => h.id === active);
  const onDetail = (hid: string) => {
    setActive(hid);
    if (!seen.includes(hid)) audio.play('pencil');
    useGame.getState().seeDetail(id, hid);
  };
  const close = () => {
    setActive(null);
    useGame.getState().closeOverlay();
  };

  return (
    <motion.div
      className="fixed inset-0 z-20 flex flex-col bg-[radial-gradient(ellipse_at_center,rgba(36,24,21,0.82),rgba(13,13,15,0.97))]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-testid="inspection"
    >
      <header className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-8 sm:pt-7">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-gold/70">
            {placeName(def.room)}
            {ev && <span className="ml-3 text-blood">{ev.id} · {CATEGORY_LABEL[ev.category]}</span>}
          </div>
          <h2 className="mt-1 font-title text-2xl text-ivory sm:text-3xl">{def.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          {def.kind === 'document' && (
            <button
              onClick={() => setLoupe((l) => !l)}
              className={`hidden h-10 items-center gap-2 rounded-full border px-3 text-[11px] uppercase tracking-widest sm:flex ${loupe ? 'border-gold text-gold' : 'border-ivory/30 text-ivory/60'}`}
              aria-pressed={loupe}
            >
              <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current" /> Loupe
            </button>
          )}
          <button data-testid="close-inspection" onClick={close} className="h-10 rounded-full border border-ivory/30 px-4 text-[11px] uppercase tracking-widest text-ivory/80 hover:border-gold hover:text-gold">
            Return <span className="ml-1 hidden font-mono text-ivory/40 sm:inline">Esc</span>
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {def.kind === 'document' && def.document ? (
          <div className="absolute inset-0 flex items-center justify-center overflow-auto p-4 scroll-quiet">
            <motion.div initial={{ y: 40, rotate: -3, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}>
              <DocumentView doc={def.document} hotspots={hotspots} seen={seen} onDetail={onDetail} loupe={loupe} />
            </motion.div>
          </div>
        ) : (
          <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
            <Turntable id={id} onDetail={onDetail} active={active} />
            <div className="pointer-events-none absolute inset-x-0 top-2 text-center font-ui text-[11px] text-ivory/40">Drag to turn · scroll or pinch to look closer · touch the rings</div>
          </div>
        )}
      </div>

      <footer className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-7">
        <div className="min-h-[4.5rem] max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div key={active ?? 'obs'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {activeHs ? (
                <>
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">{activeHs.label}</div>
                  <p className="mt-1 font-display text-lg leading-snug text-ivory/90" data-testid="detail-text">{activeHs.detail}</p>
                </>
              ) : (
                <p className="font-display text-lg italic leading-snug text-ivory/70">{def.observation}</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {hotspots.length > 0 && (
            <div className="font-mono text-[11px] text-ivory/50" data-testid="detail-count">
              Details noticed <span className="text-gold">{seen.filter((s) => hotspots.some((h) => h.id === s)).length}</span> / {hotspots.length}
            </div>
          )}
          {ev &&
            (collected ? (
              <div className="flex items-center gap-2 border border-gold/40 px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-gold" data-testid="collected">
                ✓ In the evidence folder
              </div>
            ) : (
              <button
                data-testid="collect"
                disabled={!canCollect}
                onClick={() => useGame.getState().collectEvidence(id)}
                title={canCollect ? '' : 'Look closer first'}
                className="border border-blood bg-burgundy px-5 py-2.5 font-title text-xs uppercase tracking-[0.3em] text-ivory transition enabled:hover:bg-blood disabled:cursor-not-allowed disabled:border-ivory/15 disabled:bg-transparent disabled:text-ivory/35"
              >
                {canCollect ? 'Bag & tag as evidence' : 'Examine closely to log'}
              </button>
            ))}
        </div>
      </footer>
    </motion.div>
  );
}
