"use client";

import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoSearchTabs } from "@/components/dashboard/video-search-tabs";
import { AnalysisDialog } from "@/components/dashboard/analysis-dialog";
import { getMockVideos, type Video } from "@/lib/data";
import { VideoTable, type SortConfig } from "@/components/dashboard/video-table";
import { TableRow, TableCell } from "@/components/ui/table";

type AnalysisType = "content" | "comments";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>("content");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'views', direction: 'descending' });

  const handleSearch = () => {
    setIsLoading(true);
    setVideos([]);
    setTimeout(() => {
      setVideos(getMockVideos());
      setIsLoading(false);
    }, 1500);
  };

  const handleOpenDialog = (video: Video, type: AnalysisType) => {
    setSelectedVideo(video);
    setAnalysisType(type);
    setIsDialogOpen(true);
  };

  const handleSort = (key: keyof Video) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedVideos = useMemo(() => {
    const sortableVideos = [...videos];
    if (sortConfig.key) {
      sortableVideos.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableVideos;
  }, [videos, sortConfig]);

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="space-y-4">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Analisador de Mercado</h1>
          <p className="text-muted-foreground">
            Descubra insights de vídeos do YouTube para impulsionar sua próxima grande ideia.
          </p>
        </header>

        <VideoSearchTabs onSearch={handleSearch} isLoading={isLoading} />

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {isLoading ? (
             <div className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              </div>
          ) : (
            <VideoTable 
              videos={sortedVideos} 
              onAnalyze={handleOpenDialog}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          )}
        </div>
      </div>
      
      {selectedVideo && (
        <AnalysisDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          video={selectedVideo}
          analysisType={analysisType}
        />
      )}
    </div>
  );
}
