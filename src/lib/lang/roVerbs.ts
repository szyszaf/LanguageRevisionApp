// Czasowniki rumuńskie: bezokolicznik (bez „a”) → [1. os. l.p. czasu teraźniejszego, imiesłów (participiu), znaczenie].
// Używane w tabeli w dziale „Czas przeszły” i przy wykrywaniu błędów.

export const RO_VERBS: Record<string, [string, string, string]> = {
  // -a (koniugacja I) → -at
  lucra: ['lucrez', 'lucrat', 'pracować'],
  mânca: ['mănânc', 'mâncat', 'jeść'],
  cumpăra: ['cumpăr', 'cumpărat', 'kupować'],
  pleca: ['plec', 'plecat', 'wychodzić, wyjeżdżać'],
  uita: ['uit', 'uitat', 'zapominać'],
  cânta: ['cânt', 'cântat', 'śpiewać'],
  învăța: ['învăț', 'învățat', 'uczyć się'],
  juca: ['joc', 'jucat', 'grać, bawić się'],
  lua: ['iau', 'luat', 'brać'],
  da: ['dau', 'dat', 'dawać'],
  sta: ['stau', 'stat', 'stać, mieszkać, siedzieć'],
  // -ea (koniugacja II) → -ut (często ze zmianą rdzenia)
  avea: ['am', 'avut', 'mieć'],
  vedea: ['văd', 'văzut', 'widzieć'],
  bea: ['beau', 'băut', 'pić'],
  putea: ['pot', 'putut', 'móc'],
  plăcea: ['plac', 'plăcut', 'podobać się'],
  vrea: ['vreau', 'vrut', 'chcieć'],
  cădea: ['cad', 'căzut', 'upaść'],
  tăcea: ['tac', 'tăcut', 'milczeć'],
  // -e (koniugacja III) → -ut albo -s
  face: ['fac', 'făcut', 'robić'],
  crede: ['cred', 'crezut', 'wierzyć, sądzić'],
  cere: ['cer', 'cerut', 'prosić, żądać'],
  vinde: ['vând', 'vândut', 'sprzedawać'],
  pierde: ['pierd', 'pierdut', 'gubić, przegrywać'],
  începe: ['încep', 'început', 'zaczynać'],
  cunoaște: ['cunosc', 'cunoscut', 'znać, poznać'],
  bate: ['bat', 'bătut', 'bić, pukać'],
  merge: ['merg', 'mers', 'iść, jechać'],
  scrie: ['scriu', 'scris', 'pisać'],
  spune: ['spun', 'spus', 'mówić, powiedzieć'],
  pune: ['pun', 'pus', 'kłaść'],
  înțelege: ['înțeleg', 'înțeles', 'rozumieć'],
  trimite: ['trimit', 'trimis', 'wysyłać'],
  deschide: ['deschid', 'deschis', 'otwierać'],
  închide: ['închid', 'închis', 'zamykać'],
  ajunge: ['ajung', 'ajuns', 'dotrzeć, przyjechać'],
  alege: ['aleg', 'ales', 'wybierać'],
  duce: ['duc', 'dus', 'nieść, zanosić'],
  zice: ['zic', 'zis', 'mówić'],
  râde: ['râd', 'râs', 'śmiać się'],
  plânge: ['plâng', 'plâns', 'płakać'],
  rămâne: ['rămân', 'rămas', 'zostać'],
  întoarce: ['întorc', 'întors', 'odwracać; (se) wracać'],
  // -i / -î (koniugacja IV) → -it / -ât
  fi: ['sunt', 'fost', 'być'],
  dormi: ['dorm', 'dormit', 'spać'],
  citi: ['citesc', 'citit', 'czytać'],
  veni: ['vin', 'venit', 'przychodzić, przyjeżdżać'],
  vorbi: ['vorbesc', 'vorbit', 'mówić, rozmawiać'],
  întâlni: ['întâlnesc', 'întâlnit', 'spotykać'],
  auzi: ['aud', 'auzit', 'słyszeć'],
  ieși: ['ies', 'ieșit', 'wychodzić'],
  ști: ['știu', 'știut', 'wiedzieć'],
  trezi: ['trezesc', 'trezit', 'budzić (się)'],
  călători: ['călătoresc', 'călătorit', 'podróżować'],
  hotărî: ['hotărăsc', 'hotărât', 'postanowić'],
  coborî: ['cobor', 'coborât', 'schodzić, wysiadać'],
};

/** imiesłów → bezokolicznik */
export const RO_PARTICIPLE_TO_INF: Record<string, string> = {};
for (const [inf, [, part]] of Object.entries(RO_VERBS)) RO_PARTICIPLE_TO_INF[part] = inf;

/** Imiesłów „zgadnięty” mechanicznie z bezokolicznika – do wykrywania błędów typu „vedut”, „mergut”, „facut”. */
export function naiveParticiples(inf: string): string[] {
  const out = new Set<string>();
  if (inf.endsWith('ea')) out.add(inf.slice(0, -2) + 'ut');
  else if (inf.endsWith('a')) out.add(inf.slice(0, -1) + 'at');
  else if (inf.endsWith('e')) {
    out.add(inf.slice(0, -1) + 'ut');
    out.add(inf.slice(0, -1) + 'at');
    out.add(inf.slice(0, -1) + 'it');
  } else if (inf.endsWith('i')) out.add(inf + 't');
  else if (inf.endsWith('î')) out.add(inf.slice(0, -1) + 'ât');
  return [...out];
}
