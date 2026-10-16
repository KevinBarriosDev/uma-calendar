import { useEffect, useMemo, useState } from 'react';
import type { Character, Race } from '../data/types';
import { objectiveTurns } from '../lib/calendar';
import { fromTurn, YEAR_NAMES, type Year } from '../lib/turn';
import { parseUrlState, serializeUrlState, type UrlState } from '../lib/url-state';
import CharacterPicker from './CharacterPicker';
import TurnDetail from './TurnDetail';
import YearGrid from './YearGrid';
import './calendar.css';

interface Props { races: Race[]; characters: Character[] }
const EMPTY = new Set<number>();

export default function Calendar({ races, characters }: Props) {
  const known = useMemo(() => new Set(characters.map((c) => c.id)), [characters]);
  const racesById = useMemo(() => new Map(races.map((r) => [r.id, r])), [races]);
  const [state, setState] = useState<UrlState>({ uma: null, turn: null });
  const [year, setYear] = useState<Year>(1);

  // Lee la URL al montar y cuando el usuario va atrás o adelante.
  useEffect(() => {
    const read = () => {
      const s = parseUrlState(window.location.search, known);
      setState(s);
      if (s.turn !== null) setYear(fromTurn(s.turn).year);
    };
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [known]);

  function update(next: UrlState) {
    setState(next);
    const url = window.location.pathname + serializeUrlState(next);
    if (url !== window.location.pathname + window.location.search) window.history.pushState(null, '', url);
  }

  const uma = characters.find((c) => c.id === state.uma) ?? null;
  const turns = uma ? objectiveTurns(uma) : { main: EMPTY, alt: EMPTY, goal: EMPTY };

  return (
    <div className={`calendar${state.turn !== null ? ' has-detail' : ''}`}>
      <div className="calendar__controls">
        <CharacterPicker characters={characters} value={state.uma} onChange={(id) => update({ ...state, uma: id })} />
        <div className="tabs" role="tablist" aria-label="Year">
          {([1, 2, 3] as Year[]).map((y) => (
            <button key={y} type="button" role="tab" aria-selected={year === y} onClick={() => setYear(y)}>{YEAR_NAMES[y - 1]}</button>
          ))}
        </div>
      </div>
      <div className="calendar__years">
        {([1, 2, 3] as Year[]).map((y) => (
          <div key={y} className={`calendar__year${year === y ? ' is-active' : ''}`}>
            <YearGrid year={y} races={races} selected={state.turn} main={turns.main} alt={turns.alt} goal={turns.goal}
              onSelect={(t) => update({ ...state, turn: state.turn === t ? null : t })} />
          </div>
        ))}
      </div>
      {state.turn !== null && (
        <TurnDetail turn={state.turn} races={races} characters={characters} racesById={racesById} onClose={() => update({ ...state, turn: null })} />
      )}
    </div>
  );
}
