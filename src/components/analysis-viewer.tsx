
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { useProductBrief } from '@/context/ProductBriefContext';

interface AnalysisViewerProps {
  data: any;
  level?: number;
}

const renderValue = (value: any, key: string, level: number, openBriefDialog: (idea: any) => void) => {
  if (key === 'productIdeas' && Array.isArray(value)) {
    return (
      <div className="space-y-4">
        {value.map((idea, index) => (
          <Card key={index} className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex justify-between items-center">
                <span>{idea.title}</span>
                 <Button size="sm" onClick={() => openBriefDialog(idea)}>
                    Avançar
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{idea.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (typeof value === 'string') {
    return <p className="text-muted-foreground">{value}</p>;
  }

  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-1 pl-4">
        {value.map((item, index) => (
          <li key={`${key}-${index}`} className="text-muted-foreground">
            {typeof item === 'object' ? renderValue(item, `${key}-${index}`, level + 1, openBriefDialog) : String(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return <AnalysisViewer data={value} level={level + 1} />;
  }

  return <p>{String(value)}</p>;
};

export const AnalysisViewer: React.FC<AnalysisViewerProps> = ({ data, level = 0 }) => {
  const { openBriefDialog } = useProductBrief();

  if (typeof data !== 'object' || data === null) {
    return <p>Dados de análise inválidos.</p>;
  }

  const humanReadableKeys: { [key: string]: string } = {
    summary: 'Resumo',
    sentiment: 'Sentimento Geral',
    keyThemes: 'Principais Temas',
    productIdeas: 'Ideias de Produto',
  };

  const content = (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <h4 className="font-semibold text-foreground capitalize">{humanReadableKeys[key] || key}</h4>
          {renderValue(value, key, level, openBriefDialog)}
        </div>
      ))}
    </div>
  );

  if (level > 0) {
    return <div className="pl-4 border-l-2 border-muted-foreground/20">{content}</div>;
  }

  return content;
};
