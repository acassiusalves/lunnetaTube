'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { ShortVideo } from '@/lib/shorts';

interface ShortPlayerDialogProps {
  short: ShortVideo | null;
  onClose: () => void;
}

export function ShortPlayerDialog({ short, onClose }: ShortPlayerDialogProps) {
  return (
    <Dialog open={!!short} onOpenChange={(open) => { if (!open) onClose(); }}>
      {/* Largura limitada pela altura da tela, para o 9:16 caber sem rolagem */}
      <DialogContent className="w-[min(380px,calc((100vh-4rem)*0.5625))] max-w-none overflow-hidden border-0 bg-black p-0 [&>button]:text-white">
        <DialogTitle className="sr-only">{short?.title ?? 'Short'}</DialogTitle>
        {short && (
          <div className="aspect-[9/16] w-full">
            <iframe
              src={`https://www.youtube.com/embed/${short.id}?autoplay=1&rel=0`}
              title={short.title}
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
