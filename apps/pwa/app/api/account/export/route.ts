import { NextResponse } from "next/server";
import { fetchUserExport } from "@/lib/queries/user-export";

export async function GET(): Promise<Response> {
  const result = await fetchUserExport();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message },
      { status: 401 }
    );
  }
  const filename = `cadence-export-${new Date().toISOString().slice(0, 10)}.json`;
  const body = JSON.stringify(result.data, null, 2);
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
