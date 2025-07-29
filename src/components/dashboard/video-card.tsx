"use client";

import Image from "next/image";
import {
  Calendar,
  Clock,
  Eye,
  MessageSquare,
  MessagesSquare,
  Sparkles,
  ThumbsUp,
  Youtube,
} from "lucide-react";
import type { Video } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "../ui/badge";

interface VideoCardProps {
  video: Video;
  onAnalyze: (video: Video, type: "content" | "comments") => void;
}

export function VideoCard({ video, onAnalyze }: VideoCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="p-0">
        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="relative block">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            width={400}
            height={225}
            className="w-full object-cover"
            data-ai-hint={video.dataAiHint}
          />
          <div className="absolute inset-0 bg-black/20 transition-opacity opacity-0 hover:opacity-100 flex items-center justify-center">
            <Youtube className="h-12 w-12 text-white/80" />
          </div>
          <Badge variant="secondary" className="absolute bottom-2 right-2">{video.duration}</Badge>
        </a>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="mb-2 text-base font-semibold leading-tight">
          {video.title}
        </CardTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            <span>{formatNumber(video.views)} visualizações</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThumbsUp className="h-4 w-4" />
            <span>{formatNumber(video.likes)} curtidas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            <span>{formatNumber(video.comments)} comentários</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{video.publishedAt}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 p-4 pt-0 sm:flex-row">
        <Button
          size="sm"
          className="w-full"
          onClick={() => onAnalyze(video, "content")}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Transcrever e Analisar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => onAnalyze(video, "comments")}
        >
          <MessagesSquare className="mr-2 h-4 w-4" />
          Analisar Comentários
        </Button>
      </CardFooter>
    </Card>
  );
}
