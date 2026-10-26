import type { LanguagePack } from './types';
import { en } from './en';
import { pl } from './pl';
import { ro } from './ro';

const PACKS: Record<string, LanguagePack> = { en, pl, ro };

export function getPack(code: string): LanguagePack {
  return PACKS[code] ?? pl;
}

export type { LanguagePack, Diagnosis } from './types';
