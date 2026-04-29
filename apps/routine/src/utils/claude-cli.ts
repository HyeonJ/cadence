import { spawn } from "node:child_process";

export interface CallClaudeInput {
  prompt: string;
  system?: string;
  model?: "claude-opus-4-7" | "claude-sonnet-4-6" | "claude-haiku-4-5";
  maxOutputBytes?: number;
  timeoutMs?: number;
}

const DEFAULT_MODEL: NonNullable<CallClaudeInput["model"]> = "claude-opus-4-7";
const DEFAULT_MAX_OUTPUT = 50_000;
const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * `claude --print` subprocess를 호출한다. Max 구독 인증 사용 (API 키 X).
 * stdout 누적이 maxOutputBytes 초과 또는 timeoutMs 초과 시 kill + reject.
 */
export async function callClaude(input: CallClaudeInput): Promise<string> {
  const {
    prompt,
    system,
    model = DEFAULT_MODEL,
    maxOutputBytes = DEFAULT_MAX_OUTPUT,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = input;

  return new Promise<string>((resolve, reject) => {
    const proc = spawn("claude", ["--print", "--model", model], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });
    let stdout = "";
    let stderr = "";
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill();
      reject(new Error(`claude timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    proc.stdout.on("data", (d) => {
      stdout += d.toString();
      if (stdout.length > maxOutputBytes) {
        killed = true;
        proc.kill();
        clearTimeout(timer);
        reject(new Error(`claude output exceeded ${maxOutputBytes} bytes`));
      }
    });
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (killed) return;
      if (code !== 0) {
        reject(new Error(`claude exit ${code}: ${stderr.slice(0, 500)}`));
      } else {
        resolve(stdout);
      }
    });

    const fullPrompt = system ? `${system}\n\n---\n\n${prompt}` : prompt;
    proc.stdin.write(fullPrompt);
    proc.stdin.end();
  });
}

/**
 * Claude Code CLI 응답에서 JSON 객체를 추출한다.
 * 1) ```json … ``` 또는 ``` … ``` 코드 펜스 안 우선
 * 2) 펜스 없으면 원문에서 첫 `{` 부터 마지막 `}` 추출
 * 3) JSON.parse 시도, 실패 또는 매칭 없음 시 throw
 */
export function extractJson(raw: string): unknown {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : raw;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) {
    throw new Error("no JSON object found in response");
  }
  return JSON.parse(candidate.slice(first, last + 1));
}
