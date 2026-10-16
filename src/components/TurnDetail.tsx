import type { Character, Objective, Race } from '../data/types';
import { charactersInTurn, racesInTurn } from '../lib/calendar';
import { gradeClass, objectiveText, raceMeta } from '../lib/format';
import { turnLabel } from '../lib/turn';

// Texto de un objetivo, con la marca si todavía no se confirmó en el juego.
function ObjectiveText({ o, racesById }: { o: Objective; racesById: Map<string, Race> }) {
  return <>{objectiveText(o, racesById)}{!o.verified && <span className="badge-unverified">unverified</span>}</>;
}

interface Props { turn: number; races: Race[]; characters: Character[]; racesById: Map<string, Race>; onClose: () => void }

export default function TurnDetail({ turn, races, characters, racesById, onClose }: Props) {
  const list = racesInTurn(races, turn);
  const { busy, maybe, goal, free } = charactersInTurn(characters, turn);
  return (
    <aside className="detail card" data-testid="turn-detail" aria-label={`Details for ${turnLabel(turn)}`}>
      <div className="detail__head">
        <h2>{turnLabel(turn)}</h2>
        <button type="button" className="detail__close" onClick={onClose} aria-label="Close details">×</button>
      </div>
      {list.length === 0 ? <p className="muted">No races this turn.</p> : (
        <ul className="races">
          {list.map((r) => (
            <li key={r.id}>
              <span className={gradeClass(r.grade)}>{r.grade}</span>
              <div><a href={`/races/${r.id}/`}><b>{r.name}</b></a><span className="muted">{raceMeta(r)}</span></div>
            </li>
          ))}
        </ul>
      )}
      <h3>Objective this turn</h3>
      <div data-testid="busy-list">
        {busy.length === 0 ? <p className="muted">None.</p> : busy.map(({ character, objectives }) => (
          <div key={character.id} className="who">
            <a className="chip chip--busy" href={`/characters/${character.id}/`}>{character.name}</a>
            <span className="muted who__goal">{objectives.map((o, i) => <span key={o.order}>{i > 0 && ' · '}<ObjectiveText o={o} racesById={racesById} /></span>)}</span>
          </div>
        ))}
      </div>
      {maybe.length > 0 && <>
        <h3>May have an objective</h3>
        <p className="muted">Depends on a choice earlier in the career.</p>
        <div data-testid="maybe-list">
          {maybe.map(({ character }) => <a key={character.id} className="chip chip--maybe" href={`/characters/${character.id}/`}>{character.name}</a>)}
        </div>
      </>}
      {goal.length > 0 && <>
        <h3>Goal deadline this turn</h3>
        <p className="muted">Reach it by now; it does not have to be a race this turn.</p>
        <div data-testid="goal-list">
          {goal.map(({ character, objectives }) => (
            <div key={character.id} className="who">
              <a className="chip chip--goal" href={`/characters/${character.id}/`}>{character.name}</a>
              <span className="muted who__goal">{objectives.map((o, i) => <span key={o.order}>{i > 0 && ' · '}<ObjectiveText o={o} racesById={racesById} /></span>)}</span>
            </div>
          ))}
        </div>
      </>}
      <h3>Free this turn <span className="muted">({free.length})</span></h3>
      <div data-testid="free-list">
        {free.map((c) => <a key={c.id} className="chip" href={`/characters/${c.id}/`}>{c.name}</a>)}
      </div>
    </aside>
  );
}
