import { Package, MonitorSmartphone, Wrench, GraduationCap } from 'lucide-react';

export const KIND_COVERS = {
  good: {
    icon: Package,
    gradient: 'linear-gradient(135deg, rgba(180,244,74,0.18), rgba(180,244,74,0.04))',
    color: 'var(--accent-lime)',
  },
  digital: {
    icon: MonitorSmartphone,
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(56,189,248,0.04))',
    color: 'var(--accent-cyan)',
  },
  service: {
    icon: Wrench,
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(168,85,247,0.04))',
    color: 'var(--accent-purple)',
  },
  knowledge: {
    icon: GraduationCap,
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.04))',
    color: 'var(--accent-amber)',
  },
};

const FALLBACK = {
  icon: Package,
  gradient: 'linear-gradient(135deg, rgba(240,244,255,0.08), rgba(240,244,255,0.02))',
  color: 'var(--text-secondary)',
};

export const kindCover = (kind) => KIND_COVERS[kind] ?? FALLBACK;
