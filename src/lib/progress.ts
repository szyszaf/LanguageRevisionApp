// Postęp nauki zapisywany w localStorage przeglądarki.
// Słówka: system Leitnera (pudełka 1–5, im wyższe, tym rzadziej powtarzamy).
// Ćwiczenia: liczba dobrych/złych odpowiedzi i ostatni wynik (do trybu "Moje błędy").

const KEY = 'lra-progress-v1';
const BOX_DAYS = [0, 0, 1, 3, 7, 14]; // indeks = numer pudełka

export interface ItemStats {
  correct: number;
  wrong: number;
  lastCorrect: boolean;
  lastSeen: number;
  box: number;
  due: number;
}

type Store = Record<string, ItemStats>;

function load(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Store;
  } catch {
    return {};
  }
}

function save(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* tryb prywatny / brak miejsca – ignorujemy */
  }
}

export function getStats(id: string): ItemStats | undefined {
  return load()[id];
}

export function record(id: string, correct: boolean) {
  const store = load();
  const now = Date.now();
  const prev = store[id] ?? { correct: 0, wrong: 0, lastCorrect: false, lastSeen: 0, box: 1, due: 0 };
  const box = correct ? Math.min(prev.box + 1, 5) : 1;
  store[id] = {
    correct: prev.correct + (correct ? 1 : 0),
    wrong: prev.wrong + (correct ? 0 : 1),
    lastCorrect: correct,
    lastSeen: now,
    box,
    due: now + BOX_DAYS[box] * 86_400_000,
  };
  save(store);
}

export function isDue(id: string): boolean {
  const s = load()[id];
  return !s || s.due <= Date.now();
}

export function wasWrong(id: string): boolean {
  const s = load()[id];
  return !!s && !s.lastCorrect;
}

/** Odsetek elementów (z podanej listy id), na które ostatnio odpowiedziano dobrze. */
export function mastery(ids: string[]): number {
  if (ids.length === 0) return 0;
  const store = load();
  const ok = ids.filter((id) => store[id]?.lastCorrect).length;
  return Math.round((ok / ids.length) * 100);
}

export function resetProgress(prefix: string) {
  const store = load();
  for (const k of Object.keys(store)) if (k.startsWith(prefix)) delete store[k];
  save(store);
}
