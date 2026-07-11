const PILLS = {
  condition: ['New', 'Used', 'Refurbished', 'No preference'],
  format: ['Online', 'In person', 'Hybrid', 'Flexible'],
  level: ['Beginner', 'Intermediate', 'Advanced', 'Any level'],
  access: ['One-time', 'Lifetime', 'Flexible'],
  timeframe: ['This week', 'This month', 'Flexible', 'Not sure'],
  value_flexibility: ['Fixed', 'Flexible', 'Not sure'],
  exchange_modes: ['Trade', 'Buy or sell', 'Give away', 'Flexible'],
  delivery_modes: ['Pickup', 'Delivery', 'Remote', 'Flexible'],
  side_offer: ['Yes, I can offer', 'Nothing right now'],
  side_want: ['Yes, I need something', 'Nothing right now'],
};

export function pillsForFocus(focusField, suggested = []) {
  const controlled = PILLS[focusField];
  const translated = Array.isArray(suggested)
    ? suggested.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 4) : [];
  if (controlled) return translated.length === controlled.length ? translated : controlled;
  return translated;
}
