"use client";

import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BarcodeScannerProps {
  value: string;
  onChange: (value: string) => void;
  onScan?: (code: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

/**
 * Input optimized for hardware barcode scanners (which typically send key events
 * and a final Enter). Also supports manual typing and paste.
 */
export function BarcodeScanner({
  value,
  onChange,
  onScan,
  placeholder = "Scan or type package code (e.g. ENT-0020-001)",
  label = "Package code",
  disabled = false,
  "data-testid": dataTestId,
}: BarcodeScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (disabled) return;
    const el = inputRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && value.trim()) {
        e.preventDefault();
        const code = value.trim();
        onScan?.(code);
        onChange("");
      }
    };

    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [value, onChange, onScan, disabled]);

  return (
    <div className="grid gap-2">
      {label && <Label htmlFor="barcode-scan">{label}</Label>}
      <Input
        ref={inputRef}
        id="barcode-scan"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        data-testid={dataTestId}
        className="font-mono"
      />
    </div>
  );
}
