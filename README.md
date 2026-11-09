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

## Part 2 — The Family

The estate is occupied. Eight people — **Benoit Blanc, Marta Cabrera, Ransom, Linda,
Richard, Walt, Joni and Meg** — live in actual rooms, walk between them through real
doorways and up the stairs, and are spoken to *in place*. Harlan appears in portraits,
documents, a recorded dictation, the photograph album and staged memories.

- **Encounters** — look at someone: `E` speaks, `Q` observes (their body language,
  which you can write down). People idle, glance around, pace, lean on the mantel, sit,
  talk on the phone; they turn to face you and gesture as they talk, and their faces
  (brows, eyes, mouth) follow their mood. Figures are stylised and original, not
  actor likenesses.
- **Conversations** — the camera cuts between close-ups and over-the-shoulder shots
  of your own figure, in the real room; letterbox bars, film subtitles and a small
  choice panel. Leave at any time and come back later.
- **Interrogation** — questions about Harlan, the family, the evening, rooms,
  relationships, documents and events, unlocked by evidence, other interviews,
  memories and relationships. Challenges appear only once a contradiction is marked.
- **Presenting evidence** — open the manila folder mid-conversation and show
  anything you've logged. Reactions depend on the item, whether you've examined it,
  what that person knows and has already said: acknowledgement, surprise,
  defensiveness, denial, explanation, refusal — or a changed account. Irrelevant
  evidence gets that character's own deflection, never a confession.
- **Contradiction engine** — testimony is filed in the notebook as *confirmed*,
  *unverified* or *contradicted*. When you hold both halves of a conflict, the
  statement gets a red “?” in the margin — but you must choose what it conflicts with
  (another statement, evidence, or a memory) using **Compare…**. Presenting the right
  evidence to the person who lied also exposes it.
- **Relationships** — the framed family tree (dining room) and Harlan's photograph
  album (living room). Discovered connections are drawn in coloured pencil; unknown
  ones show as faint “?”s; every line and person can be annotated and marked.
- **Motives** — a worksheet per suspect in the notebook: motive, supporting and
  contradicting evidence, related people, confidence, unresolved questions. Motive
  leads appear only as you uncover them.
- **Schedules** — where people are depends on how far the investigation has got
  (only ever moving forward with discoveries) plus a slow drift between posts as the
  in-world clock runs. Busy and unwilling states lift on their own or through
  discoveries; nobody can become unreachable. Met characters appear on the floor plan,
  and the notebook can lead you to them.
- **Blanc** — at the crime scene first, later the library, terrace and hall. Ask him
  for a nudge and he gives a subtle observation, then a lead, then a specific thing to
  reconsider — only when asked.
- **Memories** — five optional flashbacks (the Go board, the record player, the
  seating card, the album, Harlan's letter) staged in sepia in the actual rooms.
- **Notebook** — new Testimony, Conflicts and Motives sections, persons' whereabouts,
  and a place to pencil in your own assumptions, kept visually distinct from facts.

Content and logic are separate: `data/npcs.ts` (cast & schedules), `data/dialogue/*`
(typed scripts), `data/testimony.ts` (statements & contradictions),
`data/relations.ts` (relationships, motives, memories, hints, album), interpreted by
pure systems in `systems/conditions.ts`, `systems/dialogue.ts` and
`systems/contradictions.ts`; `state/story.ts` applies results; `world/npc/*` renders and
directs the cast; `ui/Conversation.tsx`, `ui/Flashback.tsx`, `relations/*` and
`notebook/StoryPages.tsx` present them.

## Part 3 — The Final Reveal

The case can now be solved. The truth is fixed (`data/mystery.ts`) and follows the
film's premise; it never changes with the player's choices, and every essential clue is
held by an object or a person in the house.

- **The investigation board** — Blanc's corkboard on an easel in the library. Pin
  evidence, testimony, people, contradictions and timeline cards from the drawer; drag
  them around; write notes on cards; zoom and pan; tie cards together with red string of
  a chosen meaning — *supports, contradicts, establishes motive / opportunity /
  location, disproves an alibi, needs investigation*. Nothing is arranged for you and no
  connection is suggested. The board in the library shows what you've pinned.
- **The timeline cord** — the night's events as cards, pegged to a string and dragged
  into order. Only events you have evidence for exist. Each is *confirmed, reported,
  unverified* or *contradicted*. Cards whose times the evidence fixes get a pencilled
  “?” when out of order; undated cards (the vial swap, the car leaving) never do.
- **The sealed will** — behind the hollow book. An aged document with clauses, a
  struck-and-initialled amendment, witness signatures, a wax seal and a pencilled
  margin note; examine it with the loupe, compare it with the attorney's letter, and
  answer the will's questions (exists? benefits? genuine? who knew? who loses? why it
  matters?) from what you have found.
- **Case questions** — The Final Evening, The Family Motives, The Contradictory
  Accounts, The Missing Connection, The Will. Each is checked against the truth when you
  ask (“Test my reasoning”) with no hint about *why* it fails.
- **The gathering** — tell Blanc you're ready and the family assembles in the living
  room. The camera cuts between them as you build the accusation in seven beats:
  the accused, motive, opportunity, the night (your cord), supporting evidence,
  contradictions and the final discovery. Options come only from what you found;
  nothing is pre-filled. You can withdraw at any point.
- **Evaluation** (`systems/deduction.ts`) — identification, motive, timeline accuracy,
  evidence relevance, contradictions and logic. Naming the right person is not enough
  on its own; citing evidence you never found counts for nothing.
- **Endings** — *The Complete Truth* (Blanc's reconstruction cuts to the rooms with
  evidence held to camera and sepia re-enactments), *The Unfinished Case* (two variants),
  *The Wrong Accusation* (Marta gets her own), *The Unresolved Mystery* — each with its
  own dialogue, staging and reactions.
- **The case file** — a stamped dossier: duration, rooms, interviews, evidence, missed
  clues, contradictions, timeline accuracy, the accusation, a per-dimension breakdown,
  and a rating from *Amateur Observer* to *Benoit Blanc Level*. Reports are kept
  separately from saves and can be reviewed from the title.
- **Replay** — new investigation (with confirmation; the previous save is moved to a
  backup slot, never silently lost), a *fewer hints* mode in which Blanc only ever
  offers his first, subtle observation, review of past case files, and returning to
  the house after a verdict.
- **Polish** — a ticking hall clock and crackling fires that grow louder as you
  approach, original underscore for the gathering and each kind of ending, separate
  master / music / ambience / effects levels in the pause screen and the notebook.

Saves are now version 3; version 1 and 2 saves load with the new state set to empty.

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
