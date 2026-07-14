const SHARE_FIELDS =
  'id, title, description, price_fiat, image_url, kind, direction, status';

export async function fetchPublicIntent(db, id) {
  const { data } = await db.from('intents').select(SHARE_FIELDS)
    .eq('id', id).eq('status', 'active').single();
  return data ?? null;
}

export function injectShareMetaTags(shell, metaTags) {
  return shell
    .replace(/^\s*<meta (?:property="og:|name="twitter:)[^>]*>\n?/gm, '')
    .replace('</head>', () => metaTags);
}
