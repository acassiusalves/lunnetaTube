"use client";

import { useState } from "react";
import { YouTubeLayout } from "@/components/youtube";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Copy, Eye, Code, Download } from "lucide-react";

interface SalesPageConfig {
  // Cabeçalho
  headline: string;
  subheadline: string;

  // Hero
  heroImage: string;
  ctaButtonText: string;
  ctaButtonLink: string;

  // Problema
  problemTitle: string;
  problemDescription: string;
  problemPoints: string[];

  // Solução
  solutionTitle: string;
  solutionDescription: string;
  solutionPoints: string[];

  // Benefícios
  benefitsTitle: string;
  benefits: Array<{ title: string; description: string; icon: string }>;

  // Depoimentos
  testimonialsTitle: string;
  testimonials: Array<{ name: string; text: string; role: string; image: string }>;

  // Preço
  priceTitle: string;
  originalPrice: string;
  currentPrice: string;
  priceDescription: string;

  // CTA Final
  finalCtaText: string;
  finalCtaButtonText: string;

  // Estilo
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

const defaultConfig: SalesPageConfig = {
  headline: "Transforme Sua Vida com Nosso Produto Revolucionário",
  subheadline: "Descubra o método comprovado que já ajudou milhares de pessoas a alcançar seus objetivos",
  heroImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
  ctaButtonText: "Quero Começar Agora",
  ctaButtonLink: "#preco",

  problemTitle: "Você Está Enfrentando Esses Desafios?",
  problemDescription: "Sabemos como é frustrante quando você...",
  problemPoints: [
    "Tenta de tudo mas não vê resultados",
    "Perde tempo com métodos que não funcionam",
    "Sente que está estagnado e não progride"
  ],

  solutionTitle: "A Solução Que Você Estava Procurando",
  solutionDescription: "Nosso método exclusivo vai te ajudar a...",
  solutionPoints: [
    "Alcançar resultados em tempo recorde",
    "Seguir um passo a passo comprovado",
    "Ter suporte completo durante toda jornada"
  ],

  benefitsTitle: "O Que Você Vai Conseguir",
  benefits: [
    { title: "Resultados Rápidos", description: "Veja mudanças nas primeiras semanas", icon: "⚡" },
    { title: "Método Comprovado", description: "Testado por milhares de pessoas", icon: "✓" },
    { title: "Suporte Total", description: "Tire suas dúvidas quando precisar", icon: "💬" }
  ],

  testimonialsTitle: "Veja o Que Nossos Clientes Dizem",
  testimonials: [
    {
      name: "Maria Silva",
      text: "Simplesmente incrível! Consegui resultados que nunca imaginei em apenas 30 dias.",
      role: "Empresária",
      image: "https://i.pravatar.cc/150?img=1"
    },
    {
      name: "João Santos",
      text: "O melhor investimento que já fiz. Recomendo para todos!",
      role: "Freelancer",
      image: "https://i.pravatar.cc/150?img=12"
    }
  ],

  priceTitle: "Oferta Especial Por Tempo Limitado",
  originalPrice: "R$ 997,00",
  currentPrice: "R$ 497,00",
  priceDescription: "Parcelado em até 12x no cartão",

  finalCtaText: "Não perca essa oportunidade única de transformar sua vida!",
  finalCtaButtonText: "Sim, Eu Quero Garantir Minha Vaga",

  primaryColor: "#FF6B00",
  secondaryColor: "#0f0f0f",
  fontFamily: "Inter, sans-serif"
};

export default function SalesPageBuilder() {
  const { toast } = useToast();
  const [config, setConfig] = useState<SalesPageConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState("editor");

  const updateConfig = (field: keyof SalesPageConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field: keyof SalesPageConfig, index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: keyof SalesPageConfig) => {
    setConfig(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), ""]
    }));
  };

  const generateHTML = () => {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.headline}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ${config.fontFamily};
            line-height: 1.6;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .hero {
            background: linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%);
            color: white;
            padding: 80px 20px;
            text-align: center;
        }

        .hero h1 {
            font-size: 3rem;
            margin-bottom: 20px;
            font-weight: 700;
        }

        .hero p {
            font-size: 1.5rem;
            margin-bottom: 40px;
            opacity: 0.9;
        }

        .hero img {
            max-width: 600px;
            width: 100%;
            border-radius: 10px;
            margin: 40px 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .cta-button {
            background: white;
            color: ${config.primaryColor};
            padding: 20px 50px;
            font-size: 1.3rem;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            font-weight: 700;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.3s, box-shadow 0.3s;
        }

        .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        .section {
            padding: 80px 20px;
        }

        .section-title {
            font-size: 2.5rem;
            text-align: center;
            margin-bottom: 50px;
            color: ${config.secondaryColor};
        }

        .problem-section {
            background: #f9f9f9;
        }

        .problem-points, .solution-points {
            max-width: 800px;
            margin: 0 auto;
        }

        .point {
            padding: 20px;
            margin: 15px 0;
            background: white;
            border-left: 4px solid ${config.primaryColor};
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .benefits-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 50px;
        }

        .benefit-card {
            background: white;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }

        .benefit-card:hover {
            transform: translateY(-10px);
        }

        .benefit-icon {
            font-size: 3rem;
            margin-bottom: 20px;
        }

        .benefit-title {
            font-size: 1.5rem;
            margin-bottom: 15px;
            color: ${config.primaryColor};
        }

        .testimonials-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-top: 50px;
        }

        .testimonial-card {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .testimonial-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }

        .testimonial-image {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            margin-right: 15px;
        }

        .testimonial-name {
            font-weight: 700;
            color: ${config.secondaryColor};
        }

        .testimonial-role {
            color: #666;
            font-size: 0.9rem;
        }

        .price-section {
            background: linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%);
            color: white;
            text-align: center;
        }

        .price-box {
            max-width: 500px;
            margin: 40px auto;
            background: white;
            color: ${config.secondaryColor};
            padding: 50px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .original-price {
            text-decoration: line-through;
            color: #999;
            font-size: 1.5rem;
        }

        .current-price {
            font-size: 3.5rem;
            color: ${config.primaryColor};
            font-weight: 700;
            margin: 20px 0;
        }

        .final-cta {
            background: ${config.secondaryColor};
            color: white;
            text-align: center;
            padding: 80px 20px;
        }

        .final-cta h2 {
            font-size: 2rem;
            margin-bottom: 30px;
        }

        .final-cta .cta-button {
            background: ${config.primaryColor};
            color: white;
        }

        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2rem;
            }

            .hero p {
                font-size: 1.2rem;
            }

            .section-title {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <h1>${config.headline}</h1>
            <p>${config.subheadline}</p>
            <img src="${config.heroImage}" alt="Hero Image">
            <br><br>
            <a href="${config.ctaButtonLink}" class="cta-button">${config.ctaButtonText}</a>
        </div>
    </section>

    <!-- Problem Section -->
    <section class="section problem-section">
        <div class="container">
            <h2 class="section-title">${config.problemTitle}</h2>
            <p style="text-align: center; font-size: 1.2rem; margin-bottom: 40px;">${config.problemDescription}</p>
            <div class="problem-points">
                ${config.problemPoints.map(point => `<div class="point">❌ ${point}</div>`).join('\n                ')}
            </div>
        </div>
    </section>

    <!-- Solution Section -->
    <section class="section">
        <div class="container">
            <h2 class="section-title">${config.solutionTitle}</h2>
            <p style="text-align: center; font-size: 1.2rem; margin-bottom: 40px;">${config.solutionDescription}</p>
            <div class="solution-points">
                ${config.solutionPoints.map(point => `<div class="point">✅ ${point}</div>`).join('\n                ')}
            </div>
        </div>
    </section>

    <!-- Benefits Section -->
    <section class="section" style="background: #f9f9f9;">
        <div class="container">
            <h2 class="section-title">${config.benefitsTitle}</h2>
            <div class="benefits-grid">
                ${config.benefits.map(benefit => `
                <div class="benefit-card">
                    <div class="benefit-icon">${benefit.icon}</div>
                    <h3 class="benefit-title">${benefit.title}</h3>
                    <p>${benefit.description}</p>
                </div>`).join('\n                ')}
            </div>
        </div>
    </section>

    <!-- Testimonials Section -->
    <section class="section">
        <div class="container">
            <h2 class="section-title">${config.testimonialsTitle}</h2>
            <div class="testimonials-grid">
                ${config.testimonials.map(testimonial => `
                <div class="testimonial-card">
                    <div class="testimonial-header">
                        <img src="${testimonial.image}" alt="${testimonial.name}" class="testimonial-image">
                        <div>
                            <div class="testimonial-name">${testimonial.name}</div>
                            <div class="testimonial-role">${testimonial.role}</div>
                        </div>
                    </div>
                    <p>"${testimonial.text}"</p>
                </div>`).join('\n                ')}
            </div>
        </div>
    </section>

    <!-- Price Section -->
    <section class="section price-section" id="preco">
        <div class="container">
            <h2 class="section-title" style="color: white;">${config.priceTitle}</h2>
            <div class="price-box">
                <div class="original-price">${config.originalPrice}</div>
                <div class="current-price">${config.currentPrice}</div>
                <p>${config.priceDescription}</p>
                <br>
                <a href="${config.ctaButtonLink}" class="cta-button">${config.ctaButtonText}</a>
            </div>
        </div>
    </section>

    <!-- Final CTA Section -->
    <section class="final-cta">
        <div class="container">
            <h2>${config.finalCtaText}</h2>
            <a href="${config.ctaButtonLink}" class="cta-button">${config.finalCtaButtonText}</a>
        </div>
    </section>
</body>
</html>`;
  };

  const copyToClipboard = () => {
    const html = generateHTML();
    navigator.clipboard.writeText(html);
    toast({
      title: "HTML copiado!",
      description: "O código HTML foi copiado para a área de transferência"
    });
  };

  const downloadHTML = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pagina-de-vendas.html';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Download iniciado!",
      description: "O arquivo HTML está sendo baixado"
    });
  };

  return (
    <YouTubeLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Criador de Página de Vendas</h1>
          <p className="text-muted-foreground">
            Crie uma página de vendas profissional e copie o código HTML completo
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor">
              <Code className="w-4 h-4 mr-2" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code">
              <Download className="w-4 h-4 mr-2" />
              Código HTML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cabeçalho e Hero</CardTitle>
                <CardDescription>Configure o topo da sua página de vendas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="headline">Título Principal</Label>
                  <Input
                    id="headline"
                    value={config.headline}
                    onChange={(e) => updateConfig('headline', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="subheadline">Subtítulo</Label>
                  <Input
                    id="subheadline"
                    value={config.subheadline}
                    onChange={(e) => updateConfig('subheadline', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="heroImage">URL da Imagem Hero</Label>
                  <Input
                    id="heroImage"
                    value={config.heroImage}
                    onChange={(e) => updateConfig('heroImage', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="ctaButtonText">Texto do Botão CTA</Label>
                  <Input
                    id="ctaButtonText"
                    value={config.ctaButtonText}
                    onChange={(e) => updateConfig('ctaButtonText', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ctaButtonLink">Link do Botão CTA</Label>
                  <Input
                    id="ctaButtonLink"
                    value={config.ctaButtonLink}
                    onChange={(e) => updateConfig('ctaButtonLink', e.target.value)}
                    placeholder="#preco ou https://..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seção de Problema</CardTitle>
                <CardDescription>Mostre os problemas que seu produto resolve</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="problemTitle">Título da Seção</Label>
                  <Input
                    id="problemTitle"
                    value={config.problemTitle}
                    onChange={(e) => updateConfig('problemTitle', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="problemDescription">Descrição</Label>
                  <Textarea
                    id="problemDescription"
                    value={config.problemDescription}
                    onChange={(e) => updateConfig('problemDescription', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Pontos do Problema</Label>
                  {config.problemPoints.map((point, index) => (
                    <Input
                      key={index}
                      value={point}
                      onChange={(e) => updateArrayField('problemPoints', index, e.target.value)}
                      className="mt-2"
                      placeholder={`Problema ${index + 1}`}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => addArrayItem('problemPoints')}
                  >
                    + Adicionar Problema
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seção de Solução</CardTitle>
                <CardDescription>Apresente sua solução</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="solutionTitle">Título da Seção</Label>
                  <Input
                    id="solutionTitle"
                    value={config.solutionTitle}
                    onChange={(e) => updateConfig('solutionTitle', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="solutionDescription">Descrição</Label>
                  <Textarea
                    id="solutionDescription"
                    value={config.solutionDescription}
                    onChange={(e) => updateConfig('solutionDescription', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Pontos da Solução</Label>
                  {config.solutionPoints.map((point, index) => (
                    <Input
                      key={index}
                      value={point}
                      onChange={(e) => updateArrayField('solutionPoints', index, e.target.value)}
                      className="mt-2"
                      placeholder={`Solução ${index + 1}`}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => addArrayItem('solutionPoints')}
                  >
                    + Adicionar Solução
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preço</CardTitle>
                <CardDescription>Configure o preço do seu produto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="priceTitle">Título da Seção de Preço</Label>
                  <Input
                    id="priceTitle"
                    value={config.priceTitle}
                    onChange={(e) => updateConfig('priceTitle', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="originalPrice">Preço Original</Label>
                    <Input
                      id="originalPrice"
                      value={config.originalPrice}
                      onChange={(e) => updateConfig('originalPrice', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentPrice">Preço Atual</Label>
                    <Input
                      id="currentPrice"
                      value={config.currentPrice}
                      onChange={(e) => updateConfig('currentPrice', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="priceDescription">Descrição do Preço</Label>
                  <Input
                    id="priceDescription"
                    value={config.priceDescription}
                    onChange={(e) => updateConfig('priceDescription', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cores e Estilo</CardTitle>
                <CardDescription>Personalize as cores da sua página</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => updateConfig('primaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={config.primaryColor}
                        onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={config.secondaryColor}
                        onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={config.secondaryColor}
                        onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Preview da Página de Vendas</CardTitle>
                <CardDescription>Veja como sua página ficará</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={generateHTML()}
                    className="w-full h-[600px]"
                    title="Preview"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code">
            <Card>
              <CardHeader>
                <CardTitle>Código HTML</CardTitle>
                <CardDescription>Copie o código abaixo e publique onde quiser</CardDescription>
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Código
                  </Button>
                  <Button onClick={downloadHTML} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar HTML
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-[500px] text-sm">
                  <code>{generateHTML()}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </YouTubeLayout>
  );
}
