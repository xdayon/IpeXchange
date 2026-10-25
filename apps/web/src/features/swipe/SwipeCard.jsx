import { Repeat } from 'lucide-react';
import IntentCover from '../../shared/ui/IntentCover.jsx';
import Avatar from '../../shared/ui/Avatar.jsx';
import { kindInfo, formatPrice } from '../intent/constants.js';

const DIRECTION_BY_REASON = { matches_interest: 'Offer', wants_your_offer: 'Interest' };

export default function SwipeCard({ card }) {
  const kind = kindInfo(card.kind);
  const KindIcon = kind?.icon;
  const price = formatPrice(card.price_fiat);
  const directionLabel = DIRECTION_BY_REASON[card.reason];

  return (
    <div className="swipe-card__inner">
      <div className="swipe-card__cover">
        <IntentCover kind={card.kind} imageUrl={card.image_url} alt={card.title} height="100%" />
        <div className="swipe-card__shade" />
        {card.reason_label && <span className="swipe-card__reason">{card.reason_label}</span>}
      </div>
      <div className="swipe-card__body">
        <h3 className="swipe-card__title">{card.title}</h3>
        {card.description && <p className="swipe-card__desc">{card.description}</p>}
        <div className="swipe-card__chips">
          {directionLabel && (
            <span className={`chip chip--${card.reason === 'wants_your_offer' ? 'cyan' : 'lime'}`}>{directionLabel}</span>
          )}
          {kind && <span className="chip">{KindIcon && <KindIcon size={12} />} {kind.label}</span>}
          {price && <span className="chip chip--lime">{price}</span>}
          {card.is_continuous && <span className="chip chip--lime"><Repeat size={12} /> Stays active</span>}
        </div>
        <div className="swipe-card__owner">
          <Avatar src={card.owner?.avatar_url} name={card.owner?.display_name} size={28} />
          <span>{card.owner?.display_name || 'Member'}</span>
        </div>
      </div>
    </div>
  );
}
