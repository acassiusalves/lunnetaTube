/**
 * Analisa comentários para identificar oportunidades de infoprodutos
 */

import type { CommentData, CommentAnalysis } from '@/lib/data';

// Padrões para identificar perguntas
const QUESTION_PATTERNS = {
  howTo: [
    /como\s+(fazer|faz|faço|posso|consigo|eu)/i,
    /qual\s+(o|a)\s+(melhor\s+)?forma\s+de/i,
    /como\s+eu\s+(posso|consigo)/i,
    /pode\s+(me\s+)?ensinar/i,
    /tem\s+(algum\s+)?tutorial/i,
    /explica\s+como/i,
  ],
  whatIs: [
    /o\s+que\s+(é|e|significa)/i,
    /qual\s+(é|e)\s+(o|a)/i,
    /quais\s+(são|sao)/i,
    /que\s+(tipo|tipos)/i,
  ],
  whereToFind: [
    /onde\s+(encontro|encontrar|acho|consigo|baixo|compro)/i,
    /tem\s+(o\s+)?link/i,
    /disponível\s+onde/i,
    /de\s+onde/i,
  ],
  general: [
    /\?$/,
    /^(por\s+que|porque|quando|quanto)/i,
  ],
};

// Padrões para identificar pedidos de material
const MATERIAL_REQUEST_PATTERNS = {
  planilha: [
    /planilha/i,
    /excel/i,
    /spreadsheet/i,
    /google\s+sheets/i,
  ],
  ebook: [
    /e-?book/i,
    /pdf/i,
    /livro/i,
    /material\s+(escrito|digital)/i,
  ],
  template: [
    /template/i,
    /modelo/i,
    /exemplo/i,
  ],
  checklist: [
    /checklist/i,
    /check-list/i,
    /lista\s+de\s+verificação/i,
  ],
  lista: [
    /lista/i,
  ],
  receita: [
    /receita/i,
    /passo\s+a\s+passo/i,
    /roteiro/i,
  ],
  curso: [
    /curso/i,
    /aula/i,
    /treinamento/i,
  ],
  general: [
    /material/i,
    /conteúdo/i,
    /download/i,
    /baixar/i,
    /disponibiliza/i,
    /compartilha/i,
  ],
};

// Padrões para identificar declarações de problemas
const PROBLEM_PATTERNS = [
  /não\s+(consigo|sei|entendo|compreendo)/i,
  /tenho\s+(dificuldade|problema|dúvida)/i,
  /estou\s+(tentando|com\s+dificuldade)/i,
  /(difícil|complicado|complexo)/i,
  /preciso\s+de\s+ajuda/i,
  /ajuda/i,
];

// Padrões para palavras de pedido
const REQUEST_WORDS = [
  /pode(ria)?\s+(fazer|criar|disponibilizar|compartilhar|enviar)/i,
  /faz\s+(um|uma)/i,
  /tem\s+(como|algum|alguma)/i,
  /gostaria\s+de/i,
  /quero/i,
  /preciso/i,
];

function detectQuestionType(text: string): 'how-to' | 'what-is' | 'where-to-find' | 'general' | null {
  if (QUESTION_PATTERNS.howTo.some(pattern => pattern.test(text))) return 'how-to';
  if (QUESTION_PATTERNS.whatIs.some(pattern => pattern.test(text))) return 'what-is';
  if (QUESTION_PATTERNS.whereToFind.some(pattern => pattern.test(text))) return 'where-to-find';
  if (QUESTION_PATTERNS.general.some(pattern => pattern.test(text))) return 'general';
  return null;
}

function detectMaterialType(text: string): 'planilha' | 'ebook' | 'template' | 'checklist' | 'lista' | 'receita' | 'curso' | 'general' | null {
  if (MATERIAL_REQUEST_PATTERNS.planilha.some(pattern => pattern.test(text))) return 'planilha';
  if (MATERIAL_REQUEST_PATTERNS.ebook.some(pattern => pattern.test(text))) return 'ebook';
  if (MATERIAL_REQUEST_PATTERNS.template.some(pattern => pattern.test(text))) return 'template';
  if (MATERIAL_REQUEST_PATTERNS.checklist.some(pattern => pattern.test(text))) return 'checklist';
  if (MATERIAL_REQUEST_PATTERNS.lista.some(pattern => pattern.test(text))) return 'lista';
  if (MATERIAL_REQUEST_PATTERNS.receita.some(pattern => pattern.test(text))) return 'receita';
  if (MATERIAL_REQUEST_PATTERNS.curso.some(pattern => pattern.test(text))) return 'curso';
  if (MATERIAL_REQUEST_PATTERNS.general.some(pattern => pattern.test(text))) return 'general';
  return null;
}

function isQuestion(text: string): boolean {
  return detectQuestionType(text) !== null;
}

function isMaterialRequest(text: string): boolean {
  const hasMaterial = detectMaterialType(text) !== null;
  const hasRequestWord = REQUEST_WORDS.some(pattern => pattern.test(text));
  return hasMaterial && hasRequestWord;
}

function isProblemStatement(text: string): boolean {
  return PROBLEM_PATTERNS.some(pattern => pattern.test(text));
}

export function analyzeComments(comments: CommentData[]): CommentAnalysis {
  const totalComments = comments.length;

  if (totalComments === 0) {
    return {
      totalComments: 0,
      questionsCount: 0,
      materialRequestsCount: 0,
      problemStatementsCount: 0,
      questionDensity: 0,
      materialRequestDensity: 0,
      topQuestions: [],
      topMaterialRequests: [],
      unansweredQuestionsCount: 0,
    };
  }

  // Analisar cada comentário
  const analyzedComments = comments.map(comment => ({
    ...comment,
    isQuestion: isQuestion(comment.text),
    isMaterialRequest: isMaterialRequest(comment.text),
    isProblemStatement: isProblemStatement(comment.text),
    questionType: detectQuestionType(comment.text) || undefined,
    materialType: detectMaterialType(comment.text) || undefined,
  }));

  const questionsCount = analyzedComments.filter(c => c.isQuestion).length;
  const materialRequestsCount = analyzedComments.filter(c => c.isMaterialRequest).length;
  const problemStatementsCount = analyzedComments.filter(c => c.isProblemStatement).length;

  // Pegar top perguntas (ordenadas por likes)
  const topQuestions = analyzedComments
    .filter(c => c.isQuestion)
    .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    .slice(0, 10);

  // Pegar top pedidos de material (ordenados por likes)
  const topMaterialRequests = analyzedComments
    .filter(c => c.isMaterialRequest)
    .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    .slice(0, 10);

  // Estimativa de perguntas não respondidas (heurística: perguntas com 0 likes ou poucas curtidas)
  const unansweredQuestionsCount = analyzedComments
    .filter(c => c.isQuestion && (c.likeCount || 0) === 0)
    .length;

  return {
    totalComments,
    questionsCount,
    materialRequestsCount,
    problemStatementsCount,
    questionDensity: (questionsCount / totalComments) * 100,
    materialRequestDensity: (materialRequestsCount / totalComments) * 100,
    topQuestions,
    topMaterialRequests,
    unansweredQuestionsCount,
  };
}
