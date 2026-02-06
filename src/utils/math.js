export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const lerp = (a, b, t) => a + (b - a) * t;

export const radians = (deg) => (deg * Math.PI) / 180;

export const degrees = (rad) => (rad * 180) / Math.PI;

export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const randomRange = (min, max) => min + Math.random() * (max - min);
