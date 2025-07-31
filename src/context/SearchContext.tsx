
'use client';

import React, { createContext, useContext, useState } from 'react';
import type { Video } from '@/lib/data';
import type { SearchParams } from '@/lib/data';

interface SearchState {
  searchParams: SearchParams | null;
  videos: Video[];
  nextPageToken?: string;
  scrollPosition: number;
}

interface SearchContextType {
  searchState: SearchState;
  setSearchState: React.Dispatch<React.SetStateAction<SearchState>>;
  clearSearchState: () => void;
}

const initialSearchState: SearchState = {
  searchParams: null,
  videos: [],
  nextPageToken: undefined,
  scrollPosition: 0,
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchState, setSearchState] = useState<SearchState>(initialSearchState);

  const clearSearchState = () => {
    setSearchState(initialSearchState);
  };

  return (
    <SearchContext.Provider value={{ searchState, setSearchState, clearSearchState }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
