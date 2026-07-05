import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const startScanner = async () => {
      if (isInitializedRef.current) return;
      
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        isInitializedRef.current = true;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
          },
          () => {
            // Error callback - ignore scanning errors
          }
        );
      } catch (error) {
        console.error("Scanner initialization error:", error);
        toast.error("Failed to start camera. Please check permissions.");
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onScan]);

  const stopScanner = () => {
    if (scannerRef.current && isInitializedRef.current) {
      scannerRef.current.stop().catch((err) => {
        console.error("Error stopping scanner:", err);
      });
      isInitializedRef.current = false;
      scannerRef.current = null;
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Scan Student QR Code</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div id="qr-reader" className="w-full"></div>
        <p className="text-sm text-muted-foreground text-center">
          Position the QR code within the frame to scan
        </p>
      </div>
    </Card>
  );
};
