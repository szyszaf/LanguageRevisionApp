import { describe, expect, it } from 'vitest';
import { isCorrect, matchIgnoringDiacritics, normalize } from './answer';
import { detectMistakes } from './detectors';
import { categories } from '../data';

const titles = (u: string, e: string, lang = 'ro') => detectMistakes(u, e, lang).map((d) => d.title);

describe('rumuński – normalizacja', () => {
  it('n-am = nu am, ş/ţ z ogonkiem = ș/ț z przecinkiem', () => {
    expect(normalize('N-am mâncat!', 'ro')).toBe('nu am mâncat');
    expect(isCorrect('N-am mâncat micul dejun', ['Nu am mâncat micul dejun.'], 'ro')).toBe(true);
    expect(isCorrect('Am fost acasă', ['Am fost acasă.'], 'ro')).toBe(true);
    expect(isCorrect('M-am trezit la ora şapte', ['M-am trezit la ora șapte.'], 'ro')).toBe(true);
  });
  it('odpowiedź bez znaków diakrytycznych jest rozpoznawana', () => {
    expect(isCorrect('Ce ai facut ieri', ['Ce ai făcut ieri?'], 'ro')).toBe(false);
    expect(matchIgnoringDiacritics('Ce ai facut ieri', ['Ce ai făcut ieri?'], 'ro')).toBe('Ce ai făcut ieri?');
  });
});

describe('rumuński – wykrywanie błędów', () => {
  it('zły posiłkowy', () => {
    expect(titles('Ei a venit', 'Ei au venit')).toContain('Zła forma czasownika posiłkowego');
  });
  it('pełna forma „are”', () => {
    expect(titles('El are scris', 'El a scris')).toContain('Pełna forma „a avea” zamiast posiłkowej');
  });
  it('brak posiłkowego', () => {
    expect(titles('Ieri mâncat pizza', 'Ieri am mâncat pizza')).toContain('Brakuje czasownika posiłkowego');
  });
  it('imiesłów „z reguły” zamiast nieregularnego', () => {
    expect(titles('Am vedut un film', 'Am văzut un film')[0]).toContain('Nieregularny imiesłów');
    expect(titles('Noi am mergut', 'Noi am mers')[0]).toContain('Nieregularny imiesłów');
  });
  it('bezokolicznik / czas teraźniejszy zamiast imiesłowu', () => {
    expect(titles('Am mânca pizza', 'Am mâncat pizza')).toContain('Bezokolicznik zamiast imiesłowu');
    expect(titles('Am merg la Cluj', 'Am mers la Cluj')).toContain('Czas teraźniejszy zamiast imiesłowu');
  });
  it('odmiana imiesłowu przez rodzaj', () => {
    expect(titles('Am mâncată', 'Am mâncat')).toContain('Imiesłów się nie odmienia');
  });
  it('brak zaimka zwrotnego', () => {
    expect(titles('Am trezit la ora șapte', 'M-am trezit la ora șapte')).toContain('Brakuje zaimka przed posiłkowym');
  });
  it('rozdzielony zaimek i „o” przed posiłkowym', () => {
    expect(titles('Mă am trezit', 'M-am trezit')).toEqual(['Brakuje łącznika']);
    expect(titles('Am vazut o ieri', 'Am văzut-o ieri')).toContain('Brakuje łącznika');
    expect(titles('O am văzut ieri', 'Am văzut-o ieri')).toContain('Zaimek „o” stoi po imiesłowie');
    expect(titles('O am văzut ieri', 'Am văzut-o ieri')).not.toContain('Literówka');
  });
  it('przeczenie po posiłkowym', () => {
    expect(titles('Am nu mâncat', 'Nu am mâncat')).toContain('Przeczenie przed posiłkowym');
  });
  it('słowa bez diakrytyków nie rozbijają porównania', () => {
    expect(titles('Ei a ajuns saptamana trecuta', 'Ei au ajuns săptămâna trecută')).toEqual(['Zła forma czasownika posiłkowego', 'Znaki diakrytyczne']);
  });
  it('zaimek zamiast posiłkowego', () => {
    expect(titles('Ieri eu fost acasă', 'Ieri am fost acasă')).toEqual(['Brakuje czasownika posiłkowego']);
  });
  it('same znaki diakrytyczne w jednym słowie', () => {
    expect(titles('Am facut tema ieri', 'Am făcut tema azi')).toContain('Znaki diakrytyczne');
  });
});

describe('angielski – moduł nadal działa', () => {
  it('goed / didn\'t went / was-were', () => {
    expect(titles('I goed home', 'I went home', 'en')[0]).toContain('nieregularny');
    expect(titles("I didn't went there", "I didn't go there", 'en')).toContain('Po „did” forma podstawowa');
    expect(titles('You was late', 'You were late', 'en')).toContain('Was czy were?');
    expect(isCorrect('we didnt go', ["We didn't go."], 'en')).toBe(true);
  });
});

describe('dane działów', () => {
  for (const c of categories) {
    it(`${c.id}: unikalne id, poprawne odwołania, działające wyrażenia`, () => {
      const ids = c.exercises.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
      const vIds = c.vocabulary.map((v) => v.id);
      expect(new Set(vIds).size).toBe(vIds.length);
      const topics = new Set(c.grammar.map((g) => g.id));
      for (const e of c.exercises) {
        if (e.grammarRef) expect(topics.has(e.grammarRef), `${e.id} → ${e.grammarRef}`).toBe(true);
        if (e.type === 'gap') expect(e.sentence).toContain('___');
        if (e.type === 'choice') expect(e.options[e.correct]).toBeDefined();
        for (const m of e.mistakes ?? []) expect(() => new RegExp(m.match, 'iu')).not.toThrow();
      }
    });
  }
});
