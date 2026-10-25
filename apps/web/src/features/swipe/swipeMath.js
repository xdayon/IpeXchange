export const SWIPE_THRESHOLD = 110;
export const FLING_VELOCITY = 0.6;
export const MAX_ROTATION = 16;

// Decides a drag outcome from distance (px) and velocity (px/ms).
export function decideSwipe(dx, velocity = 0) {
  if (dx >= SWIPE_THRESHOLD || (dx > 40 && velocity >= FLING_VELOCITY)) return 'accept';
  if (dx <= -SWIPE_THRESHOLD || (dx < -40 && velocity <= -FLING_VELOCITY)) return 'pass';
  return null;
}

export const cardRotation = (dx, width = 340) =>
  Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, (dx / width) * MAX_ROTATION * 2));

// 0..1 strength of the Accept/Pass stamp while dragging.
export const stampOpacity = (dx) => Math.max(0, Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD));

export const flingX = (decision) => (decision === 'accept' ? 1 : -1) * Math.max(window.innerWidth, 420) * 1.2;

export const decisionForKey = (key) => {
  if (key === 'ArrowRight') return 'accept';
  if (key === 'ArrowLeft') return 'pass';
  return null;
};
