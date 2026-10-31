import { buildLlmsTxt } from "@/lib/llms";

/** Short site index for AI answer engines (https://llmstxt.org). */
export async function GET() {
  return new Response(await buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
