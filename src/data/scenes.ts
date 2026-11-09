/**
 * Staging and lines for the confrontation and the four endings. Shots are
 * either "on" a character (a close-up computed from where they stand), a
 * "wide" of the room, or an explicit camera in another room for Blanc's
 * reconstruction. All dialogue is original.
 */
import type { Mood } from '../systems/dialogue';
import type { Evaluation } from '../systems/deduction';

export interface SceneActor {
  who: string;
  x: number;
  z: number;
  level: 0 | 1 | -1;
  /** If omitted, faces the scene's centre. */
  face?: number;
  pose: 'stand' | 'sit' | 'arms-crossed' | 'hands-behind' | 'lean';
  /** Re-enactment figures appear in sepia only during their beat. */
  ghost?: boolean;
}

export type Shot = { on: string } | { wide: true } | { pos: [number, number, number]; look: [number, number, number] };

export interface Beat {
  who: string;
  text: string;
  mood?: Mood;
  shot: Shot;
  evidence?: string;
  /** Re-enactment: these actors appear for this beat only, in sepia. */
  stage?: SceneActor[];
}

/** The family gathered in the living room, Blanc at the fireplace. */
export const GATHERING_CENTRE = { x: -10.4, z: 5.0 };
export const GATHERING: SceneActor[] = [
  { who: 'blanc', x: -14.3, z: 4.4, level: 0, pose: 'hands-behind' },
  { who: 'linda', x: -12.4, z: 1.8, level: 0, pose: 'arms-crossed' },
  { who: 'richard', x: -11.0, z: 1.6, level: 0, pose: 'stand' },
  { who: 'ransom', x: -8.1, z: 1.9, level: 0, pose: 'arms-crossed' },
  { who: 'walt', x: -11.6, z: 8.5, level: 0, pose: 'stand' },
  { who: 'joni', x: -10.0, z: 8.7, level: 0, pose: 'stand' },
  { who: 'meg', x: -8.6, z: 8.2, level: 0, pose: 'arms-crossed' },
  { who: 'marta', x: -7.0, z: 6.4, level: 0, pose: 'stand' },
];
/** Where the investigator stands to address the room. */
export const PODIUM = { x: -8.6, z: 4.6 };

export const OPENING_BEATS: Beat[] = [
  { who: 'blanc', text: 'Thank you all for coming. I know some of you came reluctantly, and one of you came very reluctantly indeed.', mood: 'amused', shot: { on: 'blanc' } },
  { who: 'linda', text: 'Can we get on with it? Some of us have a company to run.', mood: 'irritated', shot: { on: 'linda' } },
  { who: 'blanc', text: 'Of course. My associate has walked every room of this house. The floor is theirs.', mood: 'warm', shot: { wide: true } },
];

/** Short in-scene reactions as the accusation is built, per suspect. */
export const ACCUSED_REACTION: Record<string, { who: string; text: string; mood: Mood }[]> = {
  ransom: [
    { who: 'ransom', text: 'Me? Oh, this is good. Somebody get a camera.', mood: 'smug' },
    { who: 'linda', text: 'Ransom — sit down and be quiet for once in your life.', mood: 'angry' },
  ],
  marta: [
    { who: 'marta', text: 'I — I would never. I loved him.', mood: 'sick' },
    { who: 'meg', text: 'Are you serious? Of all the people in this room?', mood: 'angry' },
  ],
  linda: [{ who: 'linda', text: 'How dare you. He was my father.', mood: 'angry' }],
  walt: [{ who: 'walt', text: 'I — this is — I was in bed! Ask Donna!', mood: 'nervous' }],
  joni: [{ who: 'joni', text: 'I’m receiving a lot of hostility right now, and I don’t accept it.', mood: 'defensive' }],
  meg: [{ who: 'meg', text: 'Seriously? I’m twenty.', mood: 'irritated' }],
  richard: [{ who: 'richard', text: 'This is outrageous. I want my lawyer — I want Linda’s lawyer.', mood: 'angry' }],
};

const room = (pos: [number, number, number], look: [number, number, number]): Shot => ({ pos, look });

export function endingBeats(ending: 'truth' | 'unfinished' | 'wrong' | 'unresolved', ev: Evaluation, accused: string | null): Beat[] {
  if (ending === 'truth')
    return [
      { who: 'blanc', text: 'It is a story about a gift. Not the will — though we shall come to the will. The gift was Harlan’s last act, and it was given to the wrong person’s satisfaction.', mood: 'thoughtful', shot: { wide: true } },
      { who: 'blanc', text: 'A week before his birthday, Harlan changed his will. Everything — the house, the money, the publishing house — to Marta. At the party, he told exactly one of you.', mood: 'neutral', shot: room([10.8, 1.5, 2.4], [12.6, 1.2, 0.5]), evidence: 'EV-20' },
      { who: 'blanc', text: 'Ransom. The shouting Meg heard. The seat moved to the end of the table, in ink.', mood: 'neutral', shot: { on: 'ransom' }, evidence: 'EV-10' },
      { who: 'blanc', text: 'Ransom made a great show of leaving before the cake — coat on, door slammed. Joni’s camera kept the proof. And then he came back.', mood: 'amused', shot: room([1.5, 1.6, 9.2], [0, 1.5, 6]), evidence: 'EV-13' },
      {
        who: 'blanc',
        text: 'While you ate, he went to the study and emptied one vial into the other — morphine where the Toradol should be — then re-stuck the labels, and took the antidote from the bag. If Marta killed Harlan by mistake, she could never inherit.',
        mood: 'thoughtful',
        shot: room([-7.2, 1.3, -2.6], [-6.2, 0.7, -1.3]),
        evidence: 'EV-02',
        stage: [{ who: 'ransom', x: -6.6, z: -2.0, level: 0, face: Math.PI * 0.8, pose: 'stand', ghost: true }],
      },
      {
        who: 'blanc',
        text: 'But at half past eleven, Marta reached for the medicine as she always did — by feel, by weight — and her hands chose correctly. Only the labels told her she had given him a hundred milligrams of morphine.',
        mood: 'warm',
        shot: { on: 'marta' },
        evidence: 'EV-19',
      },
      {
        who: 'blanc',
        text: 'Harlan believed he had minutes. And with those minutes he protected her: out the front for the camera at twenty to midnight, back up the trellis, out of his window again for Great Nana to see.',
        mood: 'thoughtful',
        shot: room([-21.5, 2.2, 9.5], [-16.4, 3.2, 8]),
        evidence: 'EV-07',
        stage: [{ who: 'marta', x: -16.9, z: 8.0, level: 0, face: Math.PI / 2, pose: 'stand', ghost: true }],
      },
      { who: 'blanc', text: 'Then he took a blade from his own display, and he spared her the only way he thought he could. He died for a crime that had not been committed.', mood: 'sad', shot: room([-6.4, 1.5, -4.8], [-8, 0.6, -7.2]), evidence: 'EV-01' },
      { who: 'blanc', text: 'Ransom left only after the rain began — the ruts are still in the mud. And when the toxicology report came back clean, his whole elegant plan collapsed. So he burned it.', mood: 'neutral', shot: room([-12.5, 1.2, 5.8], [-15.4, 0.5, 5]), evidence: 'EV-06' },
      { who: 'blanc', text: 'Fran, who misses nothing in this house, had a copy — and a note. “I know what you did with the vials.”', mood: 'thoughtful', shot: room([1.8, 1.5, -11.5], [0.4, 1.2, -13.3]), evidence: 'EV-19' },
      { who: 'ransom', text: 'That’s a lovely story. You can’t prove I touched that bag.', mood: 'smug', shot: { on: 'ransom' } },
      { who: 'blanc', text: 'The labels you re-stuck, the car you said had left, the report you burned, the will you were told about. Your hands are on all of it, Hugh.', mood: 'angry', shot: { on: 'blanc' } },
      { who: 'ransom', text: '…He was going to give it all to the help. All of it. What was I supposed to do?', mood: 'angry', shot: { on: 'ransom' } },
      { who: 'marta', text: 'I didn’t kill him. All this time I thought — I didn’t kill him.', mood: 'sad', shot: { on: 'marta' } },
      { who: 'linda', text: 'Ransom. My God.', mood: 'sad', shot: { on: 'linda' } },
      { who: 'blanc', text: 'The family will go on misunderstanding the will. Let them. The house, I suspect, has finally found someone who deserves it.', mood: 'warm', shot: { wide: true } },
    ];
  if (ending === 'unfinished') {
    const close = ev.verdict === 'partial';
    return [
      { who: 'blanc', text: close ? 'Very nearly. You have the right name and most of the right reasons.' : 'You have pointed at the right person. But pointing is not proving.', mood: 'thoughtful', shot: { on: 'blanc' } },
      { who: 'ransom', text: 'See? A hunch and a notebook. Can I go now?', mood: 'smug', shot: { on: 'ransom' } },
      { who: 'blanc', text: ev.notes[0] ? `${ev.notes[0]} Without it, a good lawyer walks him out of that door in an afternoon.` : 'There is a gap in the story, and a good lawyer will drive a hearse through it.', mood: 'neutral', shot: { wide: true } },
      { who: 'marta', text: 'So it stays like this? Everyone thinking I —', mood: 'sad', shot: { on: 'marta' } },
      { who: 'blanc', text: close ? 'For tonight. But a case left this close to closed has a way of closing itself. Keep your notes.' : 'For tonight. Go back to the house, my friend. It has not finished talking.', mood: 'warm', shot: { on: 'blanc' } },
      { who: 'walt', text: 'Well. I suppose we’re all still suspects, then. Wonderful. Great for the brand.', mood: 'nervous', shot: { on: 'walt' } },
    ];
  }
  if (ending === 'wrong') {
    const beats: Beat[] = [];
    if (accused === 'marta')
      beats.push(
        { who: 'marta', text: 'I didn’t — I couldn’t — please.', mood: 'sick', shot: { on: 'marta' } },
        { who: 'blanc', text: 'No. No, no. You have mistaken the victim of this plan for its author. She believed she had killed him. That belief was the whole point.', mood: 'angry', shot: { on: 'blanc' } },
      );
    else
      beats.push(
        { who: accused ?? 'blanc', text: 'This is absurd. You have nothing.', mood: 'angry', shot: accused ? { on: accused } : { wide: true } },
        { who: 'blanc', text: 'I am afraid that is so. A motive is a weathervane, my friend. It does not open windows, and it does not swap vials.', mood: 'thoughtful', shot: { on: 'blanc' } },
      );
    beats.push(
      { who: 'ransom', text: 'Well, this has been the best evening this family has ever had. Bravo.', mood: 'smug', shot: { on: 'ransom' } },
      { who: 'meg', text: 'You were supposed to help her.', mood: 'angry', shot: { on: 'meg' } },
      { who: 'blanc', text: 'The wrong name, said aloud in this room, does damage that will not wash out. We must be very careful what we are sure of.', mood: 'sad', shot: { wide: true } },
    );
    return beats;
  }
  return [
    { who: 'blanc', text: 'So. We walk out into the rain without naming anyone.', mood: 'thoughtful', shot: room([3.5, 1.7, -19.5], [4.6, 1.5, -16.6]) },
    { who: 'blanc', text: 'It is not a failure. A case that refuses to close is a case that is still telling the truth — that we do not yet know enough.', mood: 'warm', shot: room([6.5, 1.6, -18.8], [4.6, 1.5, -16.4]) },
    { who: 'blanc', text: 'Somewhere in that house is a vial, a tape, a scrap of paper that would end this. The family will sleep easily tonight. One of them should not.', mood: 'thoughtful', shot: room([0, 6, -30], [0, 4, -8]) },
  ];
}
