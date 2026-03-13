import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentId, summaryType, title } = await req.json();

    // Placeholder summary instead of AI
    const summary = summaryType === "detailed"
      ? `This is a detailed placeholder summary for "${title}".\n\nKey Points:\n• The document covers important concepts and methodologies\n• Multiple sections explore different aspects of the topic\n• Examples and case studies are provided throughout\n• The conclusion summarizes the main findings\n\nMain Arguments:\nThe author presents a comprehensive analysis of the subject matter, supported by evidence and logical reasoning. The structure follows a clear progression from introduction to conclusion.\n\nImportant Details:\nVarious supporting details, data points, and references are included to strengthen the central thesis of the document.`
      : `Brief summary of "${title}":\n\n• Key concepts and main points covered\n• Core arguments presented\n• Essential takeaways for quick reference`;

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
