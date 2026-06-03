"use client";

import React from "react";
import { UploadProvider } from "@/features/videos/UploadContext";
import { BackgroundUploadBar } from "@/components/ui/BackgroundUploadBar";
import { ToastProvider } from "@/components/ui/Toast";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <UploadProvider>
        {children}
        <BackgroundUploadBar />
      </UploadProvider>
    </ToastProvider>
  );
}
