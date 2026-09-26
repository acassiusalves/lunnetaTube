/**
 * Países disponíveis nos seletores do sistema (busca do Início e Tendências).
 *
 * A lista corresponde às regiões suportadas pela YouTube Data API
 * (i18nRegions), usadas em `regionCode` na busca e no chart=mostPopular.
 */

export interface Country {
  value: string;  // Código ISO uppercase (BR, PT, US...)
  label: string;  // Nome em português
  lang: string;   // Idioma principal no formato de `hl` do YouTube (pt, es, pt-PT, zh-TW...)
  flag: string;   // Emoji da bandeira
}

// Nome do idioma em inglês, usado para traduzir a palavra-chave da busca
const LANGUAGE_NAMES: Record<string, string> = {
  ar: 'Arabic',
  az: 'Azerbaijani',
  bg: 'Bulgarian',
  bn: 'Bengali',
  bs: 'Bosnian',
  cs: 'Czech',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  en: 'English',
  es: 'Spanish',
  et: 'Estonian',
  fi: 'Finnish',
  fil: 'Filipino',
  fr: 'French',
  hi: 'Hindi',
  hr: 'Croatian',
  hu: 'Hungarian',
  id: 'Indonesian',
  is: 'Icelandic',
  it: 'Italian',
  iw: 'Hebrew',
  ja: 'Japanese',
  ka: 'Georgian',
  km: 'Khmer',
  ko: 'Korean',
  lo: 'Lao',
  lt: 'Lithuanian',
  lv: 'Latvian',
  mk: 'Macedonian',
  ms: 'Malay',
  ne: 'Nepali',
  nl: 'Dutch',
  no: 'Norwegian',
  pl: 'Polish',
  pt: 'Brazilian Portuguese',
  'pt-PT': 'European Portuguese',
  ro: 'Romanian',
  ru: 'Russian',
  si: 'Sinhala',
  sk: 'Slovak',
  sl: 'Slovenian',
  sr: 'Serbian',
  sv: 'Swedish',
  sw: 'Swahili',
  th: 'Thai',
  tr: 'Turkish',
  uk: 'Ukrainian',
  ur: 'Urdu',
  vi: 'Vietnamese',
  'zh-HK': 'Traditional Chinese (Hong Kong)',
  'zh-TW': 'Traditional Chinese (Taiwan)',
};

// Converte o código ISO no emoji da bandeira (letras de indicador regional)
function flagEmoji(code: string): string {
  return String.fromCodePoint(...[...code].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}

// [código, nome, idioma] — em ordem alfabética pelo nome
const COUNTRY_DATA: Array<[string, string, string]> = [
  ['ZA', 'África do Sul', 'en'],
  ['DE', 'Alemanha', 'de'],
  ['SA', 'Arábia Saudita', 'ar'],
  ['DZ', 'Argélia', 'ar'],
  ['AR', 'Argentina', 'es'],
  ['AU', 'Austrália', 'en'],
  ['AT', 'Áustria', 'de'],
  ['AZ', 'Azerbaijão', 'az'],
  ['BH', 'Bahrein', 'ar'],
  ['BD', 'Bangladesh', 'bn'],
  ['BY', 'Belarus', 'ru'],
  ['BE', 'Bélgica', 'nl'],
  ['BO', 'Bolívia', 'es'],
  ['BA', 'Bósnia e Herzegovina', 'bs'],
  ['BR', 'Brasil', 'pt'],
  ['BG', 'Bulgária', 'bg'],
  ['KH', 'Camboja', 'km'],
  ['CA', 'Canadá', 'en'],
  ['QA', 'Catar', 'ar'],
  ['KZ', 'Cazaquistão', 'ru'],
  ['CL', 'Chile', 'es'],
  ['CY', 'Chipre', 'el'],
  ['CO', 'Colômbia', 'es'],
  ['KR', 'Coreia do Sul', 'ko'],
  ['CR', 'Costa Rica', 'es'],
  ['HR', 'Croácia', 'hr'],
  ['DK', 'Dinamarca', 'da'],
  ['EG', 'Egito', 'ar'],
  ['SV', 'El Salvador', 'es'],
  ['AE', 'Emirados Árabes Unidos', 'ar'],
  ['EC', 'Equador', 'es'],
  ['SK', 'Eslováquia', 'sk'],
  ['SI', 'Eslovênia', 'sl'],
  ['ES', 'Espanha', 'es'],
  ['US', 'Estados Unidos', 'en'],
  ['EE', 'Estônia', 'et'],
  ['PH', 'Filipinas', 'fil'],
  ['FI', 'Finlândia', 'fi'],
  ['FR', 'França', 'fr'],
  ['GH', 'Gana', 'en'],
  ['GE', 'Geórgia', 'ka'],
  ['GR', 'Grécia', 'el'],
  ['GT', 'Guatemala', 'es'],
  ['HN', 'Honduras', 'es'],
  ['HK', 'Hong Kong', 'zh-HK'],
  ['HU', 'Hungria', 'hu'],
  ['YE', 'Iêmen', 'ar'],
  ['IN', 'Índia', 'hi'],
  ['ID', 'Indonésia', 'id'],
  ['IQ', 'Iraque', 'ar'],
  ['IE', 'Irlanda', 'en'],
  ['IS', 'Islândia', 'is'],
  ['IL', 'Israel', 'iw'],
  ['IT', 'Itália', 'it'],
  ['JM', 'Jamaica', 'en'],
  ['JP', 'Japão', 'ja'],
  ['JO', 'Jordânia', 'ar'],
  ['KW', 'Kuwait', 'ar'],
  ['LA', 'Laos', 'lo'],
  ['LV', 'Letônia', 'lv'],
  ['LB', 'Líbano', 'ar'],
  ['LY', 'Líbia', 'ar'],
  ['LI', 'Liechtenstein', 'de'],
  ['LT', 'Lituânia', 'lt'],
  ['LU', 'Luxemburgo', 'fr'],
  ['MK', 'Macedônia do Norte', 'mk'],
  ['MY', 'Malásia', 'ms'],
  ['MT', 'Malta', 'en'],
  ['MA', 'Marrocos', 'ar'],
  ['MX', 'México', 'es'],
  ['ME', 'Montenegro', 'sr'],
  ['NP', 'Nepal', 'ne'],
  ['NI', 'Nicarágua', 'es'],
  ['NG', 'Nigéria', 'en'],
  ['NO', 'Noruega', 'no'],
  ['NZ', 'Nova Zelândia', 'en'],
  ['OM', 'Omã', 'ar'],
  ['NL', 'Países Baixos (Holanda)', 'nl'],
  ['PA', 'Panamá', 'es'],
  ['PG', 'Papua-Nova Guiné', 'en'],
  ['PK', 'Paquistão', 'ur'],
  ['PY', 'Paraguai', 'es'],
  ['PE', 'Peru', 'es'],
  ['PL', 'Polônia', 'pl'],
  ['PR', 'Porto Rico', 'es'],
  ['PT', 'Portugal', 'pt-PT'],
  ['KE', 'Quênia', 'en'],
  ['GB', 'Reino Unido', 'en'],
  ['DO', 'República Dominicana', 'es'],
  ['CZ', 'República Tcheca', 'cs'],
  ['RO', 'Romênia', 'ro'],
  ['RU', 'Rússia', 'ru'],
  ['SN', 'Senegal', 'fr'],
  ['RS', 'Sérvia', 'sr'],
  ['SG', 'Singapura', 'en'],
  ['LK', 'Sri Lanka', 'si'],
  ['SE', 'Suécia', 'sv'],
  ['CH', 'Suíça', 'de'],
  ['TH', 'Tailândia', 'th'],
  ['TW', 'Taiwan', 'zh-TW'],
  ['TZ', 'Tanzânia', 'sw'],
  ['TN', 'Tunísia', 'ar'],
  ['TR', 'Turquia', 'tr'],
  ['UA', 'Ucrânia', 'uk'],
  ['UG', 'Uganda', 'en'],
  ['UY', 'Uruguai', 'es'],
  ['VE', 'Venezuela', 'es'],
  ['VN', 'Vietnã', 'vi'],
  ['ZW', 'Zimbábue', 'en'],
];

export const COUNTRIES: Country[] = COUNTRY_DATA.map(([value, label, lang]) => ({
  value,
  label,
  lang,
  flag: flagEmoji(value),
}));

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.value === code.toUpperCase());
}

// Códigos `hl` do YouTube que diferem do ISO 639-1 esperado pelo relevanceLanguage
const RELEVANCE_LANGUAGE_OVERRIDES: Record<string, string> = {
  'pt-PT': 'pt',
  iw: 'he',
  fil: 'tl',
  'zh-HK': 'zh-Hant',
  'zh-TW': 'zh-Hant',
};

// Idioma do país no formato do parâmetro relevanceLanguage do search.list
// Bandeira e nome de qualquer país, inclusive os que não estão na lista de busca
export function countryFlag(code: string): string {
  return /^[A-Za-z]{2}$/.test(code) ? flagEmoji(code.toUpperCase()) : '';
}

export function countryName(code: string): string {
  return getCountryByCode(code)?.label || code.toUpperCase();
}

export function getRelevanceLanguage(code: string): string | undefined {
  const lang = getCountryByCode(code)?.lang;
  if (!lang) return undefined;
  return RELEVANCE_LANGUAGE_OVERRIDES[lang] || lang;
}

// Nome do idioma (em inglês) para o fluxo de tradução
export function getLanguageName(lang: string): string {
  return LANGUAGE_NAMES[lang] || lang;
}
