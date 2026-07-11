import { runNexumTurn } from '../apps/api/src/lib/nexumEngine.js';

const env = { GROQ_API_KEY: process.env.GROQ_API_KEY };

if (!env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY is required.');
  process.exit(1);
}

const scenarios = [
  {
    name: 'pt-specific-want-no-offer',
    turns: [
      'Quero comprar uma bicicleta usada para ir ao trabalho em Sao Paulo.',
      'Pode ser speed ou urbana, aro para adulto, ate R$ 2.000 e ainda este mes.',
      'Nao tenho nada para oferecer agora.',
    ],
  },
  {
    name: 'pt-specific-offer-and-want',
    turns: [
      'Eu ofereco aulas online de ingles para iniciantes e tambem procuro um notebook.',
      'As aulas sao individuais, uma hora por semana. Para o notebook, quero algo usado para programar.',
      'Meu horario e flexivel e nao defini valores ainda.',
    ],
  },
  {
    name: 'pt-vague-to-specific',
    turns: [
      'Quero aprender uma coisa nova.',
      'Quero aprender espanhol do zero para viajar, de preferencia online.',
      'Nao tenho algo para oferecer neste momento.',
      'Quero comecar neste mes e tenho horarios flexiveis.',
    ],
  },
  {
    name: 'en-correction',
    turns: [
      'I am looking for a designer for a mobile app.',
      'Actually, I need a UX audit rather than a full design, remotely, this month.',
      'I can offer backend development in exchange.',
    ],
  },
];

const isQuestion = (text) => /[?？]\s*$/.test(text.trim());
const selected = process.argv[2];
const cases = selected ? scenarios.filter((scenario) => scenario.name === selected) : scenarios;

if (!cases.length) {
  console.error(`Unknown scenario: ${selected}`);
  process.exit(1);
}

for (const scenario of cases) {
  let previous = {};
  const messages = [];
  const transcript = [];

  for (const [turnIndex, memberText] of scenario.turns.entries()) {
    messages.push({ role: 'user', content: memberText });
    const result = await runNexumTurn(env, {
      name: null,
      live: [],
      messages,
      previous,
      signal: null,
      memory: {},
      turnCount: turnIndex + 1,
    });
    if (!result) {
      transcript.push({ member: memberText, error: 'no_result' });
      break;
    }
    transcript.push({
      member: memberText,
      nexum: result.reply,
      pills: result.pills,
      focus: result.state.focus_field,
      ready: result.state.ready,
      can_reveal: result.state.can_reveal,
      progress: result.state.progress,
      intents: result.state.intents.map(({ direction, kind, title, concept_id, confidence }) => ({
        direction, kind, title, concept_id, confidence,
      })),
      flags: {
        pills_without_question: result.pills.length > 0 && !isQuestion(result.reply),
        question_when_ready: result.state.ready && isQuestion(result.reply),
      },
    });
    messages.push({ role: 'assistant', content: result.reply });
    previous = result.state;
    if (result.state.ready) break;
  }

  const last = transcript.at(-1);
  const summary = {
    converged: last?.ready === true,
    reveal_available: transcript.some((turn) => turn.can_reveal === true),
    intent_retained: transcript.filter((turn) => !turn.error).every((turn, index, all) => (
      index === 0 || !all[index - 1].intents?.length || turn.intents?.length > 0
    )),
    invalid_pill_turns: transcript.filter((turn) => turn.flags?.pills_without_question).length,
    ready_question_turns: transcript.filter((turn) => turn.flags?.question_when_ready).length,
    turns: transcript.length,
  };
  console.log(JSON.stringify({ scenario: scenario.name, summary, transcript }, null, 2));
}
