import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document";
import { privacyPolicy } from "@/content/legal";
import { buildEnglishOnlyMetadata } from "@/lib/seo";

export const metadata: Metadata = buildEnglishOnlyMetadata(privacyPolicy);

export default function PrivacyPage() {
  return <LegalDocumentPage doc={privacyPolicy} />;
}
