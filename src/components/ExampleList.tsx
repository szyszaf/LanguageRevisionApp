import type { Example } from '../types';
import SpeakButton from './SpeakButton';

export default function ExampleList({ examples, lang }: { examples: Example[]; lang?: string }) {
  return (
    <ul className="examples">
      {examples.map((ex, i) => (
        <li key={i}>
          <div className="ex-text">
            <SpeakButton text={ex.text} lang={lang} />
            <span>{ex.text}</span>
          </div>
          <div className="ex-tr muted">
            {ex.translation}
            {ex.note && <span className="note"> · {ex.note}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}
