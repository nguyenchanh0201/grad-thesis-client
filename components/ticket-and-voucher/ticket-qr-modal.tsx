"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BackendTicket } from "@/schemas/ticket";

type Props = {
  open: boolean;
  onClose: () => void;
  ticket: BackendTicket;
};

export function TicketQRModal({ open, onClose, ticket }: Props) {
  const { event, code } = ticket;
  const qrRef = useRef<HTMLCanvasElement>(null);

  const eventDt = new Date(event.eventDate);
  const dateStr = eventDt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = eventDt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDownload = () => {
    const canvas = qrRef.current;
    if (!canvas) return;

    const downloadCanvas = document.createElement("canvas");
    const ctx = downloadCanvas.getContext("2d");
    const padding = 40;
    const size = canvas.width + padding * 2;

    downloadCanvas.width = size;
    downloadCanvas.height = size;

    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      ctx.drawImage(canvas, padding, padding);

      const url = downloadCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[min(90vw,24rem)] max-w-full p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="line-clamp-2 pr-6 text-base sm:text-lg">
            {event.eventName}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {dateStr} at {timeStr} · {event.venue.venueName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2 sm:gap-4">
          {/* QR code container */}
          <div className="relative flex aspect-square w-full max-w-[min(60vw,14rem)] items-center justify-center overflow-hidden rounded-sm border border-border bg-white p-2">
            <QRCodeCanvas
              id="ticket-qr-code"
              ref={qrRef}
              value={code}
              size={400}
              style={{ width: "100%", height: "100%" }}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center">
            <p className="font-mono text-sm font-semibold text-foreground sm:text-base">
              {code}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">1 ticket</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 sm:w-auto"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Download QR Code
          </Button>

          <p className="text-center text-xs text-muted-foreground sm:text-sm">
            Present this QR code at the venue entrance.
            <br />
            Each scan is valid for one entry only.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
