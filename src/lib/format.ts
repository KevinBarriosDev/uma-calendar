import type { Grade, Objective, Race } from '../data/types';

export function raceMeta(race: Race): string {
  if (race.track === null) return 'Track and distance vary by Uma';
  return `${race.track} · ${race.surface} ${race.distance}m · ${race.category} · ${race.direction}`;
}

export function placeText(place: number): string {
  if (place === 0) return 'Enter';
  if (place === 1) return 'Win';
  return `Top ${place}`;
}

// Clase CSS del chip de grado; "Pre-OP" queda en "pre-op".
export function gradeClass(grade: Grade): string {
  return `grade grade--${grade.toLowerCase()}`;
}

export function objectiveText(o: Objective, racesById: Map<string, Race>): string {
  switch (o.kind) {
    case 'race': {
      const names = o.raceIds.map((id) => racesById.get(id)?.name ?? id);
      return names.length === 1 ? `${placeText(o.place)} ${names[0]}` : `${placeText(o.place)} one of: ${names.join(', ')}`;
    }
    case 'fans':
      return `Reach ${o.fans.toLocaleString('en-US')} fans`;
    case 'race-count': {
      const grade = o.minGrade === 'G1' ? 'G1' : `${o.minGrade} or higher`;
      return `${placeText(o.place)} ${o.place === 1 ? '' : 'in '}${o.count} ${grade} race${o.count === 1 ? '' : 's'}`;
    }
  }
}
