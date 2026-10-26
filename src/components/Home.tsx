import { categories, exKey, wordKey } from '../data';
import { mastery } from '../lib/progress';

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Powtórka słówek i gramatyki</h1>
        <p className="muted">
          Wybierz dział. W każdym znajdziesz teorię z przykładami, słówka z synonimami i ćwiczenia, w których każdy błąd
          jest dokładnie wyjaśniony.
        </p>
      </section>
      <div className="grid">
        {categories.map((c) => {
          const ids = [...c.exercises.map((e) => exKey(c.id, e.id)), ...c.vocabulary.map((v) => wordKey(c.id, v.id))];
          const pct = mastery(ids);
          return (
            <a key={c.id} href={`#/c/${c.id}`} className="card cat-card">
              <div className="cat-icon">{c.icon ?? '📘'}</div>
              <div className="cat-body">
                <h2>
                  {c.title} <span className="muted small">· {c.subtitle}</span>
                </h2>
                <p className="muted small">{c.description}</p>
                <div className="meta small">
                  {c.level && <span className="pill">{c.level}</span>}
                  <span>{c.grammar.length} tematów</span>
                  <span>{c.vocabulary.length} słówek</span>
                  <span>{c.exercises.length} ćwiczeń</span>
                </div>
                <div className="bar" aria-label={`Opanowanie ${pct}%`}>
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="small muted">Opanowanie: {pct}%</span>
              </div>
            </a>
          );
        })}
        <div className="card cat-card placeholder">
          <div className="cat-icon">＋</div>
          <div className="cat-body">
            <h2>Kolejne działy</h2>
            <p className="muted small">Dodawane na podstawie lekcji z Duolingo – zobacz docs/FORMAT.md.</p>
          </div>
        </div>
      </div>
    </>
  );
}
