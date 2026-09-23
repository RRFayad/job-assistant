"use client";

import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/backend/profile";
import { parseContentDispositionFilename } from "@/lib/utils";

type ExportProfileButtonProps = {
  profile: Profile;
};

export const ExportProfileButton = ({ profile }: ExportProfileButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/profile/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        toast.error("Failed to export your Profile.");
        return;
      }

      const disposition = response.headers.get("Content-Disposition");
      const filename =
        parseContentDispositionFilename(disposition) ?? "resume.docx";

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export your Profile.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      <DownloadIcon />
      {isExporting ? "Exporting…" : ".docx"}
    </Button>
  );
};
