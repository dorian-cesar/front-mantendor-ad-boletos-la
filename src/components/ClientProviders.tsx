"use client";

import React from "react";
import { UploadProvider } from "@/features/videos/UploadContext";
import { BackgroundUploadBar } from "@/components/ui/BackgroundUploadBar";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthGuard } from "@/components/AuthGuard";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthGuard>
        <UploadProvider>
          {children}
          <BackgroundUploadBar />
        </UploadProvider>
      </AuthGuard>
    </ToastProvider>
  );
}
