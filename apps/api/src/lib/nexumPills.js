const COPY = {
  en: {
    condition: ['New', 'Used', 'Refurbished', 'No preference'],
    format: ['Online', 'In person', 'Hybrid', 'Flexible'],
    level: ['Beginner', 'Intermediate', 'Advanced', 'Any level'],
    access: ['One-time', 'Lifetime', 'Flexible'],
    timeframe: ['This week', 'This month', 'Flexible', 'Not sure'],
    side_offer: ['Yes, I can offer something', 'Nothing right now'],
    side_want: ['Yes, I am looking for something', 'Nothing right now'],
  },
  pt: {
    condition: ['Novo', 'Usado', 'Recondicionado', 'Sem preferência'],
    format: ['Online', 'Presencial', 'Híbrido', 'Flexível'],
    level: ['Iniciante', 'Intermediário', 'Avançado', 'Qualquer nível'],
    access: ['Uso único', 'Acesso vitalício', 'Flexível'],
    timeframe: ['Esta semana', 'Este mês', 'Flexível', 'Ainda não sei'],
    side_offer: ['Sim, tenho algo a oferecer', 'Nada no momento'],
    side_want: ['Sim, procuro algo', 'Nada no momento'],
  },
};

const languageKey = (language) => String(language ?? '').toLowerCase().startsWith('pt') ? 'pt' : 'en';

// Pills are always selected by the backend as answers to a known closed question.
export function pillsForFocus(focusField, language = 'en') {
  return COPY[languageKey(language)][focusField] ?? [];
}
