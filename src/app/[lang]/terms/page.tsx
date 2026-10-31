import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document";
import { termsAndConditions } from "@/content/legal";
import { buildEnglishOnlyMetadata } from "@/lib/seo";

export const metadata: Metadata = buildEnglishOnlyMetadata(termsAndConditions);

export default function TermsPage() {
  return <LegalDocumentPage doc={termsAndConditions} />;
}
