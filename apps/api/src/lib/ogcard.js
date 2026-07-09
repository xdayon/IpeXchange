function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function formatUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function truncateTitle(title, max = 90) {
  const t = String(title ?? '');
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

export function buildOgCardHtml(intent, { logoDataUri }) {
  const isOffer = intent.direction === 'offer';
  const badge = `${isOffer ? 'OFFER' : 'LOOKING FOR'}${intent.kind ? ' · ' + esc(intent.kind) : ''}`;
  const price = formatUsd(intent.price_fiat);
  const hasImage = Boolean(intent.image_url);
  const textColWidth = hasImage ? '620px' : '100%';

  return `
  <div style="display:flex; width:1200px; height:630px; background:#080C14; position:relative; font-family:Inter;">
    <div style="display:flex; position:absolute; top:-200px; left:-200px; width:600px; height:600px; border-radius:9999px; background:rgba(56,189,248,0.25); filter:blur(80px);"></div>
    <div style="display:flex; position:absolute; bottom:-200px; right:-200px; width:600px; height:600px; border-radius:9999px; background:rgba(129,140,248,0.2); filter:blur(80px);"></div>
    <div style="display:flex; width:100%; height:100%; padding:64px; position:relative;">
      <div style="display:flex; flex-direction:column; justify-content:space-between; width:${textColWidth}; height:100%;">
        <div style="display:flex; flex-direction:column;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:32px;">
            ${logoDataUri ? `<img src="${logoDataUri}" width="48" height="48" style="border-radius:12px;" />` : ''}
            <span style="display:flex; font-size:28px; font-weight:700; color:#F8FAFC;">IpeXchange</span>
          </div>
          <div style="display:flex; padding:6px 16px; border:1px solid rgba(148,163,184,0.35); border-radius:9999px; color:#94A3B8; font-size:18px; font-weight:600; text-transform:uppercase; letter-spacing:1px; margin-bottom:28px;">
            ${badge}
          </div>
          <div style="display:flex; font-size:56px; font-weight:800; color:#F8FAFC; line-height:1.15; margin-bottom:24px;">
            ${esc(truncateTitle(intent.title))}
          </div>
          ${price ? `<div style="display:flex; font-size:40px; font-weight:800; color:#B4F44A;">${price}</div>` : ''}
        </div>
        <div style="display:flex; font-size:22px; color:#94A3B8;">ipexchange.xyz</div>
      </div>
      ${hasImage ? `
      <div style="display:flex; width:420px; height:502px; margin-left:32px;">
        <img src="${esc(intent.image_url)}" width="420" height="502" style="object-fit:cover; border-radius:24px; border:1px solid rgba(248,250,252,0.12);" />
      </div>` : ''}
    </div>
  </div>`;
}
