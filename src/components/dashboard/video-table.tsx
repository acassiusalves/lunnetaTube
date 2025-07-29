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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Video } from "@/lib/data";
import {
  ArrowDown,
  ArrowUp,
  Clapperboard,
  Clock,
  ExternalLink,
  MoreVertical,
  PlaySquare,
  MessagesSquare,
  Sparkles,
  UserSquare,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export interface SortConfig {
  key: keyof Video | null;
  direction: "ascending" | "descending";
}
interface VideoTableProps {
  videos: Video[];
  onAnalyze: (video: Video, type: "content" | "comments") => void;
  sortConfig: SortConfig;
  onSort: (key: keyof Video) => void;
}

export function VideoTable({
  videos,
  onAnalyze,
  sortConfig,
  onSort,
}: VideoTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("pt-BR", {
      notation: "standard",
    }).format(num);
  };

  const formatDate = (dateString: string) => {
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-3.5 w-3.5 text-red-600"
    >
      <path d="M17.53,2.47a2.5,2.5,0,0,0-3.53,0L8.8,7.66a2.5,2.5,0,0,0,0,3.53l5.2,5.2a2.5,2.5,0,0,0,3.53,0l5.2-5.2a2.5,2.5,0,0,0,0-3.53ZM8.8,12.89,6.47,15.22a2.5,2.5,0,0,0,0,3.53l5.2,5.2a2.5,2.5,0,0,0,3.53,0L17.53,21.6a2.5,2.5,0,0,0,0-3.53Z" />
      <path d="M7.66,8.8,2.47,14a2.5,2.5,0,0,0,0,3.53L4.8,19.86A2.5,2.5,0,0,0,8.33,18.7l-0.7-0.7a2.51,2.51,0,0,0-3.54,0l-1.2,1.2a.51.51,0,0,1-.71,0l-1-1a.51.51,0,0,1,0-.71l5.2-5.2a.51.51,0,0,1,.71,0l1,1a.51.51,0,0,1,0,.71l-1.2,1.2a2.51,2.51,0,0,0,0,3.54l0.7.7A2.5,2.5,0,0,0,11.2,15.22l5.2-5.2a.5.5,0,0,1,.71,0l1,1a.5.5,0,0,1,0,.71l-1.2,1.2a2.51,2.51,0,0,0,0,3.54l0.7,0.7a2.5,2.5,0,0,0,3.53-1.16l2.33-2.33a2.5,2.5,0,0,0,0-3.53Z" />
    </svg>
  );

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[450px] min-w-[450px]">Título</TableHead>
            <SortableHeader columnKey="views">Visualizações</SortableHeader>
            <SortableHeader columnKey="likes">Likes</SortableHeader>
            <TableHead>Comentários</TableHead>
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
                    <div className="space-y-1">
                      <Link
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        <p className="font-medium leading-tight">{video.title}</p>
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clapperboard className="h-3 w-3" />
                          <span>{video.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserSquare className="h-3 w-3" />
                          <span>{video.channel}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{video.duration}</span>
                        </div>
                        {video.isShort && (
                          <div className="flex items-center gap-1">
                            <ShortsIcon />
                            <span className="font-semibold text-red-600">
                              Shorts
                            </span>
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
                      onClick={() =>
                        setExpandedRow(expandedRow === video.id ? null : video.id)
                      }
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
                      <DropdownMenuItem onClick={() => onAnalyze(video, "content")}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analisar Conteúdo
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onAnalyze(video, "comments")}
                      >
                        <MessagesSquare className="mr-2 h-4 w-4" />
                        Analisar Comentários
                      </DropdownMenuItem>
                      <Link
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Abrir no YouTube
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              {expandedRow === video.id && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Card className="bg-muted/50">
                      <CardHeader>
                          <CardTitle className="text-base">Comentários Relevantes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {video.commentsData && video.commentsData.length > 0 ? (
                            video.commentsData.map((comment, index) => (
                              <div key={index} className="flex items-start gap-3 text-sm">
                                <Avatar className="h-8 w-8 border">
                                  <AvatarImage src={comment.authorImageUrl} alt={comment.author} data-ai-hint="user avatar" />
                                  <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold">{comment.author}</p>
                                  <p className="text-muted-foreground">{comment.text}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                              <p className="text-sm text-muted-foreground">Nenhum comentário para exibir.</p>
                          )}
                        </div>
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
