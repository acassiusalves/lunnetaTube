
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
  sortConfig: SortConfig;
  onSort: (key: keyof Video) => void;
}

const Comment = ({ text }: { text: string }) => {
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
  sortConfig,
  onSort,
}: VideoTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRowExpansion = (videoId: string) => {
    const newExpandedRow = expandedRow === videoId ? null : videoId;
    setExpandedRow(newExpandedRow);
    if (newExpandedRow) {
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
            <SortableHeader columnKey="views">Visualizações</SortableHeader>
            <SortableHeader columnKey="likes">Likes</SortableHeader>
            <SortableHeader columnKey="comments">Comentários</SortableHeader>
            <SortableHeader columnKey="publishedAt">Data</SortableHeader>
            <TableHead className="w-[100px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <React.Fragment key={video.id}>
              <TableRow>
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
                        <TruncatedText text={video.title} maxLength={60} asLink href={video.videoUrl} />
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Clapperboard className="h-4 w-4 text-gray-500" />
                                <span>{video.category}</span>
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
                  <TableCell colSpan={6}>
                    <Card className="bg-muted/50">
                      <CardHeader>
                          <CardTitle className="text-base">Comentários Relevantes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingComments && video.commentsData.length === 0 ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                          <div className="space-y-4">
                            {video.commentsData && video.commentsData.length > 0 ? (
                              video.commentsData.map((comment, index) => (
                                <div key={index} className="flex items-start gap-3 text-sm">
                                  <Avatar className="h-8 w-8 border">
                                    <img src={comment.authorImageUrl} alt={comment.author} data-ai-hint="user avatar" className="h-full w-full rounded-full object-cover" />
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-semibold">{comment.author}</p>
                                    <Comment text={comment.text} />
                                  </div>
                                </div>
                              ))
                            ) : (
                                <p className="text-sm text-center text-muted-foreground">Nenhum comentário para exibir ou comentários desativados.</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
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
