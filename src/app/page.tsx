"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoSearchTabs } from "@/components/dashboard/video-search-tabs";
import { VideoCard } from "@/components/dashboard/video-card";
import { AnalysisDialog } from "@/components/dashboard/analysis-dialog";
import { getMockVideos, type Video } from "@/lib/data";

type AnalysisType = "content" | "comments";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>("content");

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

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="space-y-4">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Market Miner</h1>
          <p className="text-muted-foreground">
            Uncover insights from YouTube videos to fuel your next big idea.
          </p>
        </header>

        <VideoSearchTabs onSearch={handleSearch} isLoading={isLoading} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[180px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}

          {!isLoading && videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onAnalyze={handleOpenDialog}
            />
          ))}
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
