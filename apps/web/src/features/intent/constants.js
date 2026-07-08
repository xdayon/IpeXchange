import { Package, MonitorSmartphone, Wrench, GraduationCap } from 'lucide-react';

export const DIRECTIONS = [
  { id: 'offer', label: 'Offer', color: 'var(--accent-lime)', bg: 'rgba(180,244,74,0.12)' },
  { id: 'want', label: 'Interest', color: 'var(--accent-cyan)', bg: 'rgba(56,189,248,0.12)' },
];

export const KINDS = [
  { id: 'good', label: 'Goods', icon: Package, desc: 'Physical items and products' },
  { id: 'digital', label: 'Digital', icon: MonitorSmartphone, desc: 'Software, media, digital products' },
  { id: 'service', label: 'Services', icon: Wrench, desc: 'Work, tasks and consulting' },
  { id: 'knowledge', label: 'Knowledge', icon: GraduationCap, desc: 'Mentoring, classes and skills' },
];

export const directionInfo = (id) => DIRECTIONS.find((d) => d.id === id) ?? DIRECTIONS[0];
export const kindInfo = (id) => KINDS.find((k) => k.id === id) ?? null;

export const formatPrice = (value) =>
  value == null ? null : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const FIELD_VALUE_LABELS = {
  condition: { new: 'New', used: 'Used', refurbished: 'Refurbished' },
  format: { in_person: 'In person', online: 'Online', hybrid: 'Hybrid' },
  access: { one_time: 'One-time access', lifetime: 'Lifetime access' },
  level: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
};

// Works for API intents and for the wizard form (same keys, empty string = unset).
export const kindFieldChips = (intent) =>
  ['condition', 'brand', 'duration', 'format', 'access', 'level']
    .filter((key) => intent[key])
    .map((key) => FIELD_VALUE_LABELS[key]?.[intent[key]] ?? intent[key]);
