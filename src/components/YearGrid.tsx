import type { Race } from '../data/types';
import { racesInTurn } from '../lib/calendar';
import { gradeClass } from '../lib/format';
import { MONTH_NAMES, YEAR_NAMES, fromTurn, turnsOfYear, type Year } from '../lib/turn';

interface Props {
  year: Year; races: Race[]; selected: number | null;
  main: Set<number>; alt: Set<number>; goal: Set<number>;
  onSelect?: (turn: number) => void; hrefFor?: (turn: number) => string;
}

export default function YearGrid({ year, races, selected, main, alt, goal, onSelect, hrefFor }: Props) {
  const turns = turnsOfYear(year);
  return (
    <section className="year" aria-label={`${YEAR_NAMES[year - 1]} year`}>
      <h2 className="year__title">{YEAR_NAMES[year - 1]}</h2>
      <div className="year__grid">
        <span /><span className="year__head">Early</span><span className="year__head">Late</span>
        {MONTH_NAMES.map((month, m) => (
          <div className="year__row" key={month}>
            <span className="year__month">{month.slice(0, 3)}</span>
            {[turns[m * 2]!, turns[m * 2 + 1]!].map((turn) => {
              const list = racesInTurn(races, turn);
              const { half } = fromTurn(turn);
              const cls = ['cell', selected === turn && 'is-selected', main.has(turn) && 'is-objective', alt.has(turn) && 'is-alt', goal.has(turn) && 'is-goal'].filter(Boolean).join(' ');
              const label = `${YEAR_NAMES[year - 1]}, ${half === 1 ? 'Early' : 'Late'} ${month}, ${list.length} race${list.length === 1 ? '' : 's'}${main.has(turn) ? ', objective' : ''}${alt.has(turn) ? ', possible objective' : ''}${goal.has(turn) ? ', goal deadline' : ''}`;
              const body = list.map((r) => <span key={r.id} className={gradeClass(r.grade)}>{r.grade}</span>);
              return hrefFor
                ? <a key={turn} className={cls} data-turn={turn} href={hrefFor(turn)} aria-label={label}>{body}</a>
                : <button key={turn} type="button" className={cls} data-turn={turn} aria-label={label} aria-pressed={selected === turn} onClick={() => onSelect?.(turn)}>{body}</button>;
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
