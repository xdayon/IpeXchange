export function sanitizePills(suggested, reply) {
  if (!String(reply ?? '').includes('?') || !Array.isArray(suggested)) return [];
  const pills = suggested
    .map((item) => String(item).trim().replace(/\s+/g, ' '))
    .filter((item) => item.length > 0 && item.length <= 40)
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, 4);
  return pills.length >= 2 ? pills : [];
}
