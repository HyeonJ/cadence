import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

/**
 * 환경 변수 조회 (lazy).
 *
 * - 모듈 로드 시점이 아닌, 실제 호출 시점에 검증.
 * - 이유: tsc가 타입 수집 도중 모듈을 import 해도 process.env가 비어있을 수 있음.
 *   eager 검증이면 typecheck 자체가 깨짐. 런타임(next dev/build)에서 처음 호출될 때 검증.
 */
export function getEnv(): Env {
  if (_env) return _env;
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `[pwa/env] invalid env: ${parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`
    );
  }
  _env = parsed.data;
  return _env;
}
