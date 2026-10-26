import type { VocabEntry } from '../types';
import ExampleList from './ExampleList';
import SpeakButton from './SpeakButton';

export default function VocabCard({ entry: v }: { entry: VocabEntry }) {
  return (
    <article className="card vocab">
      <header className="vocab-head">
        <div>
          <h3>
            <SpeakButton text={v.word} /> {v.word}
            {v.pronunciation && <span className="muted small"> {v.pronunciation}</span>}
          </h3>
          <div className="translation">{v.translation}</div>
        </div>
        <span className="pill">{v.partOfSpeech}</span>
      </header>
      {v.forms && (
        <p className="forms">
          Formy: <strong>{v.forms}</strong>
        </p>
      )}

      <h4>Użycie</h4>
      <ExampleList examples={v.usage} />

      {v.synonyms.length > 0 && (
        <>
          <h4>Synonimy i podobne słowa</h4>
          <ul className="synonyms">
            {v.synonyms.map((s) => (
              <li key={s.word}>
                <strong>{s.word}</strong> – {s.translation}
                {s.note && <span className="muted small"> ({s.note})</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      {v.notes && <p className="tips">💡 {v.notes}</p>}
    </article>
  );
}
