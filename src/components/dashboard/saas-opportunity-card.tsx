'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Lightbulb, Users, Zap } from 'lucide-react';

interface SaasOpportunityCardProps {
  opportunity: {
    title: string;
    problem: string;
    solution: string;
    mvpFeatures: string[];
    targetAudience: string;
    marketSegment: 'B2C' | 'B2B' | 'BOTH';
    painLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  };
  onGenerateSpec?: (opportunity: any) => void;
}

export function SaasOpportunityCard({ opportunity, onGenerateSpec }: SaasOpportunityCardProps) {
  const painLevelConfig = {
    CRITICAL: { color: 'bg-red-600', icon: AlertCircle, label: 'Crítico', textColor: 'text-red-700', borderColor: 'border-red-500' },
    HIGH: { color: 'bg-orange-500', icon: AlertCircle, label: 'Alto', textColor: 'text-orange-700', borderColor: 'border-orange-500' },
    MEDIUM: { color: 'bg-yellow-500', icon: AlertCircle, label: 'Médio', textColor: 'text-yellow-700', borderColor: 'border-yellow-500' },
    LOW: { color: 'bg-blue-500', icon: CheckCircle2, label: 'Baixo', textColor: 'text-blue-700', borderColor: 'border-blue-500' },
  };

  const segmentBadge = {
    'B2C': { label: 'B2C (Pessoa Física)', color: 'bg-purple-100 text-purple-800' },
    'B2B': { label: 'B2B (Empresas)', color: 'bg-indigo-100 text-indigo-800' },
    'BOTH': { label: 'B2B + B2C', color: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-900' },
  };

  const config = painLevelConfig[opportunity.painLevel];
  const segmentConfig = segmentBadge[opportunity.marketSegment];
  const PainIcon = config.icon;

  return (
    <Card className={`overflow-hidden border-l-4 ${config.borderColor} hover:shadow-xl transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <Badge className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Zap className="h-3 w-3 mr-1" />
            Micro SaaS
          </Badge>
          <Badge variant="outline" className={`${config.color} text-white border-none`}>
            <PainIcon className="h-3 w-3 mr-1" />
            Dor: {config.label}
          </Badge>
        </div>
        <CardTitle className="text-xl leading-tight">{opportunity.title}</CardTitle>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className={segmentConfig.color}>
            {segmentConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Problem Section */}
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm text-red-900 mb-1">Problema</h4>
              <p className="text-sm text-red-700">{opportunity.problem}</p>
            </div>
          </div>
        </div>

        {/* Solution Section */}
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm text-green-900 mb-1">Solução</h4>
              <p className="text-sm text-green-700">{opportunity.solution}</p>
            </div>
          </div>
        </div>

        {/* MVP Features */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold text-sm">Funcionalidades do MVP</h4>
          </div>
          <ul className="space-y-1 ml-6">
            {opportunity.mvpFeatures.map((feature, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Target Audience */}
        <div className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
          <Users className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-xs text-purple-900">Público-Alvo</h4>
            <p className="text-sm text-purple-700">{opportunity.targetAudience}</p>
          </div>
        </div>
      </CardContent>

      {onGenerateSpec && (
        <CardFooter className="pt-0">
          <Button
            onClick={() => onGenerateSpec(opportunity)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            size="sm"
          >
            <Zap className="mr-2 h-4 w-4" />
            Gerar Especificação Técnica
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
