
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProductIdea {
  title: string;
  description: string;
}

interface ProductBriefContextType {
  isBriefOpen: boolean;
  productIdea: ProductIdea | null;
  openBriefDialog: (idea: ProductIdea) => void;
  closeBriefDialog: () => void;
}

const ProductBriefContext = createContext<ProductBriefContextType | undefined>(undefined);

export const ProductBriefProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [productIdea, setProductIdea] = useState<ProductIdea | null>(null);

  const openBriefDialog = (idea: ProductIdea) => {
    setProductIdea(idea);
    setIsBriefOpen(true);
  };

  const closeBriefDialog = () => {
    setIsBriefOpen(false);
    setProductIdea(null);
  };

  return (
    <ProductBriefContext.Provider value={{ isBriefOpen, productIdea, openBriefDialog, closeBriefDialog }}>
      {children}
    </ProductBriefContext.Provider>
  );
};

export const useProductBrief = () => {
  const context = useContext(ProductBriefContext);
  if (context === undefined) {
    throw new Error('useProductBrief must be used within a ProductBriefProvider');
  }
  return context;
};
