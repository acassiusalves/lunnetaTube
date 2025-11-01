'use client';

import Image from 'next/image';
import Link from 'next/link';

export interface VideoCardData {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  channelId: string;
  views: number;
  publishedAt: string;
  duration?: string;
  infoproductScore?: number;
  hasHighPotential?: boolean;
}

interface VideoCardProps {
  video: VideoCardData;
  layout?: 'horizontal' | 'vertical';
}

export function VideoCard({ video, layout = 'horizontal' }: VideoCardProps) {
  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'hoje';
    } else if (diffDays === 1) {
      return 'há 1 dia';
    } else if (diffDays < 7) {
      return `há ${diffDays} dias`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
    }
  };

  const getScoreBadge = (score?: number) => {
    if (!score) return null;

    let color = 'bg-gray-500';
    let label = 'Baixa';

    if (score >= 80) {
      color = 'bg-[#FF6B00]';
      label = 'Ouro';
    } else if (score >= 70) {
      color = 'bg-[#FF8121]';
      label = 'Excelente';
    } else if (score >= 60) {
      color = 'bg-[#FF9742]';
      label = 'Boa';
    } else if (score >= 50) {
      color = 'bg-[#FFB87D]';
      label = 'Média';
    }

    return (
      <span className={`${color} text-white text-xs px-2 py-1 rounded font-medium`}>
        {label} ({score})
      </span>
    );
  };

  if (layout === 'vertical') {
    return (
      <Link
        href={`/analyze/${video.id}`}
        className="block group"
      >
        <div className="bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-gray-200">
            {video.thumbnail ? (
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                <span className="text-gray-500 text-sm">Sem imagem</span>
              </div>
            )}
            {video.duration && (
              <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
                {video.duration}
              </div>
            )}
            {video.hasHighPotential && (
              <div className="absolute top-2 left-2">
                <span className="material-symbols-outlined text-yellow-400 text-2xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3">
            <h3 className="font-medium text-sm text-[#0f0f0f] line-clamp-2 mb-2 group-hover:text-[#FF6B00]">
              {video.title}
            </h3>
            <p className="text-xs text-[#606060] mb-1">{video.channel}</p>
            <div className="flex items-center gap-1 text-xs text-[#606060]">
              <span>{formatViews(video.views)} visualizações</span>
              <span>•</span>
              <span>{formatDate(video.publishedAt)}</span>
            </div>
            {video.infoproductScore && (
              <div className="mt-2">
                {getScoreBadge(video.infoproductScore)}
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Horizontal layout (default)
  return (
    <Link
      href={`/analyze/${video.id}`}
      className="flex gap-4 group hover:bg-gray-50 p-2 rounded-lg transition-colors"
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-64 aspect-video bg-gray-200 rounded-lg overflow-hidden">
        {video.thumbnail ? (
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover"
            sizes="256px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-gray-500 text-sm">Sem imagem</span>
          </div>
        )}
        {video.duration && (
          <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
            {video.duration}
          </div>
        )}
        {video.hasHighPotential && (
          <div className="absolute top-2 left-2">
            <span className="material-symbols-outlined text-yellow-400 text-2xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="font-medium text-base text-[#0f0f0f] line-clamp-2 mb-1 group-hover:text-[#FF6B00]">
          {video.title}
        </h3>
        <div className="flex flex-col gap-1 text-sm text-[#606060] mt-1">
          <p className="hover:text-[#0f0f0f] cursor-pointer">{video.channel}</p>
          <div className="flex items-center gap-1">
            <span>{formatViews(video.views)} visualizações</span>
            <span>•</span>
            <span>{formatDate(video.publishedAt)}</span>
          </div>
        </div>
        {video.infoproductScore && (
          <div className="mt-2">
            {getScoreBadge(video.infoproductScore)}
          </div>
        )}
      </div>
    </Link>
  );
}
