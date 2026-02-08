"use client";

import { useState, useEffect } from "react";
import { Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackageLabel } from "./package-label";
import type { EntryPackageCode } from "@/lib/types";
import { api } from "@/lib/api";

interface PrintLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string;
  entryNumber: string;
  clientName?: string;
}

export function PrintLabelsDialog({
  open,
  onOpenChange,
  entryId,
  entryNumber,
  clientName,
}: PrintLabelsDialogProps) {
  const [codes, setCodes] = useState<EntryPackageCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !entryId) return;
    setLoading(true);
    setError(null);
    api
      .get<EntryPackageCode[]>(`/entries/${entryId}/package-codes`)
      .then((res) => {
        if (res.error) {
          setError(res.error);
          setCodes([]);
          return;
        }
        setCodes(Array.isArray(res.data) ? res.data : []);
      })
      .finally(() => setLoading(false));
  }, [open, entryId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl print:hidden">
        <DialogHeader>
          <DialogTitle>Print package labels</DialogTitle>
          <DialogDescription>
            Labels for entry {entryNumber}
            {clientName ? ` — ${clientName}` : ""}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && codes.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            No package codes found. Ensure the entry is received and has package codes generated.
          </div>
        )}

        {!loading && !error && codes.length > 0 && (
          <ScrollArea className="max-h-[50vh]">
            <div className="flex flex-wrap justify-center gap-4 p-2 print:max-h-none">
              {codes.map((pc) => (
                <PackageLabel
                  key={pc.id}
                  packageCode={pc}
                  entryNumber={entryNumber}
                  clientName={clientName}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handlePrint} disabled={loading || codes.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Print labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
