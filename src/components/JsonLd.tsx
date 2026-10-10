import { serializeJsonLd, type JsonLdObject } from "@/lib/structured-data";

/** Server-rendered schema.org block. Only pass content that anyone may read. */
export function JsonLd({ data }: { readonly data: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      // Escaped by serializeJsonLd (`<` → <), so note text can't close the tag.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
