import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { useGame } from './state/store';
import { usePersistence } from './state/persistence';
import { World } from './world/Scene';
import { PlayerController } from './player/PlayerController';
import { IntroCamera } from './player/IntroCamera';
import { input, isTouchDevice } from './player/input';
import { BootScreen, Invitation, Opening } from './ui/Opening';
import { Crosshair, CornerHint, FadeCurtain, FirstSteps, InteractionPrompt, RoomCard, TargetAnchor, TargetMarker, Toasts } from './ui/HUD';
import { TouchControls } from './ui/TouchControls';
import { PauseMenu } from './ui/PauseMenu';
import { InspectionOverlay } from './inspection/InspectionOverlay';
import { Notebook } from './notebook/Notebook';
import { EvidenceFolder } from './evidence/EvidenceFolder';
import { FloorPlan } from './map/FloorPlan';
import { ConversationUI, ObserveCard } from './ui/Conversation';
import { FlashbackUI } from './ui/Flashback';
import { FamilyTree } from './relations/FamilyTree';
import { Album } from './relations/Album';

export default function App() {
  usePersistence();
  const phase = useGame((s) => s.phase);
  const overlay = useGame((s) => s.overlay);
  const quality = useGame((s) => s.settings.quality);
  const grain = useGame((s) => s.settings.grain);
  const [touch] = useState(() => {
    const t = isTouchDevice();
    input.touch = t;
    return t;
  });
  const playing = phase === 'playing';
  const cinematic = overlay === 'conversation' || overlay === 'flashback';
  const dimmed = playing && overlay !== 'none' && !cinematic;

  useEffect(() => {
    // keep the browser from scrolling or zooming the page
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', prevent);
    return () => document.removeEventListener('gesturestart', prevent);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-shadow">
      <div
        className={`absolute inset-0 transition-[filter] duration-700 ${dimmed ? 'blur-[3px] brightness-[0.45] saturate-50' : ''} ${overlay === 'flashback' ? 'sepia-[0.85] contrast-[1.1] brightness-[0.95]' : ''}`}
        data-testid="world"
      >
        <Canvas
          dpr={quality === 'high' ? [1, 1.75] : [0.75, 1]}
          frameloop={dimmed && overlay !== 'pause' && overlay !== 'relations' && overlay !== 'album' ? 'demand' : 'always'}
          camera={{ fov: 68, near: 0.05, far: 600, position: [0, 20, 150] }}
          gl={{ antialias: quality === 'high', powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.15;
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          <Suspense fallback={null}>
            <World />
          </Suspense>
          {playing ? <PlayerController /> : <IntroCamera />}
          {playing && <TargetAnchor />}
        </Canvas>
      </div>

      {playing && (
        <>
          <Crosshair />
          <TargetMarker />
          <RoomCard />
          <InteractionPrompt />
          <CornerHint />
          <ObserveCard />
          <FirstSteps />
          {touch && <TouchControls />}
        </>
      )}
      <Toasts />

      <AnimatePresence>
        {playing && overlay === 'inspect' && <InspectionOverlay key="inspect" />}
        {playing && overlay === 'notebook' && <Notebook key="notebook" />}
        {playing && overlay === 'folder' && <EvidenceFolder key="folder" />}
        {playing && overlay === 'map' && <FloorPlan key="map" />}
        {playing && overlay === 'pause' && <PauseMenu key="pause" />}
        {playing && overlay === 'conversation' && <ConversationUI key="conversation" />}
        {playing && overlay === 'flashback' && <FlashbackUI key="flashback" />}
        {playing && overlay === 'relations' && <FamilyTree key="relations" />}
        {playing && overlay === 'album' && <Album key="album" />}
      </AnimatePresence>

      <Opening />
      <Invitation />
      <BootScreen />
      <FadeCurtain />

      <div className="vignette" />
      {grain && <div className="grain" />}
    </div>
  );
}
