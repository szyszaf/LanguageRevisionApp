import { useMemo, useRef, useState, type FormEvent } from 'react';
import type { Category, Exercise } from '../types';
import { exKey, vocabExercises } from '../data';
import { closestAnswer, diffWords, isCorrect, matchIgnoringDiacritics, tokenize, type DiffOp } from '../lib/answer';
import { detectMistakes, type Diagnosis } from '../lib/detectors';
import { record, wasWrong } from '../lib/progress';
import { shuffle } from '../lib/shuffle';
import { speak } from './SpeakButton';
import GrammarTopicView from './GrammarTopicView';
import { useLang } from '../lib/langContext';

export type QuizMode = 'grammar' | 'words' | 'mixed' | 'mistakes';

const MODE_LABEL: Record<QuizMode, string> = {
  grammar: 'Gramatyka',
  words: 'Słówka',
  mixed: 'Mieszany',
  mistakes: 'Moje błędy',
};

interface Result {
  correct: boolean;
  user: string;
  expected: string;
  diff?: DiffOp[];
  diagnoses: Diagnosis[];
  /** Uwaga przy odpowiedzi zaliczonej, np. brak znaków diakrytycznych. */
  note?: string;
}

function buildQueue(c: Category, mode: QuizMode): Exercise[] {
  const words = vocabExercises(c);
  let list: Exercise[];
  if (mode === 'grammar') list = c.exercises;
  else if (mode === 'words') list = words;
  else list = [...c.exercises, ...words];
  if (mode === 'mistakes') list = list.filter((e) => wasWrong(exKey(c.id, e.id)));
  return shuffle(list);
}

/** Język odpowiedzi: tłumaczenie „reverse” odpowiada się po polsku. */
const answerLang = (ex: Exercise, lang: string) => (ex.type === 'translate' && ex.reverse ? 'pl' : lang);

function evaluate(ex: Exercise, input: string, categoryLang: string): Result {
  if (ex.type === 'choice') {
    const chosen = Number(input);
    return { correct: chosen === ex.correct, user: ex.options[chosen], expected: ex.options[ex.correct], diagnoses: [] };
  }
  const lang = answerLang(ex, categoryLang);
  const correct = isCorrect(input, ex.answers, lang);
  const expected = closestAnswer(input, ex.answers, lang);
  if (correct) return { correct, user: input, expected, diagnoses: [] };

  // Zaliczamy odpowiedź bez znaków diakrytycznych (jak Duolingo), ale pokazujemy poprawną pisownię.
  const nearly = matchIgnoringDiacritics(input, ex.answers, lang);
  if (nearly) {
    return {
      correct: true,
      user: input,
      expected: nearly,
      diagnoses: [],
      note: `Zaliczone, ale uważaj na znaki diakrytyczne. Poprawna pisownia: „${nearly}”.`,
    };
  }

  // Przy lukach analizujemy całe zdanie, żeby wykrywacze widziały kontekst (np. "did" przed luką).
  const fullUser = ex.type === 'gap' ? ex.sentence.replace('___', input) : input;
  const fullExpected = ex.type === 'gap' ? ex.sentence.replace('___', expected) : expected;
  return {
    correct,
    user: input,
    expected,
    diff: diffWords(tokenize(fullUser, lang), tokenize(fullExpected, lang)),
    diagnoses: detectMistakes(fullUser, fullExpected, lang, ex.mistakes),
  };
}

export default function Quiz({ category: c, mode }: { category: Category; mode: QuizMode }) {
  const initial = useMemo(() => buildQueue(c, mode), [c, mode]);
  const [queue, setQueue] = useState<Exercise[]>(initial);
  const [pos, setPos] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [score, setScore] = useState({ ok: 0, bad: 0 });
  const [requeued, setRequeued] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const pack = useLang();

  if (initial.length === 0) {
    return (
      <div className="card center">
        <p>Brak pytań w tym trybie.</p>
        <a className="btn" href={`#/c/${c.id}/practice`}>Wróć</a>
      </div>
    );
  }

  if (pos >= queue.length) {
    const total = score.ok + score.bad;
    const pct = total ? Math.round((score.ok / total) * 100) : 0;
    return (
      <div className="card center summary">
        <h2>Koniec! {pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</h2>
        <p className="big">{pct}%</p>
        <p className="muted">
          Za pierwszym podejściem: {score.ok} dobrze, {score.bad} źle. Pytania z błędami wróciły na koniec, żebyś mógł je poprawić.
        </p>
        <div className="row">
          <button
            className="btn"
            onClick={() => {
              setQueue(buildQueue(c, mode));
              setPos(0);
              setScore({ ok: 0, bad: 0 });
              setRequeued(new Set());
              setResult(null);
            }}
          >
            Jeszcze raz
          </button>
          {score.bad > 0 && <a className="btn ghost" href={`#/quiz/${c.id}/mistakes`}>Powtórz błędy</a>}
          <a className="btn ghost" href={`#/c/${c.id}/practice`}>Wróć do działu</a>
        </div>
      </div>
    );
  }

  const ex = queue[pos];
  const isRetry = requeued.has(ex.id) && pos >= initial.length;

  const check = (value: string) => {
    if (result || value.trim() === '') return;
    const r = evaluate(ex, value, c.language);
    setResult(r);
    if (!isRetry) {
      record(exKey(c.id, ex.id), r.correct);
      setScore((s) => (r.correct ? { ...s, ok: s.ok + 1 } : { ...s, bad: s.bad + 1 }));
    }
    if (!r.correct && !requeued.has(ex.id)) {
      setQueue((q) => [...q, ex]);
      setRequeued((s) => new Set(s).add(ex.id));
    }
    if (r.correct && ex.type !== 'choice' && answerLang(ex, c.language) === c.language)
      speak(ex.type === 'gap' ? ex.sentence.replace('___', r.expected) : r.expected, pack.speech);
  };

  /** Wstawia znak w miejscu kursora (przyciski z literami rumuńskimi). */
  const insertChar = (ch: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? input.length;
    const end = el?.selectionEnd ?? input.length;
    setInput(input.slice(0, start) + ch + input.slice(end));
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(start + ch.length, start + ch.length);
    }, 0);
  };

  const next = () => {
    setResult(null);
    setInput('');
    setPos((p) => p + 1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (result) next();
    else check(input);
  };

  return (
    <div className="quiz">
      <div className="quiz-top">
        <a href={`#/c/${c.id}/practice`} className="back">✕ Zakończ</a>
        <span className="muted small">{c.title} · {MODE_LABEL[mode]}</span>
        <span className="small">{Math.min(pos + 1, queue.length)} / {queue.length}</span>
      </div>
      <div className="bar"><div className="bar-fill" style={{ width: `${(pos / queue.length) * 100}%` }} /></div>

      <form className="card question" onSubmit={onSubmit}>
        {isRetry && <span className="pill warn">Poprawka</span>}
        <QuestionBody ex={ex} targetName={pack.nameTo} />

        {ex.type === 'choice' ? (
          <div className="options">
            {ex.options.map((o, i) => {
              const state = result ? (i === ex.correct ? 'right' : String(i) === input ? 'wrong' : '') : String(i) === input ? 'sel' : '';
              return (
                <button
                  type="button"
                  key={i}
                  className={`option ${state}`}
                  disabled={!!result}
                  onClick={() => {
                    setInput(String(i));
                    check(String(i));
                  }}
                >
                  {o}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            ref={inputRef}
            autoFocus
            className={`input big-input ${result ? (result.correct ? 'right' : 'wrong') : ''}`}
            value={input}
            readOnly={!!result}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ex.type === 'gap' ? 'Wpisz brakujące słowo…' : 'Wpisz tłumaczenie…'}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        )}
        {ex.type !== 'choice' && !result && answerLang(ex, c.language) === 'ro' && (
          <div className="charbar" aria-label="Znaki rumuńskie">
            {['ă', 'â', 'î', 'ș', 'ț'].map((ch) => (
              <button type="button" key={ch} className="chip" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => insertChar(ch)}>
                {ch}
              </button>
            ))}
          </div>
        )}

        {result && <Feedback ex={ex} result={result} category={c} />}

        <div className="row end">
          {!result && ex.type !== 'choice' && (
            <button type="button" className="btn ghost" onClick={() => check('—')}>Nie wiem</button>
          )}
          {result ? (
            <button className="btn" type="submit" autoFocus={ex.type === 'choice'}>Dalej →</button>
          ) : (
            ex.type !== 'choice' && <button className="btn" type="submit" disabled={!input.trim()}>Sprawdź</button>
          )}
        </div>
      </form>
      <p className="muted small center">Wynik: {score.ok} ✓ · {score.bad} ✗</p>
    </div>
  );
}

function QuestionBody({ ex, targetName }: { ex: Exercise; targetName: string }) {
  if (ex.type === 'translate')
    return (
      <>
        <p className="q-label">Przetłumacz na {ex.reverse ? 'polski' : targetName}</p>
        <p className="q-main">{ex.prompt}</p>
      </>
    );
  if (ex.type === 'gap') {
    const [a, b] = ex.sentence.split('___');
    return (
      <>
        <p className="q-label">Uzupełnij lukę{ex.hint ? ` (${ex.hint})` : ''}</p>
        <p className="q-main">
          {a}<span className="gap">____</span>{b}
        </p>
        {ex.translation && <p className="muted">{ex.translation}</p>}
      </>
    );
  }
  return (
    <>
      <p className="q-label">Wybierz poprawną odpowiedź</p>
      <p className="q-main">{ex.question}</p>
    </>
  );
}

function Feedback({ ex, result: r, category }: { ex: Exercise; result: Result; category: Category }) {
  const [showTheory, setShowTheory] = useState(false);
  const topic = category.grammar.find((g) => g.id === ex.grammarRef);
  return (
    <div className={`feedback ${r.correct ? 'ok' : 'bad'}`}>
      <h3>{r.correct ? '✓ Dobrze!' : '✗ Niestety, źle'}</h3>
      {r.note && <p className="note-warn">⚠️ {r.note}</p>}

      {!r.correct && ex.type !== 'choice' && (
        <>
          <p>
            Poprawnie: <strong>{r.expected}</strong>
          </p>
          {r.user !== '—' && r.diff && (
            <div className="diff" aria-label="Porównanie słowo po słowie">
              {r.diff.map((op, i) => {
                if (op.kind === 'same') return <span key={i} className="d-same">{op.word}</span>;
                if (op.kind === 'missing') return <span key={i} className="d-missing" title="brakujące słowo">+{op.word}</span>;
                if (op.kind === 'extra') return <span key={i} className="d-extra" title="zbędne słowo">{op.word}</span>;
                return (
                  <span key={i} className="d-wrong" title="złe słowo">
                    <s>{op.word}</s> {op.expected}
                  </span>
                );
              })}
            </div>
          )}
          {r.diagnoses.length > 0 && (
            <div className="diagnoses">
              <h4>Co poszło nie tak</h4>
              {r.diagnoses.map((d, i) => (
                <div key={i} className="diagnosis">
                  <strong>{d.title}</strong>
                  <p>{d.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {ex.type === 'choice' && ex.optionExplanations && (
        <ul className="opt-expl">
          {ex.options.map((o, i) =>
            i === ex.correct || o === r.user ? (
              <li key={i} className={i === ex.correct ? 'right-text' : 'wrong-text'}>
                <strong>{o}</strong>: {ex.optionExplanations![i]}
              </li>
            ) : null,
          )}
        </ul>
      )}

      {r.correct && ex.type !== 'choice' && 'answers' in ex && ex.answers.length > 1 && (
        <p className="small muted">Inne poprawne wersje: {ex.answers.filter((a) => a !== r.expected).join(' / ')}</p>
      )}

      <div className="explanation">
        <h4>Wyjaśnienie</h4>
        <p>{ex.explanation}</p>
        {topic && (
          <button type="button" className="link small" onClick={() => setShowTheory((v) => !v)}>
            📖 {showTheory ? 'Ukryj teorię' : `Teoria: ${topic.title}`}
          </button>
        )}
      </div>
      {showTheory && topic && <GrammarTopicView topic={topic} />}
    </div>
  );
}
