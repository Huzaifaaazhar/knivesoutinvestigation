/**
 * First-person controller: WASD / joystick movement with acceleration,
 * smoothed mouse / swipe look, sub-stepped collision, stairs, head bob,
 * footsteps, room tracking and interaction targeting.
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LEVEL_Y, ROOM_BY_ID, ZONE_BY_ID, locate, type Level } from '../data/layout';
import { PATHS } from '../data/furnishings';
import { groundHeight } from '../systems/architecture';
import { move } from '../systems/collision';
import { collidersFor } from '../systems/colliders';
import { isExploring, runtime, useGame } from '../state/store';
import { audio, type Surface } from '../audio/audio';
import { input, consumeLook } from './input';
import { pickTarget } from '../interaction/targeting';
import { interact, isAvailable } from '../interaction/actions';

const EYE = 1.65;
const WALK = 2.5;
const RUN = 4.4;

function surfaceAt(x: number, z: number, room: string): Surface {
  const rm = ROOM_BY_ID[room];
  if (rm) {
    if (rm.floor === 'carpet') return 'carpet';
    if (rm.floor === 'parquet') return 'wood';
    if (rm.floor === 'tile' || rm.floor === 'checker') return 'tile';
    return 'stone';
  }
  for (const p of PATHS) if (x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1) return p.kind === 'stone' ? 'stone' : p.kind === 'mud' ? 'grass' : 'gravel';
  if (Math.hypot(x, z - 22) < 7) return 'gravel';
  return 'grass';
}

export function PlayerController() {
  const { camera, gl } = useThree();
  const vel = useRef(new THREE.Vector2());
  const smoothYaw = useRef(runtime.yaw);
  const smoothPitch = useRef(runtime.pitch);
  const bob = useRef(0);
  const stepDist = useRef(0);
  const yRef = useRef(LEVEL_Y[runtime.level]);
  const snapTimer = useRef(0);
  const targetTimer = useRef(0);
  const clockAcc = useRef(0);
  const envSet = useRef(false);

  // Keyboard & pointer handling
  useEffect(() => {
    const el = gl.domElement;
    const onKey = (e: KeyboardEvent) => {
      const s = useGame.getState();
      if (s.phase !== 'playing') return;
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') {
        if (s.overlay === 'none') input.keys.add(e.code);
        if (e.repeat) return;
        if (k === 'escape') {
          if (s.overlay === 'none') s.openOverlay('pause');
          else s.closeOverlay();
          return;
        }
        if (k === 'n' || k === 'j') {
          if (s.overlay === 'notebook') s.closeOverlay();
          else if (s.overlay === 'none' || s.overlay === 'pause') s.openOverlay('notebook');
          return;
        }
        if (k === 'f' || k === 'tab') {
          e.preventDefault();
          if (s.overlay === 'folder') s.closeOverlay();
          else if (s.overlay === 'none' || s.overlay === 'pause') s.openOverlay('folder');
          return;
        }
        if (k === 'm') {
          if (s.overlay === 'map') s.closeOverlay();
          else if (s.overlay === 'none' || s.overlay === 'pause') {
            if (s.hasMap) s.openOverlay('map');
            else s.toast('You have no plan of the house yet. Perhaps someone left one lying about.', 'info');
          }
          return;
        }
        if (k === 'e' && s.overlay === 'none') input.interactQueued = true;
      } else {
        input.keys.delete(e.code);
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!input.pointerLocked) return;
      input.lookDX += e.movementX;
      input.lookDY += e.movementY;
    };
    const onClick = () => {
      const s = useGame.getState();
      if (s.phase !== 'playing' || s.overlay !== 'none' || input.touch) return;
      if (!input.pointerLocked) {
        el.requestPointerLock?.();
        return;
      }
      input.interactQueued = true;
    };
    const onLockChange = () => {
      const locked = document.pointerLockElement === el;
      const was = input.pointerLocked;
      input.pointerLocked = locked;
      // leaving pointer lock with Escape while exploring = pause
      if (was && !locked && isExploring()) {
        input.keys.clear();
        useGame.getState().openOverlay('pause');
      }
    };
    const onBlur = () => input.keys.clear();
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('blur', onBlur);
    el.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onLockChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('blur', onBlur);
      el.removeEventListener('click', onClick);
      document.removeEventListener('pointerlockchange', onLockChange);
    };
  }, [gl]);

  // Release pointer lock whenever an overlay opens
  useEffect(
    () =>
      useGame.subscribe((s, prev) => {
        if (s.overlay !== 'none' && prev.overlay === 'none') {
          input.keys.clear();
          if (document.pointerLockElement) document.exitPointerLock();
        }
      }),
    [],
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1); // collision is sub-stepped, so long frames stay safe
    const s = useGame.getState();
    if (s.phase !== 'playing') return;
    const settings = s.settings;

    if (runtime.teleport) {
      const t = runtime.teleport;
      runtime.x = t.x;
      runtime.z = t.z;
      runtime.level = t.level;
      if (t.yaw !== undefined) {
        runtime.yaw = t.yaw;
        smoothYaw.current = t.yaw;
      }
      yRef.current = groundHeight(t.x, t.z, t.level).y;
      runtime.teleport = null;
      vel.current.set(0, 0);
    }

    const exploring = s.overlay === 'none';
    if (exploring) {
      clockAcc.current += dt;
      if (clockAcc.current >= 1) {
        s.tick(clockAcc.current);
        clockAcc.current = 0;
      }
    }

    // ── look
    const { dx, dy } = consumeLook();
    if (exploring) {
      const sens = 0.0022 * settings.sensitivity;
      runtime.yaw -= dx * sens;
      runtime.pitch -= dy * sens * (settings.invertY ? -1 : 1);
      runtime.pitch = THREE.MathUtils.clamp(runtime.pitch, -1.35, 1.35);
    }
    const lookLambda = settings.reducedMotion ? 40 : 22;
    smoothYaw.current = THREE.MathUtils.damp(smoothYaw.current, runtime.yaw, lookLambda, dt);
    smoothPitch.current = THREE.MathUtils.damp(smoothPitch.current, runtime.pitch, lookLambda, dt);

    // ── move
    let fx = 0;
    let fz = 0;
    let running = false;
    if (exploring) {
      const k = input.keys;
      if (k.has('KeyW') || k.has('ArrowUp')) fz += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) fz -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) fx += 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) fx -= 1;
      running = k.has('ShiftLeft') || k.has('ShiftRight') || input.stickRun;
      fx += input.stickX;
      fz += input.stickY;
    }
    const len = Math.hypot(fx, fz);
    if (len > 1) {
      fx /= len;
      fz /= len;
    }
    const speed = running ? RUN : WALK;
    const sin = Math.sin(runtime.yaw);
    const cos = Math.cos(runtime.yaw);
    // forward is -z at yaw 0
    const wantX = (fx * cos - fz * sin) * speed;
    const wantZ = (-fx * sin - fz * cos) * speed;
    const accel = len > 0.01 ? 10 : 12;
    vel.current.x = THREE.MathUtils.damp(vel.current.x, wantX, accel, dt);
    vel.current.y = THREE.MathUtils.damp(vel.current.y, wantZ, accel, dt);

    const set = collidersFor(runtime.level, s.doors);
    const next = move(runtime.x, runtime.z, vel.current.x * dt, vel.current.y * dt, set);
    const moved = Math.hypot(next.x - runtime.x, next.z - runtime.z);
    runtime.x = next.x;
    runtime.z = next.z;
    runtime.speed = moved / Math.max(dt, 1e-4);

    const g = groundHeight(runtime.x, runtime.z, runtime.level);
    runtime.level = g.level as Level;
    yRef.current = THREE.MathUtils.damp(yRef.current, g.y, 14, dt);
    runtime.y = yRef.current;

    // ── head bob & footsteps
    const room = locate(runtime.x, runtime.z, runtime.level) ?? runtime.room;
    if (moved > 0.0005) {
      bob.current += moved * (running ? 2.6 : 3.1);
      stepDist.current += moved;
      const stride = running ? 0.95 : 0.75;
      if (stepDist.current > stride) {
        stepDist.current = 0;
        audio.footstep(surfaceAt(runtime.x, runtime.z, room));
      }
    }
    const bobAmt = settings.headBob && !settings.reducedMotion ? Math.min(1, runtime.speed / WALK) * 0.035 : 0;

    camera.position.set(runtime.x, runtime.y + EYE + Math.sin(bob.current * 2) * bobAmt, runtime.z);
    camera.rotation.set(smoothPitch.current, smoothYaw.current, Math.sin(bob.current) * bobAmt * 0.15, 'YXZ');
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - settings.fov) > 0.1) {
      cam.fov = settings.fov;
      cam.updateProjectionMatrix();
    }

    // ── room tracking
    if (!envSet.current) {
      envSet.current = true;
      audio.setEnvironment(ZONE_BY_ID[room] ? 'outdoor' : runtime.level < 0 ? 'basement' : 'indoor');
    }
    if (room !== runtime.room) {
      runtime.room = room;
      s.enterRoom(room);
      audio.setEnvironment(ZONE_BY_ID[room] ? 'outdoor' : runtime.level < 0 ? 'basement' : 'indoor');
    }

    // ── targeting (10 Hz is plenty)
    targetTimer.current -= dt;
    if (targetTimer.current <= 0 && exploring) {
      targetTimer.current = 0.1;
      const f = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(runtime.pitch, runtime.yaw, 0, 'YXZ'));
      const t = pickTarget({ x: runtime.x, y: runtime.y + EYE, z: runtime.z, fx: f.x, fy: f.y, fz: f.z, level: runtime.level }, isAvailable);
      s.setTarget(t);
    }
    if (input.interactQueued) {
      input.interactQueued = false;
      const t = useGame.getState().target;
      if (t && exploring) interact(t);
    }

    // ── publish a snapshot for the UI (map marker) a few times a second
    snapTimer.current -= dt;
    if (snapTimer.current <= 0) {
      snapTimer.current = 0.3;
      useGame.setState({ player: { x: runtime.x, y: runtime.y, z: runtime.z, yaw: runtime.yaw, pitch: runtime.pitch, level: runtime.level, room: runtime.room } });
    }
  });

  return null;
}
