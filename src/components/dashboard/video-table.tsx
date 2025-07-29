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
  }: {
    columnKey: keyof Video;
    children: React.ReactNode;
  }) => {
    const isSorted = sortConfig.key === columnKey;
    const Icon = isSorted
      ? sortConfig.direction === "ascending"
        ? ArrowUp
        : ArrowDown
      : ArrowUpDown;

    return (
      <TableHead
        className="cursor-pointer"
        onClick={() => onSort(columnKey)}
      >
        <div className="flex items-center gap-1">
          {children} <Icon className="h-3 w-3" />
        </div>
      </TableHead>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[450px]">Título</TableHead>
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
                      width={120}
                      height={68}
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
                          <PlaySquare className="h-3.5 w-3.5 text-red-500" />
                          <span className="font-semibold text-red-500">
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
  );
}
