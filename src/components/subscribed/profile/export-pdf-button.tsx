"use client";

import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// PDF export isn't built yet — ticket deferred per the .docx export
// decision (generate-from-scratch now, PDF later). This just tells the
// user that rather than silently doing nothing or hiding the option.
export const ExportPdfButton = () => {
  const handleClick = () => {
    toast("PDF export is coming soon — for now, download the .docx.");
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick}>
      <DownloadIcon />
      .pdf
    </Button>
  );
};
