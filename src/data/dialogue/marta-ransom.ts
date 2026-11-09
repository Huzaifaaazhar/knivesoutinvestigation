import type { Script } from '../../systems/dialogue';
import { N, Y, says } from './helpers';

export const MARTA: Script = {
  id: 'marta',
  greetings: [
    {
      when: { not: { met: 'marta' } },
      lines: [
        N('Oh — sorry. I didn’t hear you come in. You’re with Mr Blanc?', 'nervous', 'step-back', { tell: 'Marta startles, then smooths her sleeves down over her wrists.' }),
        N('I’m Marta. I was Harlan’s nurse. I… still come in. Habit. Somebody has to water the orchid.', 'sad', 'look-away'),
      ],
    },
    { when: { contradiction: 'C-marta-door' }, lines: [N('You look like you want to ask me something difficult. Okay. Ask.', 'nervous', 'hand-chest', { tell: 'Marta’s hand goes to her stomach when she sees you.' })] },
    { lines: [N('Hello again. Can I get you a coffee? Fran left a whole pot.', 'warm', 'nod')] },
  ],
  occupied: [N('Give me a moment, please — I just need a moment.', 'sad', 'look-away')],
  topics: [
    {
      id: 'harlan',
      label: 'Tell me about Harlan.',
      kind: 'harlan',
      lines: [
        N('He was… impossible. Brilliant, rude to people who deserved it, very kind to people who didn’t expect it.', 'warm', 'spread-hands'),
        N('He taught me Go the first week. He said a nurse who can’t beat her patient at something will start treating him like an invalid.', 'sad', 'look-away', {
          tell: 'Marta’s eyes fill when she mentions Go; she blinks it away quickly.',
          effects: [{ relationship: 'R-harlan-marta-trust' }],
        }),
      ],
      again: [N('I miss him. That’s all, really. I miss him.', 'sad')],
    },
    {
      id: 'evening',
      label: 'Walk me through the night.',
      kind: 'evening',
      lines: [
        N('After the party he went up to the study. We played Go, the way we always did.', 'neutral', 'nod', { effects: [says('S-marta-go')] }),
        N('He lost. He pretended he’d let me win. Then I gave him his medication, said goodnight…', 'sad'),
        N('…and I went home. Out the front door, like always. It was raining.', 'nervous', 'look-away', {
          tell: 'When she says “front door” Marta looks at the floor and swallows hard.',
          effects: [says('S-marta-left')],
        }),
      ],
      again: [N('Go, medicine, goodnight, home. I’ve said it to the police three times.', 'nervous', 'look-away')],
    },
    {
      id: 'meds',
      label: 'About his medication…',
      kind: 'document',
      requires: { any: [{ evidence: 'EV-02' }, { heard: 'S-marta-left' }] },
      lines: [
        Y('What did he take that night?'),
        N('Ketorolac for the pain, and a small dose of morphine to sleep. The same every night.', 'neutral', 'nod'),
        N('I prepare every dose myself. I am careful. I am always careful.', 'defensive', 'hand-chest', {
          tell: 'She repeats “careful” like a prayer, gripping her own wrist.',
          effects: [says('S-marta-meds')],
        }),
      ],
    },
    {
      id: 'family',
      label: 'How did the family treat you?',
      kind: 'family',
      lines: [
        N('They say I’m “like family.” They say it a lot. They also say I’m from three different countries, depending on who’s talking.', 'amused', 'shrug'),
        N('Meg is different. Meg actually talks to me. She texts me about school.', 'warm', 'nod', { effects: [{ relationship: 'R-meg-marta-friend' }] }),
      ],
    },
    {
      id: 'note',
      label: 'Harlan left a note — for you.',
      kind: 'document',
      requires: { evidence: 'EV-14' },
      lines: [
        Y('It was hidden in a book in the library. It’s addressed to you.'),
        N('To me? Not to Linda? Not to… anyone?', 'surprised', 'hand-chest', { tell: 'Marta reads it twice. Her hands are shaking, but she smiles.' }),
        N('“Trust your good heart.” He used to say that when I hesitated over a move. I don’t know why he would hide it.', 'sad', 'look-away', {
          effects: [{ motive: { character: 'marta', category: 'inheritance' } }, { relationship: 'R-harlan-marta-trust' }],
        }),
      ],
    },
    {
      id: 'challenge-door',
      label: 'You didn’t leave by the front door.',
      kind: 'challenge',
      requires: { contradiction: 'C-marta-door' },
      lines: [
        Y('Somebody small, in flat shoes, climbed down the trellis from Harlan’s window.'),
        N('I —', 'nervous', 'hand-mouth', { tell: 'Marta goes grey. She presses a hand to her mouth as if she might be sick — the moment she tries to deny it.' }),
        N('I can’t… I can’t say it wasn’t me. I physically can’t. When I lie, I get sick. It’s stupid. It’s true.', 'sick', 'hand-mouth'),
        N('He asked me to go by the window. He said it was a game — so Great Nana wouldn’t hear me on the stairs and think something improper.', 'sad', 'look-away', {
          effects: [says('S-marta-window'), { relationship: 'R-harlan-marta-secret' }, { motive: { character: 'marta', category: 'loyalty' } }],
        }),
        N('Please. That’s all I can tell you tonight.', 'nervous', 'step-back'),
      ],
      again: [N('I told you what happened with the window. I can’t talk about it again. Not tonight.', 'nervous', 'look-away')],
    },
    {
      id: 'tox',
      label: 'The toxicology report came back.',
      kind: 'document',
      requires: { evidence: 'EV-19' },
      lines: [
        Y('There was no overdose, Marta. The morphine was a normal dose.'),
        N('No. No, that’s not — I read the labels. I gave him the hundred milligrams. I saw it.', 'surprised', 'step-back', { tell: 'Marta grips the edge of the counter as if the floor has moved.' }),
        N('Unless the labels were… Unless someone…', 'thoughtful', 'hand-mouth'),
        N('I always know them by the weight. By the feel of the liquid. I must have — my hands chose the right one, and my eyes told me I had killed him.', 'sad', 'hand-chest', {
          tell: 'Marta is crying, and for the first time tonight she does not look afraid.',
          effects: [{ note: 'Marta, on the report: her hands chose the right vial; the labels told her otherwise. Someone switched them.' }],
        }),
      ],
    },
    {
      id: 'meg',
      label: 'Meg seems to look out for you.',
      kind: 'relationship',
      requires: { met: 'meg' },
      lines: [N('She’s the only one who asked if I was okay. Everyone else asked if I had heard about the will.', 'sad', 'shrug', { effects: [{ relationship: 'R-meg-marta-friend' }, { motive: { character: 'meg', category: 'loyalty' } }] })],
    },
  ],
  reactions: [
    { evidence: 'EV-19', kind: 'surprise', lines: [N('A normal dose? Then he — then I didn’t —', 'surprised', 'hand-mouth', { tell: 'Marta reads the report three times. Her lips move with the numbers.' })] },
    { evidence: 'EV-20', kind: 'surprise', lines: [N('Me? Everything? No. No, he wouldn’t — they’ll never — oh, Harlan, what did you do?', 'surprised', 'hand-chest', { tell: 'Marta looks more frightened by the will than by anything else tonight.', effects: [{ motive: { character: 'marta', category: 'inheritance' } }] })] },
    {
      evidence: 'EV-02',
      kind: 'explain',
      lines: [
        N('That’s my bag. The police gave it back. The two vials — they look the same, I know, but I know the difference by — by the weight of them in my hand.', 'defensive', 'hand-chest', { tell: 'Marta reaches for the bag, then stops herself.' }),
      ],
    },
    {
      evidence: 'EV-02',
      when: { detail: 'medbag:labels' },
      kind: 'surprise',
      lines: [N('Re-stuck? The label? I didn’t do that. I don’t… why would anyone…', 'surprised', 'step-back', { tell: 'For the first time Marta looks genuinely confused rather than frightened.' })],
    },
    { evidence: 'EV-03', kind: 'acknowledge', lines: [N('White was winning. He would have resigned in four moves. He always pretended to be thinking when he was really just enjoying himself.', 'warm', 'nod')] },
    {
      evidence: 'EV-07',
      kind: 'denial',
      when: { not: { contradiction: 'C-marta-door' } },
      lines: [N('The trellis? I don’t — the garden isn’t my job.', 'nervous', 'look-away', { tell: 'Marta swallows twice and puts a hand over her stomach.' })],
    },
    {
      evidence: 'EV-08',
      kind: 'defensive',
      lines: [N('Lots of people have small feet.', 'nervous', 'look-away', { tell: 'Marta glances, very briefly, down at her own shoes.' })],
    },
    { evidence: 'EV-09', kind: 'defensive', lines: [N('His window always stuck. He was always asking someone to open it for air.', 'nervous', 'shrug')] },
    { evidence: 'EV-14', kind: 'surprise', lines: [N('That’s his handwriting. That’s… for me?', 'surprised', 'hand-chest', { effects: [{ motive: { character: 'marta', category: 'inheritance' } }] })] },
    { evidence: 'EV-01', kind: 'acknowledge', lines: [N('Please put that away. I — please.', 'sad', 'look-away', { tell: 'Marta turns her whole body away from the blade.' })] },
    { evidence: 'EV-12', kind: 'surprise', lines: [N('The tape is missing? Fran changes those. You should ask… someone who knows about the cameras.', 'nervous', 'look-away', { tell: 'Marta’s breathing quickens at the mention of the camera.' })] },
  ],
  fallback: [
    [N('I’m sorry, I don’t know what that means. I only knew Harlan’s rooms, really — and his medicine.', 'nervous', 'shrug')],
    [N('I don’t know anything about that. Honestly.', 'neutral', 'shake')],
    [N('Should I know what that is? I’m sorry. I’m tired.', 'sad', 'look-away')],
  ],
  unexamined: [N('I… what is it, exactly? You’re holding it like you haven’t looked at it yet.', 'nervous', 'shrug')],
  farewell: [N('Okay. I’ll be here. Somebody should be.', 'sad', 'nod')],
};

export const RANSOM: Script = {
  id: 'ransom',
  greetings: [
    {
      when: { not: { met: 'ransom' } },
      lines: [
        N('Well, well. The deputy. Did Blanc wind you up and point you at me?', 'smug', 'lean-in'),
        N('Hugh Drysdale. Everyone calls me Ransom, except my mother, who calls me “after everything we’ve done for you.”', 'amused', 'spread-hands'),
      ],
    },
    { when: { any: [{ contradiction: 'C-ransom-argument' }, { contradiction: 'C-ransom-cake' }] }, lines: [N('Back again. You’ve got your gotcha face on. It’s adorable.', 'smug', 'cross-arms')] },
    { lines: [N('Detective’s apprentice. To what do I owe the inconvenience?', 'smug', 'nod')] },
  ],
  unwilling: [
    N('I don’t do interviews with the help. No offence. Some offence.', 'smug', 'wave-off', { tell: 'Ransom doesn’t turn around; he talks to the fire.' }),
    N('Go and find the Southern-fried detective. Come back when you’ve got something more interesting than a notebook.', 'irritated', 'wave-off'),
  ],
  occupied: [N('Not now.', 'irritated', 'wave-off')],
  topics: [
    {
      id: 'harlan',
      label: 'What was your grandfather like?',
      kind: 'harlan',
      lines: [
        N('Harlan? A genius who wrote the same murder eighty times and got paid for every one of them.', 'smug', 'shrug'),
        N('He was the only one in this family who ever found me funny.', 'thoughtful', 'look-away', { tell: 'For half a second, the smirk slips. Then it’s back.' }),
      ],
    },
    {
      id: 'evening',
      label: 'Tell me about the party.',
      kind: 'evening',
      lines: [
        N('Champagne, speeches, Uncle Walt doing his impression of a man who reads.', 'amused', 'spread-hands'),
        N('I stayed for cake, sang the song, kissed Great Nana, drove home. Model grandson.', 'smug', 'nod', {
          tell: 'He answers before you finish the question, like he’s rehearsed it.',
          effects: [says('S-ransom-left')],
        }),
      ],
      again: [N('Cake. Song. Car. Home. Do you want me to draw it?', 'irritated', 'wave-off')],
    },
    {
      id: 'chat',
      label: 'You saw Harlan alone that night.',
      kind: 'event',
      requires: { any: [{ heard: 'S-meg-shouting' }, { evidence: 'EV-10' }, { milestone: 'read-attorney-letter' }, { memory: 'M-argument' }] },
      lines: [
        Y('In the study. Just the two of you.'),
        N('We had a perfectly lovely chat. Very civil. Grandpa and I go way back — all the way to my birth, actually.', 'smug', 'spread-hands', {
          tell: 'Ransom’s jaw tightens on “civil.” He picks at the cuff of his sweater.',
          effects: [says('S-ransom-civil')],
        }),
      ],
    },
    {
      id: 'family',
      label: 'How do you get on with the family?',
      kind: 'family',
      lines: [
        N('My mother thinks she built her empire alone. My father thinks he’s handsome. Walt thinks he’s a publisher. Joni thinks she’s a brand.', 'smug', 'point'),
        N('And they all think I’m the problem. Which is restful, honestly — it saves them looking at each other.', 'amused', 'shrug', { effects: [{ relationship: 'R-linda-ransom-conflict' }, { motive: { character: 'ransom', category: 'family' } }] }),
      ],
    },
    {
      id: 'will',
      label: 'Did you know about the new will?',
      kind: 'document',
      requires: { milestone: 'read-attorney-letter' },
      lines: [
        N('What new will?', 'surprised', 'step-back', { tell: 'Ransom’s eyebrows go up a beat too late — the surprise arrives after the question.' }),
        N('Oh, you mean the one everyone’s been whispering about since lunch. I assume I get a sock and a strongly worded paragraph. Grandpa liked a strong paragraph.', 'smug', 'shrug', {
          effects: [{ motive: { character: 'ransom', category: 'inheritance' } }],
        }),
      ],
    },
    {
      id: 'car',
      label: 'Someone tore up the service drive.',
      kind: 'event',
      requires: { evidence: 'EV-15' },
      lines: [N('I drive like I live: fast, and with my mother’s disapproval in the rear-view mirror. So what?', 'smug', 'lean-in', { tell: 'He doesn’t ask what night you mean.' })],
    },
    {
      id: 'challenge-argument',
      label: 'It wasn’t a civil chat. People heard you.',
      kind: 'challenge',
      requires: { contradiction: 'C-ransom-argument' },
      lines: [
        Y('Meg heard shouting. Harlan moved you to the end of the table himself.'),
        N('Of course Meg heard. Meg hears everything; it’s her only hobby that isn’t posting.', 'irritated', 'cross-arms'),
        N('Fine. We argued. He told me something I didn’t care for, and I left before anybody lit a candle. Happy?', 'angry', 'spread-hands', {
          tell: 'Ransom says “before anybody lit a candle” — then visibly realises he has changed his story.',
          effects: [says('S-ransom-argued'), { relationship: 'R-harlan-ransom-conflict' }, { motive: { character: 'ransom', category: 'inheritance' } }],
        }),
        N('And no, I’m not telling you what he said. Go and find a document. You seem to like those.', 'smug', 'wave-off'),
      ],
      again: [N('We argued. I left. The end. Roll credits.', 'irritated', 'wave-off')],
    },
    {
      id: 'challenge-car',
      label: 'Your car was still here after the rain.',
      kind: 'challenge',
      requires: { contradiction: 'C-ransom-car' },
      lines: [
        Y('Those ruts on the service drive were cut after the rain began. You said you were home by half nine.'),
        N('I said I drove home. I didn’t say when I started.', 'smug', 'spread-hands', { tell: 'Ransom smiles, but his foot has started tapping.' }),
        N('I sat in my car and brooded. For a while. A long while. Then I drove off. Brooding isn’t a crime.', 'defensive', 'cross-arms', { effects: [says('S-ransom-stayed')] }),
        N('And before you ask — no, I didn’t go back inside. Why would I? Nobody in there wanted me.', 'irritated', 'look-away', { tell: 'He answers a question you didn’t ask.' }),
      ],
      again: [N('I brooded. In a car. Alone. Write it in your little book.', 'irritated', 'wave-off')],
    },
    {
      id: 'will-truth',
      label: 'Harlan told you about the will.',
      kind: 'document',
      requires: { any: [{ evidence: 'EV-20' }, { detail: 'sealed-will:annotation' }] },
      lines: [
        Y('“Told R. at the party.” It’s pencilled in the margin of his own copy.'),
        N('He told me. Everything to the nurse. My grandfather’s idea of a birthday present to himself.', 'angry', 'spread-hands', { effects: [says('S-ransom-knew'), { motive: { character: 'ransom', category: 'inheritance' } }, { relationship: 'R-harlan-ransom-conflict' }] }),
        N('So yes, I knew, and yes, I was angry. Being angry is the most natural thing in the world. Everyone in this house is angry. Go and ask them.', 'smug', 'lean-in', { tell: 'Ransom is enjoying this less than he wants you to think.' }),
      ],
    },
    {
      id: 'challenge-cake',
      label: 'You were in your coat before the cake.',
      kind: 'challenge',
      requires: { contradiction: 'C-ransom-cake' },
      lines: [
        Y('Joni’s Polaroid. You’re dressed to leave before the candles.'),
        N('Who takes Polaroids anymore? Joni. Of course.', 'irritated', 'look-away'),
        N('All right, I skipped the cake. Grandpa and I had words, I needed air, and I didn’t want to watch everyone pretend to like each other.', 'defensive', 'cross-arms', {
          effects: [says('S-ransom-argued'), { relationship: 'R-harlan-ransom-conflict' }],
        }),
      ],
      again: [N('Yes, I skipped the cake. Arrest me for crimes against frosting.', 'smug', 'wave-off')],
    },
  ],
  reactions: [
    { evidence: 'EV-19', kind: 'defensive', lines: [N('Medical paperwork. Riveting. Why would I care what was in an old man’s blood?', 'defensive', 'wave-off', { tell: 'Ransom’s eyes go to the fireplace, then back to you.' })] },
    { evidence: 'EV-06', kind: 'denial', lines: [N('Somebody burned some paper in a fireplace. In a house with six fireplaces. Call the FBI.', 'smug', 'wave-off', { tell: 'He doesn’t ask what the paper was.' })] },
    { evidence: 'EV-02', kind: 'denial', lines: [N('The nurse’s bag. What would I want with that? I don’t even know which end of a syringe is which.', 'smug', 'shrug', { tell: 'For someone who doesn’t care, he answers very quickly.' })] },
    { evidence: 'EV-20', kind: 'refuse', lines: [N('I’m not discussing my grandfather’s idea of a joke.', 'angry', 'step-back')] },
    { evidence: 'EV-10', kind: 'defensive', lines: [N('He moved my place card. Grandpa was petty in ink. That’s not a confession, that’s stationery.', 'irritated', 'wave-off', { tell: 'He doesn’t look at the card for long.' })] },
    { evidence: 'EV-13', kind: 'defensive', lines: [N('Nice photo. I look great. I always look like I’m leaving; it’s my brand.', 'defensive', 'shrug')] },
    { evidence: 'EV-15', kind: 'acknowledge', lines: [N('Mud. In the country. Stop the presses.', 'smug', 'wave-off')] },
    {
      evidence: 'EV-04',
      kind: 'surprise',
      lines: [N('Stevens. Of course it’s Stevens. He always did love a dramatic letter.', 'irritated', 'look-away', { tell: 'Ransom reads the letter faster than anyone has read anything tonight.', effects: [{ motive: { character: 'ransom', category: 'inheritance' } }] })],
    },
    { evidence: 'EV-05', kind: 'acknowledge', lines: [N('The knife throne. I used to dare Meg to touch it. Somebody took the dare, I see.', 'smug', 'point')] },
    { evidence: 'EV-01', kind: 'acknowledge', lines: [N('Theatrical, isn’t it? He’d have written it better.', 'smug', 'shrug', { tell: 'For all the bravado, Ransom doesn’t look at the blade itself.' })] },
    { evidence: 'EV-14', kind: 'denial', lines: [N('A love note to the nurse. How on-brand. If you’re expecting me to be jealous, I’m not. Much.', 'smug', 'wave-off', { tell: 'He lingers on the name at the top of the note.' })] },
  ],
  fallback: [
    [N('Is this a scavenger hunt? Because I’m winning by not playing.', 'smug', 'wave-off')],
    [N('Fascinating. Truly. Go and show it to my mother; she adores things she can’t understand.', 'smug', 'shrug')],
    [N('No idea. Next.', 'irritated', 'wave-off')],
  ],
  unexamined: [N('You haven’t even read it, have you? Do your homework, kid.', 'smug', 'lean-in')],
  farewell: [N('Bye now. Don’t solve anything I wouldn’t solve.', 'smug', 'wave-off')],
};
