import { buildLlmsFullTxt } from "@/lib/llms";

/** Full site content in one plain-text document, for retrieval and citation by AI answer engines. */
export async function GET() {
  return new Response(await buildLlmsFullTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
