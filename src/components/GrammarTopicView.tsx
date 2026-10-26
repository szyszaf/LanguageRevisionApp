import type { GrammarTopic } from '../types';
import ExampleList from './ExampleList';

export default function GrammarTopicView({ topic: t }: { topic: GrammarTopic }) {
  return (
    <article className="card topic">
      <h2>{t.title}</h2>
      {t.explanation.map((p, i) => (
        <p key={i}>{p}</p>
      ))}

      {t.patterns && (
        <div className="patterns">
          <h3>Budowa</h3>
          {t.patterns.map((p, i) => (
            <code key={i} className="pattern">{p}</code>
          ))}
        </div>
      )}

      {t.tables?.map((tb, i) => (
        <div key={i} className="table-wrap">
          {tb.caption && <h3>{tb.caption}</h3>}
          <table>
            <thead>
              <tr>{tb.headers.map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {tb.rows.map((r, j) => (
                <tr key={j}>{r.map((cell, k) => <td key={k}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <h3>Przykłady</h3>
      <ExampleList examples={t.examples} />

      {t.commonMistakes && t.commonMistakes.length > 0 && (
        <>
          <h3>Typowe błędy</h3>
          <div className="mistakes">
            {t.commonMistakes.map((m, i) => (
              <div key={i} className="mistake">
                <div>
                  <span className="wrong-text">✗ {m.wrong}</span>
                  <span className="right-text">✓ {m.correct}</span>
                </div>
                <p className="small">{m.why}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {t.tips && t.tips.length > 0 && (
        <div className="tips">
          {t.tips.map((tip, i) => (
            <p key={i}>💡 {tip}</p>
          ))}
        </div>
      )}
    </article>
  );
}
