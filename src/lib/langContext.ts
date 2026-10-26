import { createContext, useContext } from 'react';
import { getPack, type LanguagePack } from './lang';

/** Język aktualnie otwartego działu (do syntezy mowy i etykiet). */
export const LangContext = createContext<LanguagePack>(getPack('ro'));
export const useLang = () => useContext(LangContext);
