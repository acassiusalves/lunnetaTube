'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchFiltersProps {
  onSearch: (filters: SearchFilterValues) => void;
  isLoading?: boolean;
}

export interface SearchFilterValues {
  keyword: string;
  country: string;
  minViews: string;
  publishedAfter: string;
  order: string;
  excludeShorts: boolean;
}

const countries = [
  { code: 'BR', name: 'Brasil' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'CA', name: 'Canadá' },
  { code: 'AU', name: 'Austrália' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'FR', name: 'França' },
  { code: 'JP', name: 'Japão' },
  { code: 'IN', name: 'Índia' },
];

const minViewsOptions = [
  { value: '', label: 'Todas as visualizações' },
  { value: '1000', label: '1.000+' },
  { value: '10000', label: '10.000+' },
  { value: '50000', label: '50.000+' },
  { value: '100000', label: '100.000+' },
  { value: '500000', label: '500.000+' },
  { value: '1000000', label: '1.000.000+' },
];

const dateOptions = [
  { value: '', label: 'Qualquer data' },
  { value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), label: 'Hoje' },
  { value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), label: 'Esta semana' },
  { value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), label: 'Este mês' },
  { value: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), label: 'Este ano' },
];

const orderOptions = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'date', label: 'Data de upload' },
  { value: 'viewCount', label: 'Contagem de visualizações' },
  { value: 'rating', label: 'Avaliação' },
];

export function SearchFilters({ onSearch, isLoading }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilterValues>({
    keyword: '',
    country: 'BR',
    minViews: '',
    publishedAfter: '',
    order: 'relevance',
    excludeShorts: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const updateFilter = (key: keyof SearchFilterValues, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-lg border border-[#f0f0f0] p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Search Field */}
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium text-[#0f0f0f] mb-2">
            Palavra-chave
          </label>
          <div className="relative">
            <input
              id="keyword"
              type="text"
              value={filters.keyword}
              onChange={(e) => updateFilter('keyword', e.target.value)}
              placeholder="Digite a palavra-chave para pesquisar vídeos..."
              className="w-full px-4 py-3 pr-12 text-base border border-[#f0f0f0] rounded-full focus:outline-none focus:border-[#FF6B00] focus:shadow-md transition-all"
              required
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Country Select */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-[#0f0f0f] mb-2">
              País
            </label>
            <select
              id="country"
              value={filters.country}
              onChange={(e) => updateFilter('country', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#f0f0f0] rounded-lg bg-white focus:outline-none focus:border-[#FF6B00] transition-colors"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Min Views Select */}
          <div>
            <label htmlFor="minViews" className="block text-sm font-medium text-[#0f0f0f] mb-2">
              Visualizações mínimas
            </label>
            <select
              id="minViews"
              value={filters.minViews}
              onChange={(e) => updateFilter('minViews', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#f0f0f0] rounded-lg bg-white focus:outline-none focus:border-[#FF6B00] transition-colors"
            >
              {minViewsOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Select */}
          <div>
            <label htmlFor="publishedAfter" className="block text-sm font-medium text-[#0f0f0f] mb-2">
              Data de publicação
            </label>
            <select
              id="publishedAfter"
              value={filters.publishedAfter}
              onChange={(e) => updateFilter('publishedAfter', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#f0f0f0] rounded-lg bg-white focus:outline-none focus:border-[#FF6B00] transition-colors"
            >
              {dateOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Order Select */}
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-[#0f0f0f] mb-2">
              Ordenar por
            </label>
            <select
              id="order"
              value={filters.order}
              onChange={(e) => updateFilter('order', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#f0f0f0] rounded-lg bg-white focus:outline-none focus:border-[#FF6B00] transition-colors"
            >
              {orderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exclude Shorts Checkbox */}
        <div className="flex items-center gap-2">
          <input
            id="excludeShorts"
            type="checkbox"
            checked={filters.excludeShorts}
            onChange={(e) => updateFilter('excludeShorts', e.target.checked)}
            className="w-4 h-4 text-[#ff0000] border-gray-300 rounded focus:ring-[#ff0000]"
          />
          <label htmlFor="excludeShorts" className="text-sm text-[#0f0f0f] cursor-pointer">
            Excluir Shorts
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full md:w-auto px-8 py-3 bg-[#FF6B00] text-white text-sm font-medium rounded-full hover:bg-[#E65A00] transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Pesquisando...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Pesquisar vídeos
            </>
          )}
        </button>
      </form>
    </div>
  );
}
