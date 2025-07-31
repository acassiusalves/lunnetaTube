
"use client";

import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
    message: string;
    progress: number;
}

export function LoadingState({ message, progress }: LoadingStateProps) {
    return (
        <div className="p-4 space-y-4">
            <div className="space-y-2">
                <p className="text-sm font-medium text-center text-muted-foreground">{message}</p>
                <Progress value={progress} className="w-full" />
            </div>
             <div className="space-y-3 pt-2">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
             </div>
        </div>
    );
}
