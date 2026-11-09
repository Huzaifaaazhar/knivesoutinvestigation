import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../state/store';
import { DOORS, LEVEL_NAMES, ROOMS, STAIRS, ZONES, ROOM_BY_ID, ZONE_BY_ID, placeName, type Level, type Rect } from '../data/layout';
import { PATHS, TREES } from '../data/furnishings';
import { doorInterval } from '../systems/architecture';
import { routeTo } from '../systems/navigation';
import { audio } from '../audio/audio';
import { npcList } from '../state/npcRuntime';
import { NPC_BY_ID } from '../data/npcs';

type Sheet = Level | 'grounds';
const SHEETS: { id: Sheet; label: string }[] = [
  { id: 1, label: 'Upper' },
  { id: 0, label: 'Ground' },
  { id: -1, label: 'Lower' },
  { id: 'grounds', label: 'Grounds' },
];

function bounds(rects: Rect[], pad: number) {
  const x0 = Math.min(...rects.map((r) => r.x0)) - pad;
  const z0 = Math.min(...rects.map((r) => r.z0)) - pad;
  const x1 = Math.max(...rects.map((r) => r.x1)) + pad;
  const z1 = Math.max(...rects.map((r) => r.z1)) + pad;
  return { x0, z0, w: x1 - x0, h: z1 - z0 };
}

const INK = 'rgba(230,240,255,0.92)';
const FAINT = 'rgba(230,240,255,0.35)';

function Padlock({ x, y, s = 0.9 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x - s / 2} ${y - s / 2}) scale(${s})`}>
      <rect x={0.1} y={0.45} width={0.8} height={0.55} fill="#982b39" stroke="#f1e7d3" strokeWidth={0.06} />
      <path d="M0.25 0.45 V0.3 a0.25 0.25 0 0 1 0.5 0 V0.45" fill="none" stroke="#f1e7d3" strokeWidth={0.08} />
    </g>
  );
}

export function FloorPlan() {
  const overlay = useGame((s) => s.overlay);
  const player = useGame((s) => s.player);
  const visited = useGame((s) => s.visited);
  const doors = useGame((s) => s.doors);
  const navTarget = useGame((s) => s.navTarget);
  const inventory = useGame((s) => s.inventory);
  const met = useGame((s) => s.met);
  const here = ZONE_BY_ID[player.room] ? 'grounds' : player.level;
  const [sheet, setSheet] = useState<Sheet>(here);
  const [selected, setSelected] = useState<string | null>(null);

  const route = useMemo(
    () => (navTarget ? routeTo({ x: player.x, z: player.z, level: player.level }, player.room, navTarget) : null),
    [navTarget, player.room, player.x, player.z, player.level],
  );

  if (overlay !== 'map') return null;

  const rooms = sheet === 'grounds' ? ROOMS.filter((r) => r.id === 'garage') : ROOMS.filter((r) => r.level === sheet && r.id !== 'garage');
  const bb =
    sheet === 'grounds'
      ? bounds([{ x0: -46, z0: -50, x1: 46, z1: 48 }], 2)
      : bounds(
          rooms.map((r) => r.rect),
          2.5,
        );
  const sw = sheet === 'grounds' ? 0.35 : 0.14;
  const markerOn = sheet === 'grounds' ? !!ZONE_BY_ID[player.room] || player.level === 0 : player.level === sheet && !ZONE_BY_ID[player.room];
  const yaw = player.yaw;
  const sel = selected ? ROOM_BY_ID[selected] ?? null : null;
  const selZone = selected ? ZONE_BY_ID[selected] ?? null : null;
  const canNav = selected && visited.includes(selected) && selected !== player.room;

  return (
    <motion.div
      className="fixed inset-0 z-20 flex items-center justify-center bg-shadow/55 p-2 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && useGame.getState().closeOverlay()}
      data-testid="map"
    >
      <motion.div
        initial={{ scaleY: 0.2, opacity: 0, rotateX: 40 }}
        animate={{ scaleY: 1, opacity: 1, rotateX: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
        className="blueprint relative flex max-h-[92vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-[2px] border-[6px] border-[#e9e2d0] shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ivory/20 px-4 pb-3 pt-4 sm:px-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-ivory/60">Thrombey Estate · Crofton Road</div>
            <h2 className="font-title text-xl text-ivory sm:text-2xl">{sheet === 'grounds' ? 'The Grounds' : LEVEL_NAMES[sheet]}</h2>
          </div>
          <div className="flex gap-1">
            {SHEETS.map((s) => (
              <button
                key={String(s.id)}
                data-testid={`sheet-${s.id}`}
                onClick={() => (audio.play('paper'), setSheet(s.id), setSelected(null))}
                className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] transition ${sheet === s.id ? 'border-ivory bg-ivory/15 text-ivory' : 'border-ivory/30 text-ivory/60 hover:text-ivory'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <svg viewBox={`${bb.x0} ${bb.z0} ${bb.w} ${bb.h}`} className="h-[min(62vh,640px)] w-full" preserveAspectRatio="xMidYMid meet" data-testid="plan-svg">
            <defs>
              <pattern id="hatch" width={0.8} height={0.8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1={0} y1={0} x2={0} y2={0.8} stroke="rgba(230,240,255,0.18)" strokeWidth={0.12} />
              </pattern>
              <pattern id="steps" width={0.35} height={0.35} patternUnits="userSpaceOnUse">
                <line x1={0} y1={0} x2={0.35} y2={0} stroke={FAINT} strokeWidth={0.05} />
              </pattern>
            </defs>

            {sheet === 'grounds' && (
              <g>
                <rect x={-46} y={-50} width={92} height={97} fill="none" stroke={FAINT} strokeWidth={0.5} strokeDasharray="1.5 1" />
                {PATHS.map((p, i) => (
                  <rect key={i} x={p.x0} y={p.z0} width={p.x1 - p.x0} height={p.z1 - p.z0} fill={p.kind === 'stone' ? 'rgba(230,240,255,0.12)' : 'rgba(230,240,255,0.06)'} stroke={FAINT} strokeWidth={0.12} />
                ))}
                <circle cx={0} cy={22} r={2.5} fill="none" stroke={INK} strokeWidth={0.25} />
                {TREES.map((t, i) => (
                  <circle key={i} cx={t.x} cy={t.z} r={2.2} fill="none" stroke={FAINT} strokeWidth={0.2} strokeDasharray="0.5 0.4" />
                ))}
                <rect x={-16} y={-14} width={32} height={24} fill="rgba(230,240,255,0.14)" stroke={INK} strokeWidth={0.5} />
                <text x={0} y={-2} textAnchor="middle" fontSize={2.2} fill={INK} fontFamily="Playfair Display, serif">
                  THE HOUSE
                </text>
                {ZONES.map((z) => {
                  const r = z.rects[0];
                  const v = visited.includes(z.id);
                  const cx = z.id === 'rear-garden' ? 0 : z.id === 'front-garden' ? -28 : (r.x0 + r.x1) / 2;
                  const cy = z.id === 'rear-garden' ? -44 : z.id === 'front-garden' ? 26 : (r.z0 + r.z1) / 2;
                  return (
                    <g key={z.id} onClick={() => setSelected(z.id)} className="cursor-pointer">
                      <text x={cx} y={cy} textAnchor="middle" fontSize={1.7} fill={v ? INK : FAINT} fontFamily="Inter, sans-serif" letterSpacing={0.2}>
                        {z.name.toUpperCase()}
                      </text>
                      {!v && (
                        <text x={cx} y={cy + 1.9} textAnchor="middle" fontSize={1.1} fill={FAINT} fontStyle="italic">
                          unexplored
                        </text>
                      )}
                    </g>
                  );
                })}
                <line x1={-3} y1={47} x2={3} y2={47} stroke="#b69a65" strokeWidth={0.6} />
              </g>
            )}

            {rooms.map((r) => {
              const v = visited.includes(r.id);
              const isSel = selected === r.id;
              const isNav = navTarget === r.id;
              const { x0, z0, x1, z1 } = r.rect;
              return (
                <g key={r.id} onClick={() => (audio.play('click'), setSelected(r.id))} className="cursor-pointer" data-testid={`plan-room-${r.id}`}>
                  <rect
                    x={x0}
                    y={z0}
                    width={x1 - x0}
                    height={z1 - z0}
                    fill={v ? (isSel ? 'rgba(182,154,101,0.35)' : 'rgba(230,240,255,0.13)') : 'url(#hatch)'}
                    stroke={isNav ? '#e6c98a' : INK}
                    strokeWidth={isNav ? sw * 2.2 : sw * 1.6}
                  />
                  <text x={(x0 + x1) / 2} y={(z0 + z1) / 2} textAnchor="middle" fontSize={sheet === 'grounds' ? 1.4 : Math.min(0.75, (x1 - x0) / 9)} fill={v ? INK : FAINT} fontFamily="Playfair Display, serif">
                    {r.name}
                  </text>
                  {!v && (
                    <text x={(x0 + x1) / 2} y={(z0 + z1) / 2 + 0.9} textAnchor="middle" fontSize={0.5} fill={FAINT} fontFamily="IBM Plex Mono, monospace" letterSpacing={0.08}>
                      UNEXPLORED
                    </text>
                  )}
                </g>
              );
            })}

            {sheet !== 'grounds' &&
              STAIRS.filter((s) => s.lowLevel === sheet || s.highLevel === sheet).map((s) => (
                <g key={s.id} pointerEvents="none">
                  <rect x={s.rect.x0} y={Math.min(s.rect.z0, s.rect.z1)} width={s.rect.x1 - s.rect.x0} height={Math.abs(s.rect.z1 - s.rect.z0)} fill="url(#steps)" stroke={INK} strokeWidth={sw} />
                  <text x={(s.rect.x0 + s.rect.x1) / 2} y={(s.lowAt + s.highAt) / 2} textAnchor="middle" fontSize={0.45} fill={INK} transform={`rotate(-90 ${(s.rect.x0 + s.rect.x1) / 2} ${(s.lowAt + s.highAt) / 2})`}>
                    {s.highLevel === sheet ? 'DOWN' : 'UP'}
                  </text>
                </g>
              ))}

            {DOORS.filter((d) => (sheet === 'grounds' ? d.id === 'garage-door' : d.level === sheet)).map((d) => {
              const iv = doorInterval(d);
              const locked = !!d.lock && !doors[d.id]?.unlocked;
              const [ax, az, bx, bz] = d.line === 'z' ? [iv.a, d.z, iv.b, d.z] : [d.x, iv.a, d.x, iv.b];
              return (
                <g key={d.id} pointerEvents="none">
                  <line x1={ax} y1={az} x2={bx} y2={bz} stroke="#17304f" strokeWidth={sw * 3} />
                  <line x1={ax} y1={az} x2={bx} y2={bz} stroke={locked ? '#982b39' : 'rgba(230,240,255,0.6)'} strokeWidth={sw * 0.8} strokeDasharray={d.kind === 'arch' ? 'none' : '0.25 0.15'} />
                  {locked && <Padlock x={(ax + bx) / 2} y={(az + bz) / 2} s={sheet === 'grounds' ? 2 : 0.9} />}
                  {locked && d.lock?.type === 'key' && inventory.includes(d.lock.keyId ?? '') && (
                    <text x={(ax + bx) / 2 + 0.8} y={(az + bz) / 2 + 0.2} fontSize={0.45} fill="#e6c98a">
                      key held
                    </text>
                  )}
                </g>
              );
            })}

            {route && (
              <polyline
                pointerEvents="none"
                points={[{ x: player.x, z: player.z, level: player.level }, ...route]
                  .filter((p) => (sheet === 'grounds' ? p.level === 0 : p.level === sheet))
                  .map((p) => `${p.x},${p.z}`)
                  .join(' ')}
                fill="none"
                stroke="#e6c98a"
                strokeWidth={sw * 1.6}
                strokeDasharray={`${sw * 4} ${sw * 3}`}
              />
            )}

            {markerOn && (
              <g transform={`translate(${player.x} ${player.z})`} pointerEvents="none" data-testid="plan-marker">
                <circle r={sheet === 'grounds' ? 2.2 : 0.9} fill="rgba(182,154,101,0.25)">
                  <animate attributeName="r" values={sheet === 'grounds' ? '1.2;3;1.2' : '0.5;1.2;0.5'} dur="2.4s" repeatCount="indefinite" />
                </circle>
                <g transform={`rotate(${(-yaw * 180) / Math.PI})`}>
                  <path d={sheet === 'grounds' ? 'M0 -2.6 L1.2 1 L0 0.3 L-1.2 1 Z' : 'M0 -0.9 L0.45 0.4 L0 0.15 L-0.45 0.4 Z'} fill="#e6c98a" stroke="#241815" strokeWidth={0.05} />
                </g>
              </g>
            )}

            {/* people you've met, where they are now */}
            {npcList()
              .filter((n) => met.includes(n.id) && (sheet === 'grounds' ? !!ZONE_BY_ID[n.room] || n.room === 'garage' : n.level === sheet && !ZONE_BY_ID[n.room]))
              .map((n) => (
                <g key={n.id} transform={`translate(${n.x} ${n.z})`} pointerEvents="none" data-testid={`plan-npc-${n.id}`}>
                  <circle r={sheet === 'grounds' ? 1.5 : 0.55} fill="#982b39" stroke="#f1e7d3" strokeWidth={sheet === 'grounds' ? 0.25 : 0.08} />
                  <text y={sheet === 'grounds' ? -2 : -0.8} textAnchor="middle" fontSize={sheet === 'grounds' ? 1.6 : 0.6} fill="#f1e7d3" fontFamily="Inter, sans-serif">
                    {NPC_BY_ID[n.id].short}
                  </text>
                </g>
              ))}

            {/* compass */}
            <g transform={`translate(${bb.x0 + bb.w - (sheet === 'grounds' ? 6 : 2.2)} ${bb.z0 + (sheet === 'grounds' ? 6 : 2.2)}) scale(${sheet === 'grounds' ? 3 : 1})`} pointerEvents="none">
              <circle r={1.1} fill="none" stroke={FAINT} strokeWidth={0.06} />
              <path d="M0 -1 L0.25 0 L0 0.2 L-0.25 0 Z" fill={INK} />
              <text y={-1.3} textAnchor="middle" fontSize={0.55} fill={INK} fontFamily="Playfair Display, serif">
                N
              </text>
            </g>
          </svg>
        </div>

        <div className="flex flex-col gap-3 border-t border-ivory/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-h-[2.5rem] text-ivory/85">
            {sel || selZone ? (
              <>
                <div className="font-title text-base text-ivory">{placeName(selected!)}</div>
                <div className="font-display text-sm italic text-ivory/70">
                  {visited.includes(selected!) ? (sel?.blurb ?? selZone?.blurb) : 'Not yet explored. The plan cannot tell you what is inside.'}
                </div>
              </>
            ) : (
              <div className="font-display text-sm italic text-ivory/60">You are in: {placeName(player.room)}. Select a room you have visited to set a course.</div>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {canNav && (
              <button
                data-testid="set-course"
                onClick={() => {
                  useGame.getState().setNav(selected);
                  useGame.getState().toast(`Course set for the ${placeName(selected!)}. Follow the gold motes.`, 'info');
                  useGame.getState().closeOverlay();
                }}
                className="border border-gold bg-gold/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ivory hover:bg-gold/35"
              >
                Set a course
              </button>
            )}
            {navTarget && (
              <button onClick={() => useGame.getState().setNav(null)} className="border border-ivory/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ivory/70">
                Clear course
              </button>
            )}
            <div className="hidden items-center gap-3 pl-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ivory/50 md:flex">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 bg-[rgba(230,240,255,0.2)]" /> visited
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 border border-ivory/40 [background:repeating-linear-gradient(45deg,transparent_0,transparent_2px,rgba(230,240,255,0.3)_2px,rgba(230,240,255,0.3)_3px)]" /> unexplored
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 bg-blood" /> locked
              </span>
            </div>
            <button data-testid="close-map" onClick={() => useGame.getState().closeOverlay()} className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ivory/70 hover:text-gold">
              Fold · M
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
