import type { Script } from '../../systems/dialogue';
import { N, Y } from './helpers';

const c = (id: string) => ({ contradiction: id });

export const BLANC: Script = {
  id: 'blanc',
  greetings: [
    {
      when: { not: { met: 'blanc' } },
      lines: [
        N('Ah. My associate. Come in — but walk around the rug, if you would. The rug has not finished telling me things.', 'warm', 'spread-hands'),
        N('Benoit Blanc. We have corresponded; now we conspire. The police call this a suicide. The police are tired, and tired men reach for the tidiest answer in the drawer.', 'thoughtful', 'nod'),
        N('I prefer the untidy ones. Walk the house. Talk to the family. Bring me what does not fit, and I shall do my best not to solve it for you.', 'amused', 'nod'),
      ],
    },
    { when: { minContradictions: 2 }, lines: [N('There you are. You have the look of someone holding two things that refuse to sit in the same hand.', 'amused', 'lean-in')] },
    { lines: [N('My friend. What have you brought me?', 'warm', 'nod')] },
  ],
  occupied: [N('One moment — I am in the middle of a thought, and thoughts, like soufflés, collapse if you open the door.', 'thoughtful', 'wave-off')],
  topics: [
    {
      id: 'case',
      label: 'Why are you here, Mr Blanc?',
      kind: 'harlan',
      lines: [
        Y('Who hired you?'),
        N('An envelope of cash, delivered anonymously, and the name of this house. Someone wanted a detective. I find that more interesting than who.', 'amused', 'shrug', { tell: 'Blanc smiles when he talks about the envelope — he enjoys not knowing.' }),
        N('Harlan Thrombey wrote eighty puzzles and solved none of them in public. I suspect his last one is still lying about the house, waiting to be picked up.', 'thoughtful'),
      ],
      again: [N('Someone paid me to doubt. I am being thorough with their money.', 'amused')],
    },
    {
      id: 'scene',
      label: 'What do you make of the study?',
      kind: 'room',
      requires: { visited: 'study' },
      lines: [
        N('A man sits on a daybed and opens his own throat with a blade from his own collection. Theatrical. Very Harlan. Too Harlan?', 'thoughtful', 'point'),
        N('Note the blanket, folded. Note the Go board, interrupted. A room tells you what happened; it also tells you what someone wanted you to think happened. Listen for both voices.', 'neutral', 'lean-in'),
      ],
    },
    {
      id: 'family',
      label: 'And the family?',
      kind: 'family',
      lines: [
        N('A family of passengers who believe they are drivers. Every one of them lived, in one way or another, on Harlan’s generosity.', 'amused', 'spread-hands'),
        N('Which gives each of them a reason to want him alive — and, should that generosity have ended, a reason to be very upset indeed.', 'thoughtful'),
        N('Motive is a weathervane, not a compass. It tells you which way the wind blew. It does not tell you who opened the window.', 'neutral', 'nod'),
      ],
    },
    {
      id: 'nana',
      label: 'Great Nana says she saw someone.',
      kind: 'event',
      requires: { any: [{ evidence: 'EV-07' }, { evidence: 'EV-09' }, { heard: 'S-marta-left' }] },
      lines: [
        N('She did. Climbing down from the window, in the dark, she says. The family pats her hand and talks about her age.', 'thoughtful'),
        N('I have learned to love the testimony of people no one listens to. They have no reason to perform.', 'warm', 'nod'),
      ],
    },
    {
      id: 'where',
      label: 'Where is everyone just now?',
      kind: 'small',
      lines: [{ by: 'npc', text: '', mood: 'neutral', gesture: 'point', dynamic: 'whereabouts' }, N('People drift, you understand. Ask again later and the answer will have moved.', 'amused')],
    },
    {
      id: 'hint',
      label: 'I could use a nudge.',
      kind: 'hint',
      requires: { met: 'blanc' },
      lines: [{ by: 'npc', text: '', mood: 'thoughtful', gesture: 'lean-in', dynamic: 'hint' }],
    },
    {
      id: 'will',
      label: 'The will leaves everything to Marta.',
      kind: 'document',
      requires: { evidence: 'EV-20' },
      lines: [
        N('Ah. So now we know what kind of lit fuse it was.', 'thoughtful', 'nod'),
        N('Ask yourself not only who benefits, but who knew — and who would be harmed if the beneficiary could not inherit. A person who kills cannot profit from the death. Every lawyer in this county knows that.', 'thoughtful', 'lean-in'),
      ],
    },
    {
      id: 'board',
      label: 'How should I put the case together?',
      kind: 'hint',
      requires: { met: 'blanc' },
      lines: [
        N('I have left you a board in the library, an easel and a box of pins. Pin what you believe; string together what connects; write on cards what you suspect.', 'warm', 'spread-hands'),
        N('Beside it hangs a cord for the night’s events. Put them in order. When the order stops making sense, you have learned something.', 'thoughtful', 'nod'),
      ],
    },
    {
      id: 'ready',
      label: 'I’m ready. Gather the family.',
      kind: 'challenge',
      requires: { all: [{ minEvidence: 5 }, { minContradictions: 1 }] },
      then: 'confront',
      lines: [
        N('Are you? Truly? Once they are in that room, there is no wandering off to look at a clock.', 'thoughtful', 'lean-in'),
        N('Very well. The living room, by the knives. I shall fetch them. Bring your folder — and your nerve.', 'warm', 'nod'),
      ],
    },
    {
      id: 'close',
      label: 'I think we should leave it unsolved.',
      kind: 'small',
      requires: { minEvidence: 3 },
      then: 'close-case',
      lines: [
        N('Leave it? Hm. There is no shame in a case that refuses to close. There is only shame in closing it wrongly.', 'sad', 'nod'),
        N('Then let us walk out into the rain and let the house keep its secret a while longer.', 'thoughtful', 'look-away'),
      ],
    },
    {
      id: 'c-ransom',
      label: 'Ransom says it was a civil chat.',
      kind: 'challenge',
      requires: { any: [c('C-ransom-argument'), c('C-ransom-cake')] },
      lines: [
        N('And yet the walls of this house are thin and a teenager’s ears are not. Note what he does with a lie when it is caught: he does not abandon it, he redecorates it.', 'amused', 'point'),
        N('A man who lies about a quarrel is not necessarily a murderer. He may simply be a man who hates to lose an argument twice.', 'thoughtful'),
      ],
    },
    {
      id: 'c-linda',
      label: 'Linda’s account doesn’t hold.',
      kind: 'challenge',
      requires: { any: [c('C-linda-loan'), c('C-linda-window')] },
      lines: [
        N('Linda builds her story the way she builds her company: load-bearing walls first, inconvenient details plastered over.', 'neutral'),
        N('Tap the plaster gently. It does not mean the house is rotten. It means she is proud — and pride hides things that guilt never thinks to.', 'thoughtful', 'lean-in'),
      ],
    },
    {
      id: 'c-walt',
      label: 'Walt was fired, not thriving.',
      kind: 'challenge',
      requires: c('C-walt-fired'),
      lines: [N('Ah, Walter. He speaks of the company as a man speaks of a limb that has been amputated: he can still feel it. That is grief, or it is grievance. Possibly both.', 'thoughtful', 'nod')],
    },
    {
      id: 'c-joni',
      label: 'Joni has been double-billing.',
      kind: 'challenge',
      requires: c('C-joni-tuition'),
      lines: [N('Two invoices, one daughter. Joni has the most dangerous kind of dishonesty — the kind she has explained to herself so beautifully that she believes it.', 'amused', 'spread-hands')],
    },
    {
      id: 'c-richard',
      label: 'Richard and Harlan weren’t close.',
      kind: 'challenge',
      requires: c('C-richard-letter'),
      lines: [N('“Father and son.” Yes — and like many fathers and sons, one was about to expose the other. A deadline is a powerful thing to hand a frightened man.', 'thoughtful', 'point')],
    },
    {
      id: 'c-marta',
      label: 'Marta didn’t leave by the front door.',
      kind: 'challenge',
      requires: c('C-marta-door'),
      lines: [
        N('Mm. I wondered when you would come to that.', 'neutral', 'look-away'),
        N('Consider what kind of person climbs down a trellis in the rain — and whether she did it to escape, or because someone she loved asked her to. Those are different stories with the same muddy shoes.', 'thoughtful', 'lean-in', { tell: 'Blanc chooses his words about Marta with unusual care.' }),
      ],
    },
  ],
  reactions: [
    { evidence: 'EV-19', kind: 'explain', lines: [N('No overdose. Oh, how lovely. Then whoever arranged this tragedy got the tragedy and missed the crime. Someone burned this so that the family would go on believing Marta killed him.', 'amused', 'point')] },
    { evidence: 'EV-20', kind: 'explain', lines: [N('Everything to Marta. Now the whole house rearranges itself around that fact, does it not? Who knew — and when?', 'thoughtful', 'lean-in')] },
    { evidence: 'EV-01', kind: 'explain', lines: [N('From his own collection. Whoever chose it — Harlan or another — chose for symbolism over convenience. A kitchen knife would have been closer.', 'thoughtful')] },
    { evidence: 'EV-02', kind: 'explain', needsExamined: true, lines: [N('Two vials, one cap, one size. A careful nurse would never confuse them. A careful nurse, in the dark, rushing? Hm. Keep that label in your pocket.', 'thoughtful', 'lean-in')] },
    { evidence: 'EV-03', kind: 'acknowledge', lines: [N('White was winning. Harlan hated to lose — and yet he lost to her, cheerfully, for years. That tells you something about the two of them.', 'warm')] },
    { evidence: 'EV-04', kind: 'explain', lines: [N('A new will, a week old, unread. In a family like this, that is not a document — it is a lit fuse. Who knew it was burning?', 'thoughtful', 'point')] },
    { evidence: 'EV-05', kind: 'acknowledge', lines: [N('The empty slot sings, does it not? A gap in a pattern is the loudest thing in a room.', 'amused')] },
    { evidence: 'EV-06', kind: 'explain', lines: [N('A medical examiner’s letterhead, burned in the family fireplace. Someone in this house wanted a piece of paper to stop existing. People rarely burn good news.', 'thoughtful', 'lean-in')] },
    { evidence: 'EV-07', kind: 'explain', lines: [N('Snapped downward. Someone came down, not up — so they were already inside. That rules out a burglar and rules in a guest.', 'neutral', 'point')] },
    { evidence: 'EV-08', kind: 'explain', lines: [N('A small foot. Flat soles. Not a dress shoe — something you stand in all day. I make no accusation. I merely notice the shoe.', 'thoughtful', 'look-away')] },
    { evidence: 'EV-09', kind: 'acknowledge', lines: [N('Opened from inside, in haste. Harlan’s own window. Either he let someone out — or someone let themselves out of him.', 'thoughtful')] },
    { evidence: 'EV-10', kind: 'acknowledge', lines: [N('Harlan rearranged his own table in ink. A man who edits his seating plan is a man who has decided to edit his family.', 'amused', 'point')] },
    { evidence: 'EV-11', kind: 'acknowledge', lines: [N('Fran hides her keys among the flour. Every housekeeper is a locksmith of small secrets.', 'amused')] },
    { evidence: 'EV-12', kind: 'explain', lines: [N('The overnight tape — gone. Somebody wanted the night to have no witnesses. Which tells us the night had something to witness.', 'thoughtful', 'lean-in')] },
    { evidence: 'EV-13', kind: 'acknowledge', lines: [N('Look how the camera loves a family when they are lying to each other. Note who is already wearing his coat.', 'amused', 'point')] },
    { evidence: 'EV-14', kind: 'explain', lines: [N('Addressed to his nurse, hidden where only a thorough mind would look. Harlan was setting a puzzle for someone in particular. The question is whom he expected to solve it.', 'thoughtful', 'lean-in')] },
    { evidence: 'EV-15', kind: 'acknowledge', lines: [N('An angry driver in a wide-tyred car, leaving in a temper after the rain began. I wonder who in this family drives like a tantrum.', 'amused')] },
    { evidence: 'EV-16', kind: 'explain', lines: [N('Two payers, one school. Joni has found a way to be paid for her own maternal devotion. Ingenious, in its way.', 'amused', 'spread-hands')] },
    { evidence: 'EV-17', kind: 'explain', lines: [N('Unsent — but written. Harlan liked to rehearse cruelty on paper before he committed it in person. Richard had a deadline. Mark that.', 'thoughtful', 'point')] },
    { evidence: 'EV-18', kind: 'explain', lines: [N('So the crown prince of the publishing house was to be deposed. Walter will tell you he was thriving. Watch his hands when he does.', 'neutral', 'lean-in')] },
  ],
  fallback: [[N('Interesting. Hold onto it; I shan’t tell you why yet.', 'thoughtful')], [N('Mm. File that. Not everything is a clue, but everything is evidence of something.', 'amused')]],
  unexamined: [N('You have picked it up. Have you looked at it? Look at it properly, then show me again.', 'neutral', 'wave-off')],
  farewell: [N('Off you go. Ears open, mind ajar.', 'warm', 'nod')],
};
