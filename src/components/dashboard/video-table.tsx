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
import type { Video } from "@/lib/data";
import {
  ArrowDown,
  ArrowUp,
  Clapperboard,
  ExternalLink,
  MoreVertical,
  MessagesSquare,
  Sparkles,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar } from "../ui/avatar";

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
    <svg
      width="20"
      height="20"
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
    >
      <path
        fill="#FF0000"
        d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 444.9c14.3 19.4 46.2 19.4 60.5 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"
      ></path>
      <path
        fill="#FFFFFF"
        d="m412 654.5l234-142.9c12.7-7.7 12.7-25.2 0-32.9l-234-142.9c-12.2-7.4-27.4 1.8-27.4 16.4v285.8c0 14.6 15.2 23.8 27.4 16.5z"
      ></path>
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
                    <div className="space-y-1.5">
                       <Link
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        <p className="font-medium leading-tight">{video.title}</p>
                      </Link>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clapperboard className="h-4 w-4 text-gray-500" />
                          <span>{video.category}</span>
                        </div>
                        {video.tags && video.tags.length > 0 && (
                           <div className="flex items-center gap-1.5">
                             <Tag className="h-4 w-4 text-gray-500" />
                             <span className="truncate">{video.tags.slice(0, 5).join(', ')}</span>
                           </div>
                        )}
                        {video.isShort && (
                          <div className="flex items-center gap-1.5">
                            <ShortsIcon />
                            <span className="font-semibold">Shorts</span>
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
                                  <img src={comment.authorImageUrl} alt={comment.author} data-ai-hint="user avatar" className="h-full w-full rounded-full object-cover" />
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