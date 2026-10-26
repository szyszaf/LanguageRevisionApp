import { describe, expect, it } from 'vitest';
import { isCorrect, normalize } from './answer';
import { detectMistakes } from './detectors';
import { pastSimple } from '../data/categories/pastSimple';

const titles = (u: string, e: string) => detectMistakes(u, e).map((d) => d.title);

describe('normalize / isCorrect', () => {
  it('ignores case, punctuation and contractions', () => {
    expect(normalize("I DIDN'T go!")).toBe('i did not go');
    expect(isCorrect('we did not go to school yesterday', ["We didn't go to school yesterday."])).toBe(true);
    expect(isCorrect('I bought a new phone', ['I bought a new phone.'])).toBe(true);
  });
});

describe('detectMistakes', () => {
  it('regularized irregular verb', () => {
    expect(titles('I goed home', 'I went home')[0]).toContain('nieregularny');
  });
  it('past form after did', () => {
    expect(titles("I didn't went there", "I didn't go there")).toContain('Po „did” forma podstawowa');
  });
  it('base form instead of past', () => {
    expect(titles('I go home yesterday', 'I went home yesterday')).toContain('Brak formy przeszłej');
  });
  it('was / were', () => {
    expect(titles('You was late', 'You were late')).toContain('Was czy were?');
  });
  it('present perfect with past time expression', () => {
    expect(titles('I have met him two years ago', 'I met him two years ago')).toContain('Present Perfect zamiast Past Simple');
  });
  it('typo', () => {
    expect(titles('I bougt a new phone', 'I bought a new phone')).toContain('Literówka');
  });
  it('missing did in question', () => {
    expect(titles('Where you went', 'Where did you go')).toContain('Brakuje „did”');
  });
  it('did with be', () => {
    expect(titles('Where did you were last night', 'Where were you last night')).toContain('Z „be” nie używamy „did”');
  });
  it('word order', () => {
    expect(titles('I yesterday went home', 'I went home yesterday')).toContain('Szyk zdania');
  });
});

describe('past simple data', () => {
  it('has unique ids and valid references', () => {
    const ids = pastSimple.exercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const topics = new Set(pastSimple.grammar.map((g) => g.id));
    for (const e of pastSimple.exercises) if (e.grammarRef) expect(topics.has(e.grammarRef)).toBe(true);
    for (const e of pastSimple.exercises) if (e.type === 'gap') expect(e.sentence).toContain('___');
    for (const e of pastSimple.exercises) for (const m of e.mistakes ?? []) expect(() => new RegExp(m.match)).not.toThrow();
  });
});

describe('more cases', () => {
  it('contractions without apostrophe', () => {
    expect(isCorrect('we didnt go to school yesterday', ["We didn't go to school yesterday."])).toBe(true);
  });
  it('present -s form instead of past', () => {
    expect(titles('Yesterday she goes home', 'Yesterday she went home')).toContain('Czas teraźniejszy zamiast przeszłego');
  });
  it('moved words are reported as word order, not missing/extra', () => {
    const t = titles('Where did you were last night', 'Where were you last night');
    expect(t).toContain('Szyk zdania');
    expect(t).not.toContain('Zbędne słowa');
  });
});
