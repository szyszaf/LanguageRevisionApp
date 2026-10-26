import { useMemo, useState } from 'react';
import type { Category } from '../types';
import { wordKey } from '../data';
import { getStats, isDue, record } from '../lib/progress';
import { shuffle } from '../lib/shuffle';
import ExampleList from './ExampleList';
import SpeakButton from './SpeakButton';
import { useLang } from '../lib/langContext';

type Direction = 'en-pl' | 'pl-en';

export default function Flashcards({ category: c }: { category: Category }) {
  const code = useLang().code.toUpperCase();
  const [onlyDue, setOnlyDue] = useState(true);
  const [dir, setDir] = useState<Direction>('en-pl');
  const [round, setRound] = useState(0);
  const deck = useMemo(() => {
    const list = onlyDue ? c.vocabulary.filter((v) => isDue(wordKey(c.id, v.id))) : c.vocabulary;
    return shuffle(list);
  }, [c, onlyDue, round]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);

  const restart = (due: boolean) => {
    setOnlyDue(due);
    setRound((r) => r + 1);
    setPos(0);
    setKnown(0);
    setFlipped(false);
  };

  const header = (
    <div className="quiz-top">
      <a href={`#/c/${c.id}/vocab`} className="back">← {c.title}</a>
      <div className="row">
        <button className={`chip ${dir === 'en-pl' ? 'active' : ''}`} onClick={() => setDir('en-pl')}>{code} → PL</button>
        <button className={`chip ${dir === 'pl-en' ? 'active' : ''}`} onClick={() => setDir('pl-en')}>PL → {code}</button>
      </div>
      <span className="small">{Math.min(pos + 1, deck.length)} / {deck.length}</span>
    </div>
  );

  if (deck.length === 0 || pos >= deck.length) {
    return (
      <div className="quiz">
        {header}
        <div className="card center summary">
          {deck.length === 0 ? (
            <>
              <h2>Wszystko powtórzone 🎉</h2>
              <p className="muted">Żadne słówko nie czeka dziś na powtórkę. Wróć jutro albo przejrzyj całą talię.</p>
            </>
          ) : (
            <>
              <h2>Koniec talii</h2>
              <p className="muted">Znałeś {known} z {deck.length} słówek. Te, których nie znałeś, wrócą do powtórki wcześniej.</p>
            </>
          )}
          <div className="row">
            <button className="btn" onClick={() => restart(false)}>Cała talia</button>
            <button className="btn ghost" onClick={() => restart(true)}>Tylko do powtórki</button>
          </div>
        </div>
      </div>
    );
  }

  const v = deck[pos];
  const stats = getStats(wordKey(c.id, v.id));
  const answer = (ok: boolean) => {
    record(wordKey(c.id, v.id), ok);
    if (ok) setKnown((k) => k + 1);
    setFlipped(false);
    setPos((p) => p + 1);
  };

  return (
    <div className="quiz">
      {header}
      <div className={`card flashcard ${flipped ? 'flipped' : ''}`} onClick={() => !flipped && setFlipped(true)}>
        <p className="q-label">{stats ? `Pudełko ${stats.box} / 5` : 'Nowe słówko'}</p>
        <p className="q-main">
          {dir === 'en-pl' ? (
            <>
              <SpeakButton text={v.word} /> {v.word}
            </>
          ) : (
            v.translation
          )}
        </p>
        {!flipped && <p className="muted small">Kliknij, aby odwrócić</p>}
        {flipped && (
          <div className="back-side">
            <p className="translation big">{dir === 'en-pl' ? v.translation : <><SpeakButton text={v.word} /> {v.word}</>}</p>
            <p className="muted small">
              {v.partOfSpeech}
              {v.forms && <> · {v.forms}</>}
            </p>
            <ExampleList examples={v.usage} />
            {v.synonyms.length > 0 && (
              <p className="small">
                <strong>Synonimy:</strong> {v.synonyms.map((s) => `${s.word} (${s.translation})`).join(', ')}
              </p>
            )}
          </div>
        )}
      </div>
      {flipped ? (
        <div className="row center-row">
          <button className="btn danger" onClick={() => answer(false)}>✗ Nie wiedziałem</button>
          <button className="btn success" onClick={() => answer(true)}>✓ Wiedziałem</button>
        </div>
      ) : (
        <div className="row center-row">
          <button className="btn" onClick={() => setFlipped(true)}>Pokaż odpowiedź</button>
        </div>
      )}
    </div>
  );
}
