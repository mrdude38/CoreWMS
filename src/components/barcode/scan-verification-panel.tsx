"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Package, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarcodeScanner } from "./barcode-scanner";
import type { LoadOrderScanVerification } from "@/lib/types";
import { api } from "@/lib/api";

interface ScanVerificationPanelProps {
  loadOrderId: string;
  onVerificationChange?: (verification: LoadOrderScanVerification | null) => void;
}

export function ScanVerificationPanel({
  loadOrderId,
  onVerificationChange,
}: ScanVerificationPanelProps) {
  const [verification, setVerification] = useState<LoadOrderScanVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanInput, setScanInput] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ type: "ok" | "error"; message: string } | null>(null);

  const fetchVerification = useCallback(async () => {
    if (!loadOrderId) return;
    const res = await api.get<LoadOrderScanVerification>(
      `/load-orders/${loadOrderId}/scan-verification`
    );
    if (res.data) {
      setVerification(res.data);
      onVerificationChange?.(res.data);
    } else {
      setVerification(null);
      onVerificationChange?.(null);
    }
    setLoading(false);
  }, [loadOrderId, onVerificationChange]);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  const handleScan = async (code: string) => {
    if (!loadOrderId || !code.trim()) return;
    setScanFeedback(null);
    const res = await api.post<{ scanned_code: string }>(
      `/load-orders/${loadOrderId}/scan`,
      { scanned_code: code.trim() }
    );
    if (res.error) {
      setScanFeedback({ type: "error", message: res.error });
      return;
    }
    setScanFeedback({
      type: "ok",
      message: res.message === "Already scanned" ? "Already scanned" : "Scan recorded",
    });
    setScanInput("");
    await fetchVerification();
    setTimeout(() => setScanFeedback(null), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!verification) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Could not load scan verification.
        </CardContent>
      </Card>
    );
  }

  const { assigned_count, scanned_count, pending_count, can_ship, scan_verified } = verification;
  const progressPercent =
    assigned_count > 0 ? Math.round((scanned_count / assigned_count) * 100) : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Scan verification
        </CardTitle>
        <CardDescription>
          Scan each package code to verify before shipping. All assigned packages must be scanned.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Progress: </span>
            <span className="font-semibold">
              {scanned_count} / {assigned_count} scanned
            </span>
            {pending_count > 0 && (
              <span className="text-muted-foreground"> — {pending_count} pending</span>
            )}
          </div>
          {scan_verified && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-sm font-medium text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              Verified
            </span>
          )}
        </div>
        <Progress value={progressPercent} className="h-2" />

        <BarcodeScanner
          value={scanInput}
          onChange={setScanInput}
          onScan={handleScan}
          disabled={assigned_count === 0}
          label="Scan package code"
        />

        {scanFeedback && (
          <div
            className={`rounded-md p-2 text-sm ${
              scanFeedback.type === "ok"
                ? "bg-green-50 text-green-800"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {scanFeedback.message}
          </div>
        )}

        {assigned_count === 0 && (
          <p className="text-sm text-muted-foreground">
            No packages assigned to this load order. Add entries and packages in edit to enable scanning.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
