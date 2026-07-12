import type { JsonLdObject } from "../seo/json-ld";

/**
 * Escape a JSON string for safe embedding in a `<script>` tag. Standard XSS
 * guard used by Next.js and next-seo.
 */
function escapeJsonLd(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/'/g, "\\u0027");
}

/**
 * Render one or more schema.org objects as a JSON-LD script tag. Server-render
 * this (AI crawlers don't run JS).
 */
export function JsonLd({ schema }: { schema: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(JSON.stringify(schema)) }}
    />
  );
}
