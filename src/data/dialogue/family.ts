import type { Script } from '../../systems/dialogue';
import { N, Y, says } from './helpers';

export const LINDA: Script = {
  id: 'linda',
  greetings: [
    {
      when: { not: { met: 'linda' } },
      lines: [
        N('You must be Mr Blanc’s assistant. Linda Drysdale. I run a company, so I’d appreciate it if we were efficient.', 'neutral', 'nod', { tell: 'Linda offers a handshake like a business card — brisk, firm, already moving on.' }),
        N('My father has been dead a week and there are strangers in his house. You’ll forgive me if I don’t make tea.', 'irritated', 'cross-arms'),
      ],
    },
    { when: { contradiction: 'C-linda-loan' }, lines: [N('You again. I hope this is about something other than my finances.', 'defensive', 'cross-arms')] },
    { lines: [N('Yes?', 'neutral', 'nod')] },
  ],
  occupied: [N('I’m on the phone with the funeral director. Five minutes.', 'irritated', 'wave-off')],
  topics: [
    {
      id: 'harlan',
      label: 'Tell me about your father.',
      kind: 'harlan',
      lines: [
        N('Dad was the most brilliant man I’ve ever known and he made sure we never forgot it.', 'neutral', 'spread-hands'),
        N('When I was ten he set me a puzzle box for my birthday. It took me three weeks. When I opened it there was a note inside: “Again, faster.”', 'sad', 'look-away', { tell: 'Linda smiles at the memory, and it doesn’t reach anywhere near her eyes.' }),
      ],
    },
    {
      id: 'company',
      label: 'You run your own company?',
      kind: 'family',
      lines: [
        N('Commercial real estate. I built it with my own two hands. Dad had nothing to do with it.', 'neutral', 'hand-chest', { effects: [says('S-linda-selfmade')] }),
        N('People assume, with a father like mine. They’re wrong.', 'defensive', 'cross-arms', { tell: 'She says “they’re wrong” to a point just over your shoulder.' }),
      ],
      again: [N('My company. Mine. We’ve covered this.', 'irritated', 'wave-off')],
    },
    {
      id: 'evening',
      label: 'How did the evening end?',
      kind: 'evening',
      lines: [
        N('The way all our evenings end. Someone says something political, someone storms out, someone cries in a bathroom.', 'amused', 'shrug'),
        N('After the party nobody went near Dad’s rooms. The house was asleep by midnight. I’d have heard.', 'neutral', 'nod', { effects: [says('S-linda-quiet')] }),
      ],
    },
    {
      id: 'richard',
      label: 'And your husband?',
      kind: 'relationship',
      lines: [N('Richard is devoted. Richard is… Richard. We have no secrets; we don’t have the time for them.', 'neutral', 'nod', { tell: 'Linda twists her wedding ring a full turn while she answers.' })],
    },
    {
      id: 'ransom',
      label: 'Your son and his grandfather…',
      kind: 'relationship',
      requires: { met: 'ransom' },
      lines: [
        N('Ransom is the only person in this family who never wanted anything from Dad except attention. Which, God help us, is what Dad never gave freely.', 'sad', 'look-away'),
        N('He’s not a bad boy. He’s just never been told no in a way that stuck.', 'defensive', 'cross-arms', { effects: [{ relationship: 'R-linda-ransom-conflict' }] }),
      ],
    },
    {
      id: 'house',
      label: 'Who gets the house?',
      kind: 'document',
      requires: { milestone: 'read-attorney-letter' },
      lines: [N('That’s for Alan Stevens to read, not for me to speculate. But I am the eldest, and I am the one who has kept this family solvent.', 'neutral', 'point', { effects: [{ motive: { character: 'linda', category: 'inheritance' } }] })],
    },
    {
      id: 'challenge-loan',
      label: 'Harlan gave you a million dollars.',
      kind: 'challenge',
      requires: { contradiction: 'C-linda-loan' },
      lines: [
        Y('A loan. To start your company.'),
        N('Who told you that?', 'angry', 'step-back', { tell: 'Linda’s colour rises from her collar.' }),
        N('Fine. He lent me a million dollars. I paid back every cent, with interest. It doesn’t count.', 'defensive', 'cross-arms', {
          effects: [says('S-linda-loan'), { relationship: 'R-harlan-linda-loan' }, { motive: { character: 'linda', category: 'reputation' } }],
        }),
        N('Do you know what it’s like to do everything right and still have people say “her father”?', 'sad', 'look-away'),
      ],
    },
    {
      id: 'challenge-window',
      label: 'Somebody did go near his rooms.',
      kind: 'challenge',
      requires: { contradiction: 'C-linda-window' },
      lines: [
        Y('The window latch was forced, and someone came down the trellis.'),
        N('Then find out who and stop looking at my family as if we’re a lineup.', 'angry', 'point'),
        N('…I said the house was asleep. I said I would have heard. I suppose I was asleep too.', 'thoughtful', 'look-away', { tell: 'For the first time Linda sounds uncertain rather than certain.' }),
      ],
    },
  ],
  reactions: [
    {
      evidence: 'EV-17',
      kind: 'surprise',
      lines: [N('“Tell Linda by the end of the week.” Tell Linda what?', 'surprised', 'step-back', { tell: 'Linda reads the letter once, then folds it very precisely in half and hands it back without a word.', effects: [{ relationship: 'R-richard-linda-secret' }] })],
    },
    { evidence: 'EV-04', kind: 'defensive', lines: [N('Alan Stevens told me nothing about a new will, which means Dad told him not to. Which means it’s bad.', 'defensive', 'cross-arms', { effects: [{ motive: { character: 'linda', category: 'inheritance' } }] })] },
    { evidence: 'EV-10', kind: 'explain', lines: [N('Dad moved Ransom to the end of the table. He did it in front of the caterers. That’s my father: never a private humiliation when a public one would do.', 'irritated', 'shrug')] },
    { evidence: 'EV-09', kind: 'denial', lines: [N('That window has stuck since the Carter administration. A scratch is not a conspiracy.', 'defensive', 'wave-off')] },
    { evidence: 'EV-13', kind: 'acknowledge', lines: [N('Joni and her Polaroids. Look at Richard’s smile. He’s never once in his life had his photo taken without knowing.', 'irritated', 'point')] },
  ],
  fallback: [
    [N('I don’t see what that has to do with my family. Make it relevant or put it away.', 'irritated', 'cross-arms')],
    [N('If this is going somewhere, I’d appreciate it getting there.', 'neutral', 'wave-off')],
    [N('That’s a question for the staff, not for me.', 'neutral', 'shrug')],
  ],
  unexamined: [N('You clearly haven’t read that properly. Read it, then come back and waste my time with it.', 'irritated', 'wave-off')],
  farewell: [N('We’re done for now.', 'neutral', 'nod')],
};

export const WALT: Script = {
  id: 'walt',
  greetings: [
    {
      when: { not: { met: 'walt' } },
      lines: [
        N('Walt Thrombey — I run Dad’s publishing house. Blood Like Wine. You’ve heard of us? You’ve read us. Everyone’s read us.', 'neutral', 'adjust-glasses', { tell: 'Walt adjusts his glasses and his cardigan in the same nervous motion.' }),
        N('Anything you need, I’m the point person. I’m always the point person.', 'nervous', 'spread-hands'),
      ],
    },
    { lines: [N('Ah, hello. Yes. What can I— yes.', 'nervous', 'adjust-glasses')] },
  ],
  occupied: [
    N('—no, I said nothing’s been signed. Nothing. Hold on.', 'irritated', 'wave-off', { tell: 'Walt covers the phone with his hand; his knuckles are white.' }),
    N('Sorry — work. Give me a few minutes. Have a look around; the first editions are on the second shelf.', 'nervous', 'point'),
  ],
  topics: [
    {
      id: 'harlan',
      label: 'What was your father like?',
      kind: 'harlan',
      lines: [
        N('A legend. A brand. Dad was a brand before brands. My whole career has been making sure the world remembered that.', 'neutral', 'spread-hands'),
        N('He didn’t always appreciate that the books don’t sell themselves.', 'irritated', 'adjust-glasses', { tell: 'Walt’s voice tightens on “didn’t always appreciate.”' }),
      ],
    },
    {
      id: 'business',
      label: 'How’s the publishing house?',
      kind: 'family',
      lines: [
        N('Thriving. Dad and I talked shop at the party — film rights, the backlist. He was thrilled with the direction we’re taking.', 'neutral', 'nod', {
          tell: 'Walt answers in the present tense, very quickly, and rubs his thumb against his palm.',
          effects: [says('S-walt-business')],
        }),
      ],
      again: [N('Thriving, I said. Thriving.', 'nervous', 'adjust-glasses')],
    },
    {
      id: 'rights',
      label: 'Film rights?',
      kind: 'document',
      requires: { discussed: 'walt:business' },
      lines: [
        N('Television, actually. Streaming. Eighty novels — that’s eighty seasons! Dad just needed to see the vision.', 'nervous', 'spread-hands'),
        N('He thought adaptations were vulgar. He said so. A lot.', 'irritated', 'look-away', { effects: [{ motive: { character: 'walt', category: 'business' } }] }),
      ],
    },
    {
      id: 'evening',
      label: 'Where were you that night?',
      kind: 'evening',
      lines: [N('With my wife and my boy, Jacob, most of the evening. Jacob was on his phone in the bathroom for two hours, but that’s Jacob. Bed by midnight.', 'neutral', 'shrug')],
    },
    {
      id: 'joni',
      label: 'And Joni?',
      kind: 'relationship',
      requires: { met: 'joni' },
      lines: [
        N('Joni is family. Joni is very much family, financially speaking.', 'smug', 'adjust-glasses'),
        N('You might ask her about her allowance. I hear it had a difficult night.', 'smug', 'lean-in', { tell: 'Walt looks pleased to be passing on gossip — relieved to talk about someone else.', effects: [{ flag: 'walt-joni' }, { relationship: 'R-harlan-joni-money' }] }),
      ],
    },
    {
      id: 'challenge-fired',
      label: 'Harlan fired you.',
      kind: 'challenge',
      requires: { contradiction: 'C-walt-fired' },
      lines: [
        Y('He’d already written your dismissal.'),
        N('That’s — that was — a draft. A thought. Dad had a lot of thoughts.', 'nervous', 'adjust-glasses', { tell: 'Walt takes his glasses off and cleans them on a cardigan that is not dirty.' }),
        N('He fired me. From the company I’ve run for twenty years. Off the back of his own books. He said it was for my own good. Everything he did to us was for our own good.', 'angry', 'spread-hands', {
          effects: [says('S-walt-fired'), { relationship: 'R-harlan-walt-business' }, { motive: { character: 'walt', category: 'career' } }],
        }),
      ],
    },
  ],
  reactions: [
    {
      evidence: 'EV-18',
      kind: 'defensive',
      lines: [N('Where did you get that? That was in a — that’s private correspondence.', 'angry', 'step-back', { tell: 'Walt reaches for the memo as if to take it back.', effects: [{ motive: { character: 'walt', category: 'career' } }] })],
    },
    { evidence: 'EV-04', kind: 'surprise', lines: [N('A new will? Stevens didn’t— nobody told me. Did it say anything about the company? The rights?', 'nervous', 'lean-in', { effects: [{ motive: { character: 'walt', category: 'business' } }] })] },
    { evidence: 'EV-12', kind: 'acknowledge', lines: [N('The cameras are Fran’s department. Dad didn’t trust anything with a cable.', 'neutral', 'shrug')] },
    { evidence: 'EV-16', kind: 'acknowledge', lines: [N('Ha! Two payers. I knew it. I knew it! Sorry. Grief.', 'smug', 'point', { effects: [{ relationship: 'R-harlan-joni-money' }] })] },
  ],
  fallback: [
    [N('Is that — should I know what that is? I’m more of a big-picture person.', 'nervous', 'adjust-glasses')],
    [N('Not my department. I’ll have someone look into it. Well — I won’t, but someone should.', 'nervous', 'shrug')],
    [N('Hm. Interesting. Very… evidentiary.', 'neutral', 'adjust-glasses')],
  ],
  unexamined: [N('You haven’t really looked at that, have you? You should look at it. Thoroughly. Away from me.', 'nervous', 'wave-off')],
  farewell: [N('Right. Good. Anything you need — point person.', 'nervous', 'nod')],
};

export const JONI: Script = {
  id: 'joni',
  greetings: [
    {
      when: { not: { met: 'joni' } },
      lines: [
        N('Oh! Hi. I’m Joni. You have a really guarded aura — that’s okay. It’s a hard week for auras.', 'warm', 'hand-chest'),
        N('Harlan was like a father to me. After Neil passed, he just… took care of us. Spiritually.', 'sad', 'look-away', { tell: 'Joni says “spiritually” after a small pause, as if choosing it from a list.' }),
      ],
    },
    { when: { contradiction: 'C-joni-tuition' }, lines: [N('Hi again. I’m feeling a lot of judgement in this space.', 'defensive', 'cross-arms')] },
    { lines: [N('Hey! Breathe with me for a second. In… and out. Okay, what’s up?', 'warm', 'spread-hands')] },
  ],
  occupied: [N('I’m mid-meditation. Can you come back in ten? Or twelve. Twelve is a healing number.', 'neutral', 'wave-off')],
  topics: [
    {
      id: 'harlan',
      label: 'What was Harlan to you?',
      kind: 'harlan',
      lines: [
        N('Harlan saw me. You know? The real me. The brand, the mission. He believed in Flam.', 'warm', 'hand-chest'),
        N('Flam is my lifestyle company. It’s about self-care. He invested emotionally.', 'neutral', 'spread-hands', { tell: '“Invested” makes Joni glance at her own handbag.' }),
      ],
    },
    {
      id: 'meg',
      label: 'Tell me about Meg.',
      kind: 'family',
      lines: [
        N('Meg is my whole heart. She’s at a very progressive school — very expensive, but it’s an investment in her truth.', 'warm', 'hand-chest'),
        N('I pay her tuition myself. Every penny. It’s important to me that she sees that.', 'neutral', 'nod', { tell: 'Joni says “every penny” slightly louder than the rest.', effects: [says('S-joni-tuition')] }),
      ],
    },
    {
      id: 'money',
      label: 'Did Harlan support you financially?',
      kind: 'family',
      requires: { any: [{ flag: 'walt-joni' }, { flag: 'album-tuition' }, { evidence: 'EV-16' }, { heard: 'S-meg-tuition' }] },
      lines: [
        N('We never really talked about money. It’s such a low-vibration topic.', 'defensive', 'wave-off', { tell: 'Joni’s smile stays perfectly in place while her shoulders rise toward her ears.' }),
        N('Walt said that, didn’t he. Walt has a very scarcity-based mindset.', 'irritated', 'cross-arms'),
      ],
    },
    {
      id: 'evening',
      label: 'And the night of the party?',
      kind: 'evening',
      lines: [N('I did my evening ritual in the conservatory, then bed. Oh — and I took a few Polaroids at the party. Analogue memories. I put them away somewhere.', 'warm', 'nod')],
    },
    {
      id: 'challenge-tuition',
      label: 'Harlan paid Meg’s school directly.',
      kind: 'challenge',
      requires: { contradiction: 'C-joni-tuition' },
      lines: [
        Y('And you kept collecting the money for it.'),
        N('That — okay, the school sends two invoices. It’s a bureaucracy, not a crime.', 'defensive', 'spread-hands', { tell: 'Joni’s voice climbs half an octave.' }),
        N('And yes… Harlan found out. He stopped the allowance. That night. He said I’d been “lying to my own child.” As if it’s lying if it’s for her.', 'sad', 'look-away', {
          effects: [says('S-joni-cut'), { relationship: 'R-harlan-joni-money' }, { relationship: 'R-joni-meg-money' }, { motive: { character: 'joni', category: 'money' } }],
        }),
        N('Please don’t tell Meg. Please.', 'nervous', 'hand-chest'),
      ],
    },
  ],
  reactions: [
    {
      evidence: 'EV-16',
      kind: 'defensive',
      lines: [N('That’s… that’s an administrative document. Paper is a very toxic medium for truth.', 'defensive', 'wave-off', { tell: 'Joni won’t take the statement from you.', effects: [{ relationship: 'R-harlan-joni-money' }] })],
    },
    { evidence: 'EV-13', kind: 'acknowledge', lines: [N('Oh! My Polaroid! Isn’t it gorgeous? Look at the light. Ransom ruins it, obviously.', 'warm', 'point')] },
    { evidence: 'EV-14', kind: 'defensive', lines: [N('To Marta? Huh. Well. She was very… present for him. In the house. Every day.', 'irritated', 'cross-arms', { tell: 'Joni’s warmth drops several degrees at Marta’s name.' })] },
    { evidence: 'EV-04', kind: 'surprise', lines: [N('A new will. Okay. I’m going to need to sit with that energy for a moment.', 'nervous', 'hand-chest')] },
  ],
  fallback: [
    [N('I’m not getting anything from that. Energetically.', 'neutral', 'shrug')],
    [N('Hm. Put it down for a second — let’s just let it breathe.', 'warm', 'wave-off')],
    [N('That feels like a Linda question.', 'neutral', 'shrug')],
  ],
  unexamined: [N('You haven’t really sat with that, have you? Sit with it. Then show me.', 'warm', 'wave-off')],
  farewell: [N('Namaste. Or, like, see you.', 'warm', 'nod')],
};

export const MEG: Script = {
  id: 'meg',
  greetings: [
    {
      when: { not: { met: 'meg' } },
      lines: [
        N('Hey. You’re the detective-adjacent person. I’m Meg. Joni’s daughter. Harlan’s… was. Granddaughter.', 'sad', 'look-away'),
        N('Sorry. Everybody downstairs is talking about money like he’s an ATM that broke. I needed to not be there.', 'irritated', 'cross-arms'),
      ],
    },
    { lines: [N('Hey. Any news? Is Marta okay?', 'nervous', 'lean-in')] },
  ],
  occupied: [N('Can we do this later? I’m kind of… not okay right now.', 'sad', 'look-away')],
  topics: [
    {
      id: 'harlan',
      label: 'You were close to your grandfather?',
      kind: 'harlan',
      lines: [
        N('He read my essays. Like, actually read them, with a red pen. He’d write “cowardly” in the margin if I hedged.', 'sad', 'hand-chest', { tell: 'Meg laughs and wipes her eyes with her sleeve in the same movement.' }),
      ],
    },
    {
      id: 'evening',
      label: 'Did you notice anything that night?',
      kind: 'evening',
      lines: [
        N('I heard Grandpa and Ransom yelling in the study. Like, really yelling. Then a door slammed.', 'nervous', 'lean-in', { effects: [says('S-meg-shouting')] }),
        N('Ransom told everyone it was a “lovely chat.” Ransom says a lot of things.', 'irritated', 'cross-arms'),
      ],
    },
    {
      id: 'marta',
      label: 'You and Marta seem close.',
      kind: 'relationship',
      requires: { met: 'marta' },
      lines: [
        N('She’s the only grown-up here who isn’t performing. She came to my graduation. Mom didn’t, because of a retreat.', 'warm', 'nod', {
          effects: [{ relationship: 'R-meg-marta-friend' }, { motive: { character: 'meg', category: 'loyalty' } }],
        }),
        N('If anyone tries to pin this on her I will literally burn this house down. Metaphorically. Mostly.', 'angry', 'point'),
      ],
    },
    {
      id: 'school',
      label: 'Who pays for your school?',
      kind: 'family',
      requires: { any: [{ discussed: 'meg:evening' }, { met: 'joni' }] },
      lines: [
        N('Grandpa paid my school directly. He told me so — he said he wanted to make sure it actually got there.', 'neutral', 'shrug', { effects: [says('S-meg-tuition'), { motive: { character: 'meg', category: 'money' } }] }),
        N('Why? What did Mom say?', 'nervous', 'lean-in', { tell: 'Meg’s face falls as she works something out before you say a word.' }),
      ],
    },
    {
      id: 'nana',
      label: 'Great Nana says she saw something.',
      kind: 'event',
      requires: { any: [{ evidence: 'EV-07' }, { evidence: 'EV-09' }] },
      lines: [N('She told me she saw “Harlan” climbing down the roses in the middle of the night. Everyone laughed. I didn’t, because Nana doesn’t joke. She can’t remember how.', 'thoughtful', 'look-away')],
    },
    {
      id: 'family',
      label: 'What’s the family like, really?',
      kind: 'family',
      lines: [N('Everyone argues about politics at dinner like it’s a sport, then they all go home to houses Grandpa paid for. It’s a whole ecosystem of hypocrisy.', 'irritated', 'spread-hands')],
    },
  ],
  reactions: [
    {
      evidence: 'EV-16',
      kind: 'surprise',
      lines: [N('Two payments? From both of them? Mom was taking money for my school that Grandpa was already… oh my God.', 'sad', 'hand-mouth', { tell: 'Meg goes very still.', effects: [{ relationship: 'R-joni-meg-money' }, { motive: { character: 'joni', category: 'money' } }] })],
    },
    { evidence: 'EV-14', kind: 'acknowledge', lines: [N('He left Marta a note? Good. Somebody in this family should have been told they mattered.', 'warm', 'nod')] },
    { evidence: 'EV-13', kind: 'explain', lines: [N('Look at Ransom. Coat on already. He left before the cake — I remember because he took the good champagne with him.', 'irritated', 'point')] },
    { evidence: 'EV-10', kind: 'acknowledge', lines: [N('Grandpa moved him? In ink? Wow. That’s like the nuclear option of seating plans.', 'surprised', 'shrug')] },
  ],
  fallback: [
    [N('Um. I don’t know what that is. Sorry.', 'neutral', 'shrug')],
    [N('Is that important? It looks important. I don’t know anything about it though.', 'nervous', 'shrug')],
    [N('Ask Mom. Actually, don’t ask Mom.', 'irritated', 'look-away')],
  ],
  unexamined: [N('Wait, what does it say? You haven’t even looked properly.', 'nervous', 'lean-in')],
  farewell: [N('Okay. Look after Marta, if you can.', 'sad', 'nod')],
};

export const RICHARD: Script = {
  id: 'richard',
  greetings: [
    {
      when: { not: { met: 'richard' } },
      lines: [
        N('Richard Drysdale. Linda’s husband. Terrible business. Terrible.', 'neutral', 'hand-chest', { tell: 'Richard’s handshake lasts a beat too long, and his eyes check whether anyone is watching.' }),
        N('Anything I can do. Truly. Harlan and I were very close.', 'warm', 'nod'),
      ],
    },
    { when: { contradiction: 'C-richard-letter' }, lines: [N('Ah. You. Could we keep this… brief? And quiet?', 'nervous', 'look-away')] },
    { lines: [N('Hello again! Making progress, I hope.', 'warm', 'nod')] },
  ],
  occupied: [N('Just finishing a call — two minutes, there’s a good fellow.', 'neutral', 'wave-off')],
  topics: [
    {
      id: 'harlan',
      label: 'How well did you know Harlan?',
      kind: 'harlan',
      lines: [
        N('Harlan and I were close. Practically father and son. No friction whatsoever.', 'warm', 'hand-chest', { tell: 'Richard says “no friction whatsoever” without being asked about friction.', effects: [says('S-richard-close')] }),
      ],
      again: [N('Close. Very close. I’ve said.', 'nervous', 'nod')],
    },
    {
      id: 'evening',
      label: 'Where were you that night?',
      kind: 'evening',
      lines: [N('I was in bed by half past eleven. Linda will tell you. I sleep like a stone.', 'neutral', 'nod', { effects: [says('S-richard-bed')] })],
    },
    {
      id: 'linda',
      label: 'How is Linda coping?',
      kind: 'relationship',
      lines: [N('She’s a rock. My rock. We’ve never been stronger, honestly.', 'warm', 'nod', { tell: 'Richard checks his phone, turns it face-down, then checks it again.' })],
    },
    {
      id: 'marta',
      label: 'What do you make of Marta?',
      kind: 'relationship',
      requires: { met: 'marta' },
      lines: [N('Marta? Lovely girl. Hard worker. Her people are very hard workers.', 'warm', 'nod', { tell: 'Richard smiles broadly at nobody in particular. He doesn’t seem to notice what he’s said.' })],
    },
    {
      id: 'challenge-letter',
      label: 'Harlan gave you a deadline.',
      kind: 'challenge',
      requires: { contradiction: 'C-richard-letter' },
      lines: [
        Y('“Tell Linda by the end of the week, or I will.”'),
        N('Keep your voice down. Please.', 'nervous', 'look-away', { tell: 'Richard glances toward the stairs before he answers.' }),
        N('He’d found out about… a personal matter. He wanted me to tell Linda myself. I was going to. I was absolutely going to.', 'defensive', 'spread-hands', {
          effects: [says('S-richard-secret'), { relationship: 'R-richard-linda-secret' }, { relationship: 'R-harlan-richard-conflict' }, { motive: { character: 'richard', category: 'secret' } }],
        }),
        N('If this gets out, it ruins — well. It ruins things. You understand.', 'nervous', 'lean-in', { effects: [{ motive: { character: 'richard', category: 'reputation' } }] }),
      ],
    },
  ],
  reactions: [
    {
      evidence: 'EV-17',
      kind: 'refuse',
      lines: [N('That’s — that’s private. I’m not discussing a private letter in a hallway.', 'angry', 'step-back', { tell: 'Richard’s face goes blotchy red from the collar up.', effects: [{ relationship: 'R-harlan-richard-conflict' }] })],
    },
    { evidence: 'EV-04', kind: 'surprise', lines: [N('A new will. Well. Linda will be… Linda will handle it.', 'nervous', 'look-away')] },
    { evidence: 'EV-13', kind: 'acknowledge', lines: [N('Good photo of me, actually. Joni has an eye.', 'warm', 'nod')] },
  ],
  fallback: [
    [N('Haven’t the foggiest, I’m afraid. Not my area.', 'neutral', 'shrug')],
    [N('Hm. You’d want to ask Linda. Linda handles the details.', 'neutral', 'wave-off')],
    [N('Can’t help you there, old sport.', 'warm', 'shrug')],
  ],
  unexamined: [N('You haven’t even looked at it properly, have you? Hardly fair to show me, then.', 'nervous', 'wave-off')],
  farewell: [N('Right! Well. Good luck with — all this.', 'warm', 'nod')],
};
