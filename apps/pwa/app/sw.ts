import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist, NetworkOnly } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const dataNetworkOnly: RuntimeCaching = {
  matcher: ({ url, request }) => {
    if (request.method !== "GET") return true;
    if (url.hostname.endsWith(".supabase.co") || url.hostname === "127.0.0.1") return true;
    if (url.pathname.startsWith("/api/")) return true;
    if (url.pathname.startsWith("/auth/")) return true;
    if (url.searchParams.has("_rsc")) return true;
    return false;
  },
  handler: new NetworkOnly(),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [dataNetworkOnly, ...defaultCache],
});

serwist.addEventListeners();
