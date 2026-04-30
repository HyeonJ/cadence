import { describe, it, expect } from "vitest";
import { extractJson } from "../src/utils/claude-cli.ts";

describe("extractJson", () => {
  it("순수 JSON 객체", () => {
    const raw = '{"a":1,"b":"x"}';
    expect(extractJson(raw)).toEqual({ a: 1, b: "x" });
  });

  it("```json fence 안 JSON", () => {
    const raw = "응답:\n```json\n{\"a\":2}\n```\n끝.";
    expect(extractJson(raw)).toEqual({ a: 2 });
  });

  it("``` fence (lang 없음)", () => {
    const raw = "여기:\n```\n{\"x\":\"y\"}\n```";
    expect(extractJson(raw)).toEqual({ x: "y" });
  });

  it("fence 없고 prose + JSON 혼합", () => {
    const raw = "Sure, here's the response: {\"k\":3} hope this helps";
    expect(extractJson(raw)).toEqual({ k: 3 });
  });

  it("JSON 객체 없으면 throw", () => {
    expect(() => extractJson("plain text only")).toThrow(/no JSON object/);
  });
});
