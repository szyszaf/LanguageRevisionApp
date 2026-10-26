import { useMemo, useState } from 'react';
import type { Category } from '../types';
import { exKey, vocabExercises, wordKey } from '../data';
import { isDue, mastery, resetProgress, wasWrong } from '../lib/progress';
import GrammarTopicView from './GrammarTopicView';
import VocabCard from './VocabCard';

const TABS = [
  { id: 'grammar', label: 'Gramatyka' },
  { id: 'vocab', label: 'Słówka' },
  { id: 'practice', label: 'Ćwiczenia' },
];

export default function CategoryPage({ category: c, tab, topic }: { category: Category; tab: string; topic?: string }) {
  return (
    <>
      <a href="#/" className="back">← Wszystkie działy</a>
      <header className="cat-header">
        <h1>
          {c.icon} {c.title} <span className="muted">· {c.subtitle}</span>
        </h1>
        <p className="muted">{c.description}</p>
      </header>
      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <a key={t.id} role="tab" aria-selected={tab === t.id} href={`#/c/${c.id}/${t.id}`} className={tab === t.id ? 'tab active' : 'tab'}>
            {t.label}
          </a>
        ))}
      </nav>
      {tab === 'grammar' && <GrammarTab c={c} topic={topic} />}
      {tab === 'vocab' && <VocabTab c={c} />}
      {tab === 'practice' && <PracticeTab c={c} />}
    </>
  );
}

function GrammarTab({ c, topic }: { c: Category; topic?: string }) {
  const current = c.grammar.find((g) => g.id === topic) ?? c.grammar[0];
  const idx = c.grammar.indexOf(current);
  const next = c.grammar[idx + 1];
  const prev = c.grammar[idx - 1];
  return (
    <div className="split">
      <aside className="side">
        <ol className="topic-list">
          {c.grammar.map((g) => (
            <li key={g.id}>
              <a href={`#/c/${c.id}/grammar/${g.id}`} className={g.id === current.id ? 'active' : ''}>
                {g.title}
              </a>
            </li>
          ))}
        </ol>
      </aside>
      <div>
        <GrammarTopicView topic={current} />
        <div className="pager">
          {prev ? <a className="btn ghost" href={`#/c/${c.id}/grammar/${prev.id}`}>← {prev.title}</a> : <span />}
          {next ? (
            <a className="btn" href={`#/c/${c.id}/grammar/${next.id}`}>{next.title} →</a>
          ) : (
            <a className="btn" href={`#/c/${c.id}/practice`}>Przejdź do ćwiczeń →</a>
          )}
        </div>
      </div>
    </div>
  );
}

function VocabTab({ c }: { c: Category }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return c.vocabulary;
    return c.vocabulary.filter(
      (v) =>
        v.word.toLowerCase().includes(s) ||
        v.translation.toLowerCase().includes(s) ||
        v.synonyms.some((x) => x.word.toLowerCase().includes(s) || x.translation.toLowerCase().includes(s)),
    );
  }, [q, c.vocabulary]);
  return (
    <>
      <div className="toolbar">
        <input className="input" placeholder="Szukaj słowa, tłumaczenia lub synonimu…" value={q} onChange={(e) => setQ(e.target.value)} />
        <a className="btn" href={`#/cards/${c.id}`}>Fiszki</a>
        <a className="btn ghost" href={`#/quiz/${c.id}/words`}>Test ze słówek</a>
      </div>
      <div className="vocab-list">
        {list.map((v) => (
          <VocabCard key={v.id} entry={v} />
        ))}
        {list.length === 0 && <p className="muted">Nic nie znaleziono.</p>}
      </div>
    </>
  );
}

function PracticeTab({ c }: { c: Category }) {
  const [, force] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const exIds = c.exercises.map((e) => exKey(c.id, e.id));
  const wIds = vocabExercises(c).map((e) => exKey(c.id, e.id));
  const wrongCount = [...exIds, ...wIds].filter(wasWrong).length;
  const dueWords = c.vocabulary.filter((v) => isDue(wordKey(c.id, v.id))).length;

  const modes = [
    { id: 'grammar', title: 'Gramatyka', desc: `${c.exercises.length} ćwiczeń: luki, wybór, tłumaczenie zdań`, pct: mastery(exIds) },
    { id: 'words', title: 'Słówka', desc: `${c.vocabulary.length} słówek do przetłumaczenia z polskiego`, pct: mastery(wIds) },
    { id: 'mixed', title: 'Mieszany', desc: 'Wszystko razem, w losowej kolejności', pct: mastery([...exIds, ...wIds]) },
  ];

  return (
    <>
      <div className="grid">
        {modes.map((m) => (
          <a key={m.id} className="card mode-card" href={`#/quiz/${c.id}/${m.id}`}>
            <h3>{m.title}</h3>
            <p className="muted small">{m.desc}</p>
            <div className="bar"><div className="bar-fill" style={{ width: `${m.pct}%` }} /></div>
            <span className="small muted">Opanowanie: {m.pct}%</span>
          </a>
        ))}
        <a className={`card mode-card ${wrongCount ? 'warn' : 'disabled'}`} href={wrongCount ? `#/quiz/${c.id}/mistakes` : undefined}>
          <h3>Moje błędy</h3>
          <p className="muted small">
            {wrongCount ? `${wrongCount} pytań, na które ostatnio odpowiedziałeś źle` : 'Brak błędów do poprawienia 🎉'}
          </p>
        </a>
        <a className="card mode-card" href={`#/cards/${c.id}`}>
          <h3>Fiszki</h3>
          <p className="muted small">{dueWords} słówek do powtórki dziś (system Leitnera)</p>
        </a>
      </div>
      {confirming ? (
        <div className="row small">
          <span>Usunąć cały postęp w tym dziale?</span>
          <button
            className="link danger"
            onClick={() => {
              resetProgress(`${c.id}:`);
              setConfirming(false);
              force((n) => n + 1);
            }}
          >
            Tak, usuń
          </button>
          <button className="link" onClick={() => setConfirming(false)}>Anuluj</button>
        </div>
      ) : (
        <button className="link danger small" onClick={() => setConfirming(true)}>
          Wyzeruj postęp w tym dziale
        </button>
      )}
    </>
  );
}
