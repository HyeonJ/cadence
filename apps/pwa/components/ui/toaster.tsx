"use client";
import { ToastProvider, ToastViewport } from "./toast";

export function Toaster(): React.JSX.Element {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  );
}
