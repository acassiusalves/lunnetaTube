'use client';

import { TrendingUp } from 'lucide-react';
import type { TopTerm } from '@/lib/shorts-terms';

interface TrendingTermsProps {
  terms: TopTerm[];
  // Tradução para o português de cada termo (ausente quando o país fala português)
  translations: Record<string, string>;
  disabled: boolean;
  onSelect: (term: string) => void;
}

export function TrendingTerms({ terms, translations, disabled, onSelect }: TrendingTermsProps) {
  if (terms.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Termos em alta nestes Shorts</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Hashtags e tags que mais canais diferentes usaram, no idioma do país. Clique para buscar Shorts com o termo (usa 1 busca).
      </p>
      <div className="flex flex-wrap gap-2">
        {terms.map(({ term, channels }) => {
          const translation = translations[term];
          const showTranslation = translation && translation.toLowerCase() !== term;
          return (
            <button
              key={term}
              type="button"
              onClick={() => onSelect(term)}
              disabled={disabled}
              title={`Usado por ${channels} canais. Buscar Shorts com "${term}"`}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors hover:border-primary hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="font-medium">{term}</span>
              {showTranslation && <span className="text-muted-foreground">· {translation}</span>}
              <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">{channels}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
