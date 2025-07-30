
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface AnalysisViewerProps {
  data: any;
  level?: number;
}

const renderValue = (value: any, key: string, level: number) => {
  if (typeof value === 'string') {
    return <p className="text-muted-foreground">{value}</p>;
  }

  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-1 pl-4">
        {value.map((item, index) => (
          <li key={`${key}-${index}`} className="text-muted-foreground">
            {typeof item === 'object' ? renderValue(item, `${key}-${index}`, level + 1) : String(item)}
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
  if (typeof data !== 'object' || data === null) {
    return <p>Dados de análise inválidos.</p>;
  }

  const content = (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <h4 className="font-semibold text-foreground">{key}</h4>
          {renderValue(value, key, level)}
        </div>
      ))}
    </div>
  );

  if (level > 0) {
    return <div className="pl-4 border-l-2 border-muted-foreground/20">{content}</div>;
  }

  return content;
};
