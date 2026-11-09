/**
 * Witness statements and the contradictions between them and the physical
 * evidence. The contradiction engine (systems/contradictions.ts) reads this.
 * Nothing here says who is lying — only which two things cannot both be true.
 */
import type { Cond } from '../systems/conditions';

export interface Statement {
  id: string;
  by: string;
  /** Short handle for notebook lists. */
  summary: string;
  /** The words as said. */
  quote: string;
  /** Evidence the statement concerns (for linking in the notebook). */
  evidence?: string[];
  /** Becomes "confirmed" when this holds. */
  confirmedBy?: Cond;
}

export const STATEMENTS: Statement[] = [
  // Marta
  { id: 'S-marta-left', by: 'marta', summary: 'Left by the front door at about 11:40', quote: 'I gave him his medicine, said goodnight, and went home. Out the front door, the way I always do.', evidence: ['EV-02'] },
  { id: 'S-marta-go', by: 'marta', summary: 'Played Go with Harlan until late', quote: 'We played Go. He lost and pretended he had let me win.', evidence: ['EV-03'], confirmedBy: { evidence: 'EV-03' } },
  { id: 'S-marta-meds', by: 'marta', summary: 'Measured the medication herself', quote: 'I prepare every dose myself. I am careful. I am always careful.', evidence: ['EV-02'] },
  { id: 'S-marta-window', by: 'marta', summary: 'Climbed out of the bedroom window at Harlan’s request', quote: 'He asked me to leave by the window. One of his games — so Great Nana would not hear me on the stairs.', evidence: ['EV-07', 'EV-08', 'EV-09'], confirmedBy: { all: [{ evidence: 'EV-07' }, { evidence: 'EV-09' }] } },
  // Ransom
  { id: 'S-ransom-civil', by: 'ransom', summary: 'A “civil chat” with his grandfather', quote: 'Grandpa and I had a perfectly lovely chat. Very civil. Ask anyone.' },
  { id: 'S-ransom-left', by: 'ransom', summary: 'Stayed for the cake, then drove home', quote: 'I stayed for cake, sang the song, kissed Great Nana, drove home. Model grandson.', evidence: ['EV-15'] },
  { id: 'S-ransom-argued', by: 'ransom', summary: 'Admits the argument; left before the cake', quote: 'Fine. We argued. He told me something I didn’t care for, and I left before anyone lit a candle.', evidence: ['EV-10', 'EV-13'], confirmedBy: { evidence: 'EV-13' } },
  // Linda
  { id: 'S-linda-selfmade', by: 'linda', summary: 'Built her business “from nothing”', quote: 'I built my company with my own two hands. Dad had nothing to do with it.' },
  { id: 'S-linda-quiet', by: 'linda', summary: 'Nobody went near Harlan’s rooms after the party', quote: 'After the party nobody went near Dad’s rooms. The house was asleep by midnight.' },
  { id: 'S-linda-loan', by: 'linda', summary: 'Admits the million-dollar loan', quote: 'He lent me a million dollars. I paid back every cent, with interest. It doesn’t count.', confirmedBy: { memory: 'M-loan' } },
  // Walt
  { id: 'S-walt-business', by: 'walt', summary: 'Says he and Harlan “talked shop” happily', quote: 'Dad and I talked shop. Film rights, the backlist. He was thrilled with the direction we’re taking.' },
  { id: 'S-walt-fired', by: 'walt', summary: 'Admits Harlan fired him from the publishing house', quote: 'He fired me. From the company I’ve run for twenty years. Off the back of his own books.', evidence: ['EV-18'], confirmedBy: { evidence: 'EV-18' } },
  // Joni
  { id: 'S-joni-tuition', by: 'joni', summary: 'Pays Meg’s tuition “herself”', quote: 'I pay Meg’s tuition myself. Every penny. It’s important to me that she sees that.' },
  { id: 'S-joni-cut', by: 'joni', summary: 'Admits Harlan stopped her allowance that night', quote: 'The school sent two invoices — it’s a bureaucracy, not a crime. And yes, Harlan… stopped the allowance. That night.', evidence: ['EV-16'], confirmedBy: { evidence: 'EV-16' } },
  // Meg
  { id: 'S-meg-shouting', by: 'meg', summary: 'Heard Harlan and Ransom shouting in the study', quote: 'I heard Grandpa and Ransom yelling in the study. Like, really yelling. Then a door slammed.', confirmedBy: { any: [{ evidence: 'EV-10' }, { memory: 'M-argument' }] } },
  { id: 'S-meg-tuition', by: 'meg', summary: 'Harlan paid her school directly', quote: 'Grandpa paid my school directly. He told me so — he said he wanted to make sure it actually got there.', evidence: ['EV-16'], confirmedBy: { evidence: 'EV-16' } },
  { id: 'S-meg-rain', by: 'meg', summary: 'The rain began around half past eleven', quote: 'It started pouring around half eleven. I know because Mom made me close the conservatory windows.' },
  { id: 'S-ransom-stayed', by: 'ransom', summary: 'Admits he sat in his car on the estate until after the rain began', quote: 'I sat in my car and brooded. For a while. A long while. Then I drove off. Brooding isn’t a crime.', evidence: ['EV-15'], confirmedBy: { evidence: 'EV-15' } },
  { id: 'S-ransom-knew', by: 'ransom', summary: 'Admits Harlan told him the will left everything to Marta', quote: 'He told me. Everything to the nurse. My grandfather’s idea of a birthday present to himself.', evidence: ['EV-20'], confirmedBy: { evidence: 'EV-20' } },
  // Richard
  { id: 'S-richard-close', by: 'richard', summary: 'Claims he and Harlan were “like father and son”', quote: 'Harlan and I were close. Practically father and son. No friction whatsoever.' },
  { id: 'S-richard-bed', by: 'richard', summary: 'In bed by half past eleven', quote: 'I was in bed by half past eleven. Linda will tell you. I sleep like a stone.' },
  { id: 'S-richard-secret', by: 'richard', summary: 'Admits Harlan knew “a personal matter”', quote: 'He’d found out about… a personal matter. He wanted me to tell Linda myself. I was going to.', evidence: ['EV-17'], confirmedBy: { evidence: 'EV-17' } },
];

export const STATEMENT_BY_ID: Record<string, Statement> = Object.fromEntries(STATEMENTS.map((s) => [s.id, s]));

export type Source = { statement: string } | { evidence: string } | { memory: string };

export interface ContradictionDef {
  id: string;
  title: string;
  /** The claim under pressure. */
  claim: string;
  /** Any one of these conflicts with it. */
  against: Source[];
  /** Neutral explanation — what cannot both be true. */
  tension: string;
  /** Whose account the player can now challenge. */
  challenge: string;
}

export const CONTRADICTIONS: ContradictionDef[] = [
  { id: 'C-ransom-argument', title: 'A civil chat?', claim: 'S-ransom-civil', against: [{ statement: 'S-meg-shouting' }, { evidence: 'EV-10' }, { memory: 'M-argument' }], tension: 'Ransom calls it a lovely chat; others heard shouting, and Harlan exiled him from his seat at dinner.', challenge: 'ransom' },
  { id: 'C-ransom-cake', title: 'Before or after the cake?', claim: 'S-ransom-left', against: [{ evidence: 'EV-13' }], tension: 'Ransom says he stayed for cake. The Polaroid shows him in his coat before it was cut.', challenge: 'ransom' },
  { id: 'C-linda-loan', title: '“Self-made”', claim: 'S-linda-selfmade', against: [{ memory: 'M-loan' }], tension: 'Linda says her father had nothing to do with her company. A memory of Harlan writing her a very large cheque says otherwise.', challenge: 'linda' },
  { id: 'C-linda-window', title: 'Nobody near Harlan’s rooms', claim: 'S-linda-quiet', against: [{ evidence: 'EV-09' }, { evidence: 'EV-07' }], tension: 'Linda says nobody went near her father’s rooms. Someone forced his window latch and came down the trellis.', challenge: 'linda' },
  { id: 'C-walt-fired', title: 'Talking shop', claim: 'S-walt-business', against: [{ evidence: 'EV-18' }, { memory: 'M-record' }], tension: 'Walt says his father was thrilled with the business. Harlan had written his dismissal.', challenge: 'walt' },
  { id: 'C-joni-tuition', title: 'Every penny', claim: 'S-joni-tuition', against: [{ evidence: 'EV-16' }, { statement: 'S-meg-tuition' }], tension: 'Joni says she pays Meg’s tuition herself. Harlan was paying the school directly — and Joni was still collecting.', challenge: 'joni' },
  { id: 'C-richard-letter', title: 'Like father and son', claim: 'S-richard-close', against: [{ evidence: 'EV-17' }], tension: 'Richard claims no friction at all. Harlan’s letter gave him a deadline to confess something to Linda.', challenge: 'richard' },
  { id: 'C-ransom-car', title: 'Home by half nine?', claim: 'S-ransom-left', against: [{ evidence: 'EV-15' }], tension: 'Ransom says he drove home after the cake. Ruts from a wide sports car were torn into the service drive after the rain began, near midnight.', challenge: 'ransom' },
  { id: 'C-marta-door', title: 'Out the front door', claim: 'S-marta-left', against: [{ evidence: 'EV-07' }, { evidence: 'EV-08' }], tension: 'Marta says she left by the front door. Someone small, in flat rubber soles, came down the trellis from Harlan’s window.', challenge: 'marta' },
];

export const CONTRADICTION_BY_ID: Record<string, ContradictionDef> = Object.fromEntries(CONTRADICTIONS.map((c) => [c.id, c]));
