import { describe, it, expect } from "vitest";
import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  const m = manifest();

  it("필수 필드 — name/short_name/start_url/display=standalone", () => {
    expect(m.name).toMatch(/Cadence/);
    expect(m.short_name).toBe("Cadence");
    expect(m.start_url).toBe("/today");
    expect(m.display).toBe("standalone");
  });

  it("theme_color/background_color = #FAFAFA (spec §6.4)", () => {
    expect(m.theme_color).toBe("#FAFAFA");
    expect(m.background_color).toBe("#FAFAFA");
  });

  it("아이콘 — 192/512 PNG + maskable SVG 모두 포함", () => {
    const icons = m.icons ?? [];
    expect(icons.find((i) => i.sizes === "192x192" && i.type === "image/png")).toBeTruthy();
    expect(icons.find((i) => i.sizes === "512x512" && i.type === "image/png")).toBeTruthy();
    expect(icons.find((i) => i.purpose === "maskable")).toBeTruthy();
  });
});
