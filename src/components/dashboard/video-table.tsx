
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
  } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import type { Video } from "@/lib/data";
import {
  ArrowDown,
  ArrowUp,
  Clapperboard,
  MoreVertical,
  Sparkles,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Tag,
  Loader2,
  Clock,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar } from "../ui/avatar";

export interface SortConfig {
  key: keyof Video | null;
  direction: "ascending" | "descending";
}
interface VideoTableProps {
  videos: Video[];
  onFetchComments: (videoId: string) => void;
  isLoadingComments: boolean;
  loadingCommentVideoId?: string | null;
  sortConfig: SortConfig;
  onSort: (key: keyof Video) => void;
  isTranslationEnabled?: boolean;
  translations?: Record<string, string>;
}

const Comment = ({ text, originalText, showOriginal }: { text: string; originalText?: string; showOriginal?: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const maxLength = 400;
    const isLongComment = text.length > maxLength;

    const toggleExpanded = () => setIsExpanded(!isExpanded);

    const displayedText = isLongComment && !isExpanded
      ? `${text.substring(0, maxLength)}...`
      : text;

    return (
      <div className="text-muted-foreground whitespace-pre-wrap break-words max-w-full">
        <p>{displayedText}</p>
        {isLongComment && (
          <button
            onClick={toggleExpanded}
            className="text-primary text-xs font-semibold hover:underline mt-1"
          >
            {isExpanded ? "Ver menos" : "Ver mais"}
          </button>
        )}
        {showOriginal && originalText && originalText !== text && (
          <p className="text-[10px] italic text-muted-foreground/70 mt-1">
            Original: {originalText.length > 100 ? originalText.substring(0, 100) + '...' : originalText}
          </p>
        )}
      </div>
    );
};
  
const TruncatedText = ({ text, maxLength, asLink, href }: { text: string; maxLength: number, asLink?: boolean, href?: string }) => {
    if (text.length <= maxLength) {
        return asLink ? <Link href={href!} target="_blank" rel="noopener noreferrer" className="hover:underline"><p className="font-medium leading-tight">{text}</p></Link> : <span className="truncate">{text}</span>;
    }

    const truncatedText = `${text.substring(0, maxLength)}...`;

    const content = asLink ? 
        <Link href={href!} target="_blank" rel="noopener noreferrer" className="hover:underline"><p className="font-medium leading-tight">{truncatedText}</p></Link> : 
        <span className="truncate">{truncatedText}</span>

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {content}
            </TooltipTrigger>
            <TooltipContent>
                <p className="max-w-xs">{text}</p>
            </TooltipContent>
        </Tooltip>
    );
};

export function VideoTable({
  videos,
  onFetchComments,
  isLoadingComments,
  loadingCommentVideoId,
  sortConfig,
  onSort,
  isTranslationEnabled = false,
  translations = {},
}: VideoTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Helper para obter título traduzido ou original
  const getDisplayTitle = (video: Video) => {
    if (isTranslationEnabled && translations[`title_${video.id}`]) {
      return translations[`title_${video.id}`];
    }
    return video.title;
  };

  // Helper para obter comentário traduzido ou original
  const getDisplayComment = (videoId: string, commentIndex: number, originalText: string, type?: 'q' | 'm') => {
    const key = type
      ? `comment_${videoId}_${type}_${commentIndex}`
      : `comment_${videoId}_${commentIndex}`;
    if (isTranslationEnabled && translations[key]) {
      return translations[key];
    }
    return originalText;
  };

  const toggleRowExpansion = (videoId: string) => {
    const newExpandedRow = expandedRow === videoId ? null : videoId;
    setExpandedRow(newExpandedRow);
    const video = videos.find(v => v.id === videoId);
    const hasComments = video?.commentsData && video.commentsData.length > 0;

    if (newExpandedRow && !hasComments) {
      onFetchComments(videoId);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("pt-BR", {
      notation: "standard",
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || !dateString.includes('-')) return "N/A";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const SortableHeader = ({
    columnKey,
    children,
    className,
  }: {
    columnKey: keyof Video;
    children: React.ReactNode;
    className?: string;
  }) => {
    const isSorted = sortConfig.key === columnKey;
    const Icon = isSorted
      ? sortConfig.direction === "ascending"
        ? ArrowUp
        : ArrowDown
      : ArrowUpDown;

    return (
      <TableHead
        className={`cursor-pointer ${className}`}
        onClick={() => onSort(columnKey)}
      >
        <div className="flex items-center gap-1">
          {children} <Icon className="h-3 w-3" />
        </div>
      </TableHead>
    );
  };

  const ShortsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><g fill="none"><rect width="256" height="256" fill="#F0F" rx="60"/><path fill="#FF0000" d="M164.38 228.38a16 16 0 0 1-15.06-1.63L78.15 178a32 32 0 0 1-16.15-27.63v-48.74a32 32 0 0 1 16.15-27.63l71.17-48.74a16 16 0 0 1 23.44 14.63v128.74a16 16 0 0 1-8.38 14.25Z"/><path fill="#FFF" d="m151.05 142.01l-43-24.8a12 12 0 0 1 0-20.76l43-24.81c11.4-6.58 25.95 2.04 25.95 15.38v49.61c0 13.34-14.55 21.96-25.95 15.38Z"/></g></svg>
  );

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[500px] min-w-[500px]">Título</TableHead>
            <SortableHeader columnKey="infoproductScore">
              <Tooltip>
                <TooltipTrigger>Score</TooltipTrigger>
                <TooltipContent>Score de Oportunidade de Infoproduto (0-100)</TooltipContent>
              </Tooltip>
            </SortableHeader>
            <SortableHeader columnKey="sourceCountry">País</SortableHeader>
            <SortableHeader columnKey="views">Visualizações</SortableHeader>
            <SortableHeader columnKey="likes">Likes</SortableHeader>
            <SortableHeader columnKey="comments">Comentários</SortableHeader>
            <SortableHeader columnKey="engagementRate">
              <Tooltip>
                <TooltipTrigger>Engaj.</TooltipTrigger>
                <TooltipContent>Taxa de Engajamento (por 1000 views)</TooltipContent>
              </Tooltip>
            </SortableHeader>
            <SortableHeader columnKey="viewsPerDay">
              <Tooltip>
                <TooltipTrigger>Views/dia</TooltipTrigger>
                <TooltipContent>Visualizações por dia desde publicação</TooltipContent>
              </Tooltip>
            </SortableHeader>
            <SortableHeader columnKey="publishedAt">Data</SortableHeader>
            <TableHead className="w-[100px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <React.Fragment key={video.id}>
              <TableRow className={
                video.infoproductScore && video.infoproductScore >= 80
                  ? 'bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50/50 border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow'
                  : video.infoproductScore && video.infoproductScore >= 65
                  ? 'bg-gradient-to-r from-soft-green-50 via-soft-green-50/70 to-white border-l-4 border-l-soft-green-400 hover:shadow-md transition-shadow'
                  : 'hover:bg-gray-50/50 transition-colors'
              }>
                <TableCell>
                  <div className="flex items-start gap-4">
                    <Link
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block h-[68px] w-[120px] flex-shrink-0 overflow-hidden rounded-md"
                    >
                      <img
                        src={video.snippet.thumbnails.high.url}
                        alt={video.title}
                        className="h-full w-full object-cover"
                        data-ai-hint={video.dataAiHint}
                      />
                    </Link>
                    <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <div className="flex flex-col">
                            <TruncatedText text={getDisplayTitle(video)} maxLength={60} asLink href={video.videoUrl} />
                            {isTranslationEnabled && translations[`title_${video.id}`] && (
                              <span className="text-[10px] text-muted-foreground italic mt-0.5">
                                Original: {video.title.length > 40 ? video.title.substring(0, 40) + '...' : video.title}
                              </span>
                            )}
                          </div>
                          {video.infoproductScore && video.infoproductScore >= 80 && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-bold rounded-full">
                              🏆 OURO
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Clapperboard className="h-4 w-4 text-gray-500" />
                                <span>{video.channel}</span>
                                {video.channelStats && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className="text-[10px] text-primary">({formatNumber(video.channelStats.subscriberCount)} subs)</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        <p><strong>Inscritos:</strong> {formatNumber(video.channelStats.subscriberCount)}</p>
                                        <p><strong>Total de vídeos:</strong> {formatNumber(video.channelStats.videoCount)}</p>
                                        <p><strong>Média de views:</strong> {formatNumber(Math.round(video.channelStats.avgViewsPerVideo))}</p>
                                        {video.channelPerformanceRatio && (
                                          <p><strong>Performance:</strong> {video.channelPerformanceRatio.toFixed(1)}x a média</p>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>{video.duration}</span>
                            </div>
                            {video.tags && video.tags.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Tag className="h-4 w-4 text-gray-500" />
                                <TruncatedText text={video.tags.join(', ')} maxLength={50} />
                            </div>
                            )}
                            {video.isShort && (
                            <div className="flex items-center gap-1.5">
                                <ShortsIcon />
                                <span className="font-semibold">Shorts</span>
                            </div>
                            )}
                             {video.hasHighPotential && (
                                <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                    <Sparkles className="h-3 w-3" />
                                    <span>Alto Potencial</span>
                                </div>
                            )}
                        </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {video.infoproductScore !== undefined ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full font-bold text-sm shadow-sm hover:shadow-md transition-all ${
                          video.infoproductScore >= 80 ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white' :
                          video.infoproductScore >= 65 ? 'bg-gradient-to-r from-soft-green-400 to-soft-green-500 text-white' :
                          video.infoproductScore >= 50 ? 'bg-gradient-to-r from-soft-blue-400 to-soft-blue-500 text-white' :
                          video.infoproductScore >= 30 ? 'bg-gray-200 text-gray-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {video.infoproductScore}
                          {video.infoproductScore >= 80 && <span className="ml-1">🏆</span>}
                          {video.infoproductScore >= 65 && video.infoproductScore < 80 && <span className="ml-1">⭐</span>}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1 text-xs">
                          <p className="font-bold">
                            {video.infoproductScore >= 80 ? '🏆 OPORTUNIDADE DE OURO!' :
                             video.infoproductScore >= 65 ? '⭐ Excelente oportunidade' :
                             video.infoproductScore >= 50 ? 'Boa oportunidade' :
                             video.infoproductScore >= 30 ? 'Oportunidade média' :
                             'Oportunidade baixa'}
                          </p>
                          <p className="text-muted-foreground">Clique nos comentários para calcular o score</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-xs text-muted-foreground">-</div>
                      </TooltipTrigger>
                      <TooltipContent>
                        Busque os comentários para calcular o score
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {video.sourceCountry ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-lg">{video.sourceCountryFlag}</span>
                      <span className="text-xs font-medium text-muted-foreground">{video.sourceCountry}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(video.views)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(video.likes)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <div className="flex items-center justify-end gap-2">
                    <span>{formatNumber(video.comments)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleRowExpansion(video.id)}
                    >
                      {expandedRow === video.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="sr-only">Ver comentários</span>
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <Tooltip>
                    <TooltipTrigger>
                      {video.engagementRate !== undefined ? video.engagementRate.toFixed(2) : '-'}
                    </TooltipTrigger>
                    <TooltipContent>
                      {video.engagementRate !== undefined
                        ? `${video.engagementRate.toFixed(2)} engajamentos por 1000 views`
                        : 'Dados não disponíveis'}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <Tooltip>
                    <TooltipTrigger>
                      {video.viewsPerDay !== undefined ? formatNumber(Math.round(video.viewsPerDay)) : '-'}
                    </TooltipTrigger>
                    <TooltipContent>
                      {video.viewsPerDay !== undefined
                        ? `${formatNumber(Math.round(video.viewsPerDay))} views por dia`
                        : 'Dados não disponíveis'}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatDate(video.publishedAt)}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Mais ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem asChild>
                            <Link href={`/analyze/${video.id}`}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                <span>Analisar Conteúdo</span>
                            </Link>
                       </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              {expandedRow === video.id && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <div className="space-y-4">
                      {/* Análise de Comentários */}
                      {video.commentAnalysis && (
                        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-primary" />
                              Análise de Oportunidade de Infoproduto
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="text-center p-4 bg-gradient-to-br from-soft-blue-50 to-white rounded-lg border border-soft-blue-200 shadow-sm">
                                <div className="text-3xl font-bold text-soft-blue-600">{video.commentAnalysis.questionsCount}</div>
                                <div className="text-xs text-muted-foreground mt-1 font-medium">Perguntas</div>
                                <div className="text-xs font-semibold text-soft-blue-600 mt-0.5">{video.commentAnalysis.questionDensity.toFixed(1)}%</div>
                              </div>
                              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-200 shadow-sm">
                                <div className="text-3xl font-bold text-orange-600">{video.commentAnalysis.materialRequestsCount}</div>
                                <div className="text-xs text-muted-foreground mt-1 font-medium">Pedidos de Material</div>
                                <div className="text-xs font-semibold text-orange-600 mt-0.5">{video.commentAnalysis.materialRequestDensity.toFixed(1)}%</div>
                              </div>
                              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-white rounded-lg border border-red-200 shadow-sm">
                                <div className="text-3xl font-bold text-red-600">{video.commentAnalysis.problemStatementsCount}</div>
                                <div className="text-xs text-muted-foreground mt-1 font-medium">Problemas/Dificuldades</div>
                              </div>
                              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-white rounded-lg border border-yellow-200 shadow-sm">
                                <div className="text-3xl font-bold text-yellow-600">{video.commentAnalysis.unansweredQuestionsCount}</div>
                                <div className="text-xs text-muted-foreground mt-1 font-medium">Perguntas Não Respondidas</div>
                              </div>
                            </div>

                            {/* Top Pedidos de Material */}
                            {video.commentAnalysis.topMaterialRequests.length > 0 && (
                              <div className="mt-4 p-4 bg-gradient-to-br from-orange-50 to-orange-50/30 rounded-lg border border-orange-200 shadow-sm">
                                <h4 className="text-sm font-semibold mb-3 text-orange-900 flex items-center gap-2">
                                  <span className="text-base">🎯</span>
                                  Top Pedidos de Material ({video.commentAnalysis.topMaterialRequests.length})
                                </h4>
                                <div className="space-y-2">
                                  {video.commentAnalysis.topMaterialRequests.slice(0, 3).map((comment, idx) => {
                                    const displayText = getDisplayComment(video.id, idx, comment.text, 'm');
                                    return (
                                      <div key={idx} className="text-xs bg-white p-3 rounded border border-orange-100 hover:shadow-sm transition-shadow">
                                        <span className="font-semibold text-gray-900">{comment.author}:</span>
                                        <span className="ml-1 text-gray-700">{displayText.substring(0, 150)}{displayText.length > 150 ? '...' : ''}</span>
                                        {comment.materialType && (
                                          <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-[10px] font-medium">
                                            {comment.materialType}
                                          </span>
                                        )}
                                        {isTranslationEnabled && translations[`comment_${video.id}_m_${idx}`] && (
                                          <div className="mt-1 text-[10px] text-muted-foreground italic">
                                            Original: {comment.text.substring(0, 80)}{comment.text.length > 80 ? '...' : ''}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Top Perguntas */}
                            {video.commentAnalysis.topQuestions.length > 0 && (
                              <div className="mt-4 p-4 bg-gradient-to-br from-soft-blue-50 to-soft-blue-50/30 rounded-lg border border-soft-blue-200 shadow-sm">
                                <h4 className="text-sm font-semibold mb-3 text-soft-blue-900 flex items-center gap-2">
                                  <span className="text-base">❓</span>
                                  Top Perguntas ({video.commentAnalysis.topQuestions.length})
                                </h4>
                                <div className="space-y-2">
                                  {video.commentAnalysis.topQuestions.slice(0, 3).map((comment, idx) => {
                                    const displayText = getDisplayComment(video.id, idx, comment.text, 'q');
                                    return (
                                      <div key={idx} className="text-xs bg-white p-3 rounded border border-soft-blue-100 hover:shadow-sm transition-shadow">
                                        <span className="font-semibold text-gray-900">{comment.author}:</span>
                                        <span className="ml-1 text-gray-700">{displayText.substring(0, 150)}{displayText.length > 150 ? '...' : ''}</span>
                                        {comment.questionType && (
                                          <span className="ml-2 px-2 py-0.5 bg-soft-blue-100 text-soft-blue-800 rounded text-[10px] font-medium">
                                            {comment.questionType}
                                          </span>
                                        )}
                                        {isTranslationEnabled && translations[`comment_${video.id}_q_${idx}`] && (
                                          <div className="mt-1 text-[10px] text-muted-foreground italic">
                                            Original: {comment.text.substring(0, 80)}{comment.text.length > 80 ? '...' : ''}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Todos os Comentários */}
                      <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle className="text-base">Comentários Relevantes ({video.commentsData.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingCommentVideoId === video.id && video.commentsData.length === 0 ? (
                              <div className="flex items-center justify-center p-4">
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                          ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              {video.commentsData && video.commentsData.length > 0 ? (
                                video.commentsData.map((comment, index) => {
                                  const displayText = getDisplayComment(video.id, index, comment.text);
                                  return (
                                    <div key={index} className="flex items-start gap-3 text-sm">
                                      <Avatar className="h-8 w-8 border">
                                        <img src={comment.authorImageUrl} alt={comment.author} data-ai-hint="user avatar" className="h-full w-full rounded-full object-cover" />
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="font-semibold text-gray-900">{comment.author}</p>
                                          {comment.isQuestion && <span className="px-2 py-0.5 bg-soft-blue-100 text-soft-blue-800 rounded text-[10px] font-medium">pergunta</span>}
                                          {comment.isMaterialRequest && <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-[10px] font-medium">pedido</span>}
                                          {comment.isProblemStatement && <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-medium">problema</span>}
                                        </div>
                                        <Comment
                                          text={displayText}
                                          originalText={comment.text}
                                          showOriginal={isTranslationEnabled && translations[`comment_${video.id}_${index}`] !== undefined}
                                        />
                                        {comment.likeCount && comment.likeCount > 0 && (
                                          <p className="text-xs text-muted-foreground mt-1">👍 {comment.likeCount}</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                  <p className="text-sm text-center text-muted-foreground">Nenhum comentário para exibir ou comentários desativados.</p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
