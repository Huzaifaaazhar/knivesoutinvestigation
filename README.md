# Knives Out — The Thrombey Investigation (Part 1 of 3)

A browser-based, first-person detective experience inspired by *Knives Out* (2019).
The Thrombey mansion **is** the interface: there is no dashboard, sidebar or card
grid. You walk the estate, open doors, pick things up, turn them over in your hands,
and keep your findings in a leather notebook and a manila evidence folder.

Part 1 builds the foundation: the cinematic opening, the explorable estate, the
interaction/inspection engine, evidence, notebook, floor plan and save system.

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production bundle in dist/
npm test             # Vitest unit tests (layout, collision, navigation, state, IndexedDB)
npm run e2e          # Playwright end-to-end tests (desktop + mobile emulation)
```

The e2e suite renders with software WebGL (SwiftShader), so it runs on machines
without a GPU. It uses a local Chromium at `/opt/pw-browsers/chromium` when present
(or `CHROME_PATH`); otherwise run `npx playwright install chromium` first.

## Controls

| Desktop | Mobile |
| --- | --- |
| Click the scene to look around (pointer lock) | Drag on the right half to look |
| `W A S D` / arrows to walk, `Shift` to hurry | Left-thumb floating joystick (push to the rim to hurry) |
| `E` or click to interact | Wax-seal button appears when something is in reach |
| `N` notebook · `F` evidence folder · `M` estate plan | Notebook / folder / plan tabs in the top corner |
| `Esc` pause | Pause button |

Inside the notebook use `←` / `→` or the page corners; the ribbons jump between sections.

## What's in Part 1

- **Opening** — black screen and rain, a slow approach to the lit house, the title,
  then Benoit Blanc's sealed case envelope (break the wax seal) as the transition
  into play. Skippable; *Continue* appears when a saved case exists.
- **The estate** — 19 interior rooms over three storeys plus 6 exterior areas:
  entrance hall (double height, with gallery), grand staircase, living room, Harlan's
  study, library, dining room, kitchen, rear hall, conservatory; upstairs landing,
  family corridor, Harlan's bedroom, private sitting room, guest corridor, two guest
  bedrooms; service corridor, basement and storage room; plus the gate, driveway,
  parking, front garden, rear garden (and west lawn), terrace and garage. You walk
  up both staircases; doors open, close, lock and bolt.
- **Interaction** — 47 interactables (portraits, the knife display, desks, drawers,
  clocks, decanters, record players...) and 22 working doors (plus open archways). A small gold diamond marks
  what you are looking at; names can be hidden in settings. Many objects are
  ordinary — they make the house believable and fill the notebook.
- **Inspection** — 3D objects open in a turntable view (drag to rotate, scroll/pinch
  to zoom) with discoverable detail rings; documents open as paper (typed letters,
  handwritten notes, a ledger, a Polaroid) with clickable passages, stains and torn
  edges, and a brass loupe.
- **Evidence** — 15 pieces tied to the film's central mystery. Each must be found
  *and* examined before it can be bagged. Records carry ID, name, description,
  location, category, discovery time (in-world clock), related characters and
  events, inspection notes, a fully-examined flag and a presented-to list (for Part 2).
- **Progression from real actions** — e.g. reading the attorney's letter reveals a
  hollow book in the library (a hidden compartment); Fran's key behind the flour tin
  opens the locked storage room; the bedroom bolt can only be drawn from inside.
  The notebook's *Lines of enquiry* update from what you have actually found.
- **Notebook** — page-turning leather notebook: case file & timeline, handwritten
  journal, persons of interest (unlocked by studying portraits), estate plan,
  records (manual "Seal & save") and settings.
- **Floor plan** — blueprint sheets for each storey and the grounds, generated from
  the same data as the 3D house: visited / unexplored rooms, locked doors, your
  position and heading, and *Set a course* navigation that lays gold motes through
  the house.
- **Save & resume** — IndexedDB autosave (on discoveries, every 20 s, and when the
  tab is hidden), manual save, Continue / New investigation. Settings persist
  separately.
- **Sound** — entirely original and synthesised at runtime (Web Audio): rain that
  muffles indoors, wind, a low drone, distant thunder with lightning, a sparse
  piano-like motif, and foley for footsteps per surface, doors, locks, paper and pencil.

## Architecture

```
src/
  data/          layout.ts (rooms, doors, stairs, zones — the single source of truth),
                 furnishings.ts, interactables.ts, evidence.ts, case.ts
  systems/       architecture.ts (walls, openings, floors with stair holes, facades, windows),
                 collision.ts, colliders.ts, footprints.ts, navigation.ts  — pure TS, unit-tested
  world/         Scene.tsx (assembly, light pool, sky, rain, grounds, guide trail),
                 Architecture.tsx, Doors.tsx, furniture.tsx, props.tsx, kit.tsx, textures.ts
  player/        PlayerController.tsx, IntroCamera.tsx, input.ts
  interaction/   targeting.ts, actions.ts
  inspection/    InspectionOverlay.tsx, DocumentView.tsx
  notebook/      Notebook.tsx
  evidence/      EvidenceFolder.tsx
  map/           FloorPlan.tsx
  state/         store.ts (Zustand), save.ts (IndexedDB), persistence.ts
  audio/         audio.ts
  ui/            Opening.tsx, HUD.tsx, TouchControls.tsx, PauseMenu.tsx, flow.ts
```

Design decisions worth knowing:

- **One layout, many consumers.** `data/layout.ts` drives the 3D walls, collision,
  the printed floor plan, navigation and room tracking, so the plan always matches
  the house. Tests assert every door sits on the shared wall of the rooms it joins,
  every room is reachable from the gate, and every interactable is reachable.
- **Collision is a custom 2.5D solver, not Rapier.** The house is storeys of vertical
  walls, so a sub-stepped circle-vs-segment/box solver per storey (with stair ramps
  between storeys) is deterministic, never tunnels, and is unit-testable without
  WebGL. Rapier remains a good fit for Part 2/3 if physical props are needed.
- **Procedural assets.** This build had no access to downloadable GLTF/GLB asset
  libraries, so every piece of furniture and prop is assembled from shaped parts
  (turned legs, rounded cushions, lathe-turned vessels, mouldings) and every surface
  uses procedurally painted textures (parquet, damask, marble, brick, slate...). The
  `world/props.tsx` registry is the swap-in point for GLTF models later.
- **Performance.** Rooms on storeys you cannot see are hidden; a pool of 8 point
  lights follows the player between ~70 light anchors so shader cost stays constant;
  the 3D scene stops rendering while a notebook or inspection overlay is open.
  "High detail" can be turned off in settings for older devices.

## Extension points for Parts 2 & 3

- `EvidenceState.presentedTo` is ready for presenting evidence to characters.
- `data/case.ts` holds characters and the event timeline; portraits are generated
  from each character's palette.
- `INTERACTABLES` support `requires` / `grants` (milestones, items, characters, map) —
  the same mechanism can gate interviews or deductions.
- `window.__KO__` exposes the store and runtime for tooling and tests.
