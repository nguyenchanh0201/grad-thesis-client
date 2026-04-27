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
import type { MyTicket } from "@/schemas/ticket";

type Props = {
  open: boolean;
  onClose: () => void;
  ticket: MyTicket;
};

export function TicketQRModal({ open, onClose, ticket }: Props) {
  const { event, invoiceId, lineItems } = ticket;
  const totalTickets = lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const handleDownload = () => {
    const canvas = qrRef.current;
    if (!canvas) return;

    // Create a new canvas to add some padding/white background for the download image
    const downloadCanvas = document.createElement("canvas");
    const ctx = downloadCanvas.getContext("2d");
    const padding = 40;
    const size = canvas.width + padding * 2;

    downloadCanvas.width = size;
    downloadCanvas.height = size;

    if (ctx) {
      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      // Draw the QR code
      ctx.drawImage(canvas, padding, padding);

      const url = downloadCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${invoiceId}.png`;
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
            {event.title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {event.date} at {event.time} · {event.venue}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2 sm:gap-4">
          {/* QR code container */}
          <div className="relative flex aspect-square w-full max-w-[min(60vw,14rem)] items-center justify-center overflow-hidden rounded-sm border border-border bg-white p-2">
            <QRCodeCanvas
              id="ticket-qr-code"
              ref={qrRef}
              value={invoiceId}
              size={400} // High res for download
              style={{ width: "100%", height: "100%" }} // Responsive display
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center">
            <p className="font-mono text-sm font-semibold text-foreground sm:text-base">
              {invoiceId}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {totalTickets} ticket{totalTickets > 1 ? "s" : ""}
            </p>
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
