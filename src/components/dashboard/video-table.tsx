"use client";

import Image from "next/image";
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
  ExternalLink,
  MoreVertical,
  PlaySquare,
  MessagesSquare
} from "lucide-react";

interface VideoTableProps {
  videos: Video[];
  onAnalyze: (video: Video, type: "content" | "comments") => void;
}

export function VideoTable({ videos, onAnalyze }: VideoTableProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("pt-BR", {
      notation: "standard",
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[450px]">Título</TableHead>
          <TableHead className="text-right">
            <div className="flex items-center justify-end gap-1">
              Visualizações <ArrowDown className="h-3 w-3" />
            </div>
          </TableHead>
          <TableHead className="text-right">Likes</TableHead>
          <TableHead className="text-right">Comentários</TableHead>
          <TableHead className="text-right">Duração</TableHead>
          <TableHead className="text-right">Data</TableHead>
          <TableHead className="w-[100px] text-center">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {videos.map((video) => (
          <TableRow key={video.id}>
            <TableCell>
              <div className="flex items-start gap-4">
                <Link href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                  {/* Usando a tag <img> padrão para garantir que a imagem apareça sem precisar reiniciar o servidor */}
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    width={120}
                    height={68}
                    className="rounded-md object-cover"
                    data-ai-hint={video.dataAiHint}
                  />
                </Link>
                <div className="space-y-1">
                   <Link href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    <p className="font-medium leading-tight">{video.title}</p>
                   </Link>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                       <Clapperboard className="h-3 w-3" />
                       <span>{video.category}</span>
                    </div>
                    {video.isShort && (
                       <div className="flex items-center gap-1">
                         <PlaySquare className="h-3 w-3 text-red-500" />
                         <span className="font-semibold text-red-500">Shorts</span>
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
              {formatNumber(video.comments)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {video.duration}
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
                   <DropdownMenuItem onClick={() => onAnalyze(video, "comments")}>
                      <MessagesSquare className="mr-2 h-4 w-4" />
                      Analisar Comentários
                   </DropdownMenuItem>
                  <Link href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                    <DropdownMenuItem>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir no YouTube
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
