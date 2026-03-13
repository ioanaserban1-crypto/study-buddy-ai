import { supabase } from "@/integrations/supabase/client";

export interface Document {
  id: string;
  title: string;
  file_type: string;
  file_path: string;
  status: string;
  created_at: string;
}

export interface SummaryResponse {
  document_id: string;
  title: string;
  summary: string;
  generated_at: string;
}

export type SummaryType = "concise" | "detailed";

// Documents
export async function fetchDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchDocumentById(id: string): Promise<Document> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function uploadDocument(title: string, file: File, fileType: string): Promise<{ id: string }> {
  // 1. Upload file to storage
  const filePath = `${crypto.randomUUID()}_${file.name}`;
  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);
  if (storageError) throw storageError;

  // 2. Create document record
  const { data, error } = await supabase
    .from("documents")
    .insert({ title, file_type: fileType, file_path: filePath, status: "pending" })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}

export async function deleteDocument(id: string): Promise<void> {
  // Get file path first
  const { data: doc } = await supabase.from("documents").select("file_path").eq("id", id).single();
  if (doc?.file_path) {
    await supabase.storage.from("documents").remove([doc.file_path]);
  }
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

export async function downloadDocumentFile(id: string): Promise<void> {
  const { data: doc } = await supabase.from("documents").select("file_path, title, file_type").eq("id", id).single();
  if (!doc) throw new Error("Document not found");

  const { data, error } = await supabase.storage.from("documents").download(doc.file_path);
  if (error) throw error;

  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.title}.${doc.file_type}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Summaries
export async function summarizeDocument(id: string, summaryType: SummaryType): Promise<void> {
  const doc = await fetchDocumentById(id);

  // Call edge function for AI summary
  const { data: fnData, error: fnError } = await supabase.functions.invoke("summarize", {
    body: { documentId: id, summaryType, title: doc.title },
  });
  if (fnError) throw fnError;

  // Upsert summary
  const { error } = await supabase
    .from("summaries")
    .upsert({
      document_id: id,
      summary: fnData.summary,
      summary_type: summaryType,
      generated_at: new Date().toISOString(),
    }, { onConflict: "document_id" });
  if (error) throw error;

  // Update document status
  await supabase.from("documents").update({ status: "summarized" }).eq("id", id);
}

export async function fetchSummary(id: string): Promise<SummaryResponse | null> {
  const { data, error } = await supabase
    .from("summaries")
    .select("*, documents(title)")
    .eq("document_id", id)
    .single();
  if (error) return null;
  return {
    document_id: data.document_id,
    title: (data.documents as any)?.title || "",
    summary: data.summary,
    generated_at: data.generated_at,
  };
}

export async function regenerateSummary(id: string, summaryType: SummaryType): Promise<void> {
  await summarizeDocument(id, summaryType);
}
