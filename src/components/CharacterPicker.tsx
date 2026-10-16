import { useEffect, useId, useState } from 'react';
import type { Character } from '../data/types';

interface Props { characters: Character[]; value: string | null; onChange: (id: string | null) => void }

export default function CharacterPicker({ characters, value, onChange }: Props) {
  const listId = useId();
  const current = characters.find((c) => c.id === value);
  const [text, setText] = useState(current?.name ?? '');
  useEffect(() => setText(current?.name ?? ''), [current?.name]);

  function commit(next: string) {
    setText(next);
    const match = characters.find((c) => c.name.toLowerCase() === next.trim().toLowerCase());
    if (match) onChange(match.id);
    else if (next.trim() === '') onChange(null);
  }

  return (
    <div className="picker">
      <label htmlFor={`${listId}-input`}>Uma</label>
      <input id={`${listId}-input`} list={listId} value={text} placeholder="Search an Uma…" autoComplete="off"
        onChange={(e) => commit(e.target.value)} />
      <datalist id={listId}>{characters.map((c) => <option key={c.id} value={c.name} />)}</datalist>
      {value && <button type="button" onClick={() => commit('')} aria-label="Clear Uma">Clear</button>}
      {value && (
        <p className="legend muted" data-testid="legend">
          <span><i className="is-objective" />Objective</span>
          <span><i className="is-alt" />Possible objective</span>
          <span><i className="is-goal" />Goal deadline</span>
        </p>
      )}
    </div>
  );
}
