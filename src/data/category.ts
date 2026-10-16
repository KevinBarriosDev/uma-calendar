import type { DistanceCategory } from './types';

// Única regla de categoría por distancia: ≤1400 Sprint, ≤1800 Mile, ≤2400 Medium, el resto Long.
export function categoryFromDistance(m: number): DistanceCategory {
  if (m <= 1400) return 'Sprint';
  if (m <= 1800) return 'Mile';
  if (m <= 2400) return 'Medium';
  return 'Long';
}
