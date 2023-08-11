/* eslint-disable @typescript-eslint/no-explicit-any */
import * as en from './languages/en.json';
import * as de from './languages/de.json';
import * as pt from './languages/pt.json';
import * as ptBR from './languages/pt-BR.json';
import * as es from './languages/es.json';
import * as nl from './languages/nl.json';
import * as it from './languages/it.json';
import * as fr from './languages/fr.json';
import * as ru from './languages/ru.json';
import * as fi from './languages/fi.json';
import * as pl from './languages/pl.json';

const languages: any = {
  en,
  de,
  pt,
  pt_BR: ptBR,
  es,
  nl,
  it,
  fr,
  ru,
  fi,
  pl,
};

export function localize(string: string, search = '', replace = ''): string {
  const lang = (localStorage.getItem('selectedLanguage') || 'en').replace(/['"]+/g, '').replace('-', '_');

  let translated: string;

  try {
    translated = string.split('.').reduce((o, i) => o[i], languages[lang]);
  } catch (e) {
    translated = string.split('.').reduce((o, i) => o[i], languages['en']);
  }

  if (translated === undefined) translated = string.split('.').reduce((o, i) => o && o[i], languages['en']);

  if (search !== '' && replace !== '') {
    translated = translated.replace(search, replace);
  }
  return translated || string;
}
