"use client";

import { actorId, uid, useStore } from "../store";
import type { ProviderDocument } from "../types";
import { defaultContactId } from "../team";

// Provider-side mutations not covered by the core store. Each maps to a write on
// provider_documents / opportunity_notes in /supabase/schema.sql.

const today = () => new Date().toISOString().slice(0, 10);

/** Simulated upload: marks a requested document as received and under review. */
export function uploadProviderDocument(providerId: string, docId: string, fileName?: string) {
  const s = useStore.getState();
  s.updateProvider(providerId, (p) => ({
    ...p,
    documents: p.documents.map((d) => (d.id === docId ? { ...d, name: fileName || d.name, status: "under_review", uploadedAt: today() } : d)),
  }));
  s.log(actorId("u-provider"), "Uploaded verification document", "provider", providerId, fileName ?? docId);
  s.notify({ audience: "admin", userId: null, type: "document_uploaded", title: "Verification document uploaded", body: `${s.providers.find((p) => p.id === providerId)?.name} uploaded ${fileName ?? "a document"}.`, href: `/admin/providers/${providerId}` });
}

export function addProviderDocument(providerId: string, name: string, kind: ProviderDocument["kind"]) {
  const s = useStore.getState();
  s.updateProvider(providerId, (p) => ({
    ...p,
    documents: [...p.documents, { id: uid("d"), name, kind, status: "under_review", uploadedAt: today() }],
  }));
  s.log(actorId("u-provider"), "Added supporting document", "provider", providerId, name);
}

export function removeProviderDocument(providerId: string, docId: string) {
  useStore.getState().updateProvider(providerId, (p) => ({ ...p, documents: p.documents.filter((d) => d.id !== docId) }));
}

/** Records a provider's note against a lead (opportunity). */
export function addLeadNote(opportunityId: string, authorId: string, text: string) {
  useStore.getState().addOpportunityNote(opportunityId, authorId, text);
}

export function requestListingChange(providerId: string, userId: string, packageName: string) {
  const s = useStore.getState();
  s.createThread(
    { subject: `Listing package enquiry — ${packageName}`, participants: [userId, defaultContactId()], context: { kind: "verification", id: providerId } },
    userId,
    `We'd like to know more about the ${packageName} listing package. We understand listing packages affect visibility only and have no effect on match scores.`,
  );
}
