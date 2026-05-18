"use client";

import React from "react";
import { UploadProvider } from "@/features/videos/UploadContext";
import { BackgroundUploadBar } from "@/components/ui/BackgroundUploadBar";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <UploadProvider>
      {children}
      <BackgroundUploadBar />
    </UploadProvider>
  );
}
