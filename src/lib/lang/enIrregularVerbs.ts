// Najczęstsze czasowniki nieregularne: forma podstawowa → [Past Simple, Past Participle, tłumaczenie].
// Używane przez automatyczne wykrywanie błędów oraz tabelę w dziale "Czas przeszły".

export const IRREGULAR_VERBS: Record<string, [string, string, string]> = {
  be: ['was/were', 'been', 'być'],
  become: ['became', 'become', 'stawać się'],
  begin: ['began', 'begun', 'zaczynać'],
  break: ['broke', 'broken', 'łamać, psuć'],
  bring: ['brought', 'brought', 'przynosić'],
  build: ['built', 'built', 'budować'],
  buy: ['bought', 'bought', 'kupować'],
  catch: ['caught', 'caught', 'łapać'],
  choose: ['chose', 'chosen', 'wybierać'],
  come: ['came', 'come', 'przychodzić'],
  cost: ['cost', 'cost', 'kosztować'],
  cut: ['cut', 'cut', 'ciąć'],
  do: ['did', 'done', 'robić'],
  drink: ['drank', 'drunk', 'pić'],
  drive: ['drove', 'driven', 'prowadzić (auto)'],
  eat: ['ate', 'eaten', 'jeść'],
  fall: ['fell', 'fallen', 'upadać'],
  feel: ['felt', 'felt', 'czuć'],
  find: ['found', 'found', 'znajdować'],
  fly: ['flew', 'flown', 'latać'],
  forget: ['forgot', 'forgotten', 'zapominać'],
  get: ['got', 'got/gotten', 'dostawać'],
  give: ['gave', 'given', 'dawać'],
  go: ['went', 'gone', 'iść, jechać'],
  have: ['had', 'had', 'mieć'],
  hear: ['heard', 'heard', 'słyszeć'],
  keep: ['kept', 'kept', 'trzymać'],
  know: ['knew', 'known', 'wiedzieć, znać'],
  leave: ['left', 'left', 'wychodzić, zostawiać'],
  lose: ['lost', 'lost', 'gubić, przegrywać'],
  make: ['made', 'made', 'robić, tworzyć'],
  meet: ['met', 'met', 'spotykać'],
  pay: ['paid', 'paid', 'płacić'],
  put: ['put', 'put', 'kłaść'],
  read: ['read', 'read', 'czytać'],
  ride: ['rode', 'ridden', 'jeździć (rowerem, konno)'],
  run: ['ran', 'run', 'biegać'],
  say: ['said', 'said', 'mówić, powiedzieć'],
  see: ['saw', 'seen', 'widzieć'],
  sell: ['sold', 'sold', 'sprzedawać'],
  send: ['sent', 'sent', 'wysyłać'],
  sing: ['sang', 'sung', 'śpiewać'],
  sit: ['sat', 'sat', 'siedzieć'],
  sleep: ['slept', 'slept', 'spać'],
  speak: ['spoke', 'spoken', 'mówić (językiem)'],
  spend: ['spent', 'spent', 'spędzać, wydawać'],
  stand: ['stood', 'stood', 'stać'],
  swim: ['swam', 'swum', 'pływać'],
  take: ['took', 'taken', 'brać'],
  teach: ['taught', 'taught', 'uczyć (kogoś)'],
  tell: ['told', 'told', 'powiedzieć, opowiadać'],
  think: ['thought', 'thought', 'myśleć'],
  understand: ['understood', 'understood', 'rozumieć'],
  wake: ['woke', 'woken', 'budzić się'],
  wear: ['wore', 'worn', 'nosić (ubranie)'],
  win: ['won', 'won', 'wygrywać'],
  write: ['wrote', 'written', 'pisać'],
};

/** forma przeszła → forma podstawowa (np. "went" → "go"). */
export const PAST_TO_BASE: Record<string, string> = {};
for (const [base, [past]] of Object.entries(IRREGULAR_VERBS)) {
  for (const p of past.split('/')) PAST_TO_BASE[p] = base;
}

/** Zgadywana forma "-ed" (do wykrywania błędów typu "goed", "buyed"). */
export function naiveEd(base: string): string[] {
  const forms = new Set<string>([base + 'ed']);
  if (base.endsWith('e')) forms.add(base + 'd');
  if (/[^aeiou]y$/.test(base)) forms.add(base.slice(0, -1) + 'ied');
  forms.add(base + base.slice(-1) + 'ed');
  return [...forms];
}

const NAIVE_TO_BASE: Record<string, string> = {};
for (const base of Object.keys(IRREGULAR_VERBS)) {
  for (const f of naiveEd(base)) NAIVE_TO_BASE[f] = base;
}
export { NAIVE_TO_BASE };

/** Prosty test, czy słowo wygląda na formę przeszłą (nieregularną lub z -ed). */
export function looksPast(word: string): boolean {
  return word in PAST_TO_BASE || (word.length > 3 && word.endsWith('ed'));
}
