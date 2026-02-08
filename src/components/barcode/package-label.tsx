"use client";

import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";
import type { EntryPackageCode } from "@/lib/types";

interface PackageLabelProps {
  packageCode: EntryPackageCode;
  entryNumber?: string;
  clientName?: string;
}

export function PackageLabel({ packageCode, entryNumber, clientName }: PackageLabelProps) {
  return (
    <div className="inline-flex flex-col items-center gap-2 rounded border border-gray-300 bg-white p-3 print:border print:break-inside-avoid">
      {clientName && (
        <span className="text-xs font-medium text-gray-600">{clientName}</span>
      )}
      {entryNumber && (
        <span className="text-xs text-gray-500">{entryNumber}</span>
      )}
      <QRCodeSVG value={packageCode.code} size={80} level="M" />
      <Barcode
        value={packageCode.code}
        format="CODE128"
        width={1.2}
        height={28}
        displayValue={true}
        margin={0}
        fontSize={10}
      />
      <span className="text-sm font-mono font-semibold">{packageCode.code}</span>
    </div>
  );
}
