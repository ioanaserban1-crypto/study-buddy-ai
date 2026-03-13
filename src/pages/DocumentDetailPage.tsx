import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Eye, Trash2, FileText, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import AppHeader from "@/components/AppHeader";
import {
  fetchDocumentById,
  fetchSummary,
  summarizeDocument,
  regenerateSummary,
  deleteDocument,
  downloadDocumentFile,
} from "@/lib/api";
import type { SummaryType } from "@/lib/api";

const DocumentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [summaryType, setSummaryType] = useState<SummaryType>("concise");
  const [showSummary, setShowSummary] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  const { data: doc, isLoading: docLoading } = useQuery({
    queryKey: ["document", id],
    queryFn: () => fetchDocumentById(id!),
    enabled: !!id,
  });

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ["summary", id],
    queryFn: () => fetchSummary(id!),
    enabled: !!id && showSummary,
    retry: false,
  });

  const summarizeMut = useMutation({
    mutationFn: () => summarizeDocument(id!, summaryType),
    onMutate: () => setSummarizing(true),
    onSuccess: () => {
      setSummarizing(false);
      setShowSummary(true);
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      refetchSummary();
      toast.success("Summary generated!");
    },
    onError: () => {
      setSummarizing(false);
      toast.error("Summarization failed");
    },
  });

  const regenMut = useMutation({
    mutationFn: () => regenerateSummary(id!, summaryType),
    onMutate: () => setSummarizing(true),
    onSuccess: () => {
      setSummarizing(false);
      refetchSummary();
      toast.success("Summary regenerated!");
    },
    onError: () => {
      setSummarizing(false);
      toast.error("Regeneration failed");
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteDocument(id!),
    onSuccess: () => {
      toast.success("Document deleted");
      navigate("/documents");
    },
  });

  const copySummary = () => {
    if (summary?.summary) {
      navigator.clipboard.writeText(summary.summary);
      toast.success("Copied to clipboard");
    }
  };

  const exportSummary = () => {
    if (!summary?.summary) return;
    const blob = new Blob([summary.summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${summary.title || "summary"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (docLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Document not found</div>
      </div>
    );
  }

  const formatDate = (d: string) => {
    try { return format(new Date(d), "dd.MM.yyyy HH:mm"); } catch { return d; }
  };

  const isSummarized = doc.status === "summarized" || showSummary;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 px-8 py-6 max-w-5xl mx-auto w-full space-y-6">
        <Button variant="ghost" onClick={() => navigate("/documents")} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>

        {/* Document info bar */}
        <div className="rounded-xl surface-highlight px-6 py-4 flex flex-wrap items-center gap-4">
          <span className="font-semibold text-primary">{doc.title}</span>
          <span className="uppercase text-xs font-semibold text-muted-foreground">{doc.file_type}</span>
          <span className="text-sm text-muted-foreground">{formatDate(doc.created_at)}</span>
          <Badge variant={isSummarized ? "default" : "secondary"}>
            {summarizing ? "Summarizing..." : isSummarized ? "Summarized" : "Pending"}
          </Badge>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              onClick={() => {
                setShowSummary(true);
                refetchSummary();
              }}
              disabled={!isSummarized}
            >
              <Eye className="w-3 h-3 mr-1" /> View Summary
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => summarizeMut.mutate()}
              disabled={summarizing || summarizeMut.isPending}
            >
              {summarizing ? "Generating..." : "Generate Summary"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => deleteMut.mutate()}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
          </div>
        </div>

        {/* Summarizing progress */}
        {summarizing && (
          <div className="space-y-2">
            <Progress value={45} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">Summarizing...</p>
          </div>
        )}

        {/* Summary section */}
        {showSummary && !summarizing && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Summary type:</span>
                <Select value={summaryType} onValueChange={(v) => setSummaryType(v as SummaryType)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={exportSummary}>
                  <Download className="w-3 h-3 mr-1" /> Export
                </Button>
                <Button size="sm" variant="outline" onClick={copySummary}>
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => regenMut.mutate()}
                  disabled={regenMut.isPending || summarizing}
                >
                  Regenerate summary
                </Button>
              </div>
            </div>

            <ScrollArea className="rounded-xl border border-border bg-card p-6 h-80">
              {summaryLoading ? (
                <p className="text-muted-foreground">Loading summary...</p>
              ) : summary ? (
                <div>
                  <h2 className="text-xl font-bold text-primary mb-4">{summary.title}</h2>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{summary.summary}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No summary available yet. Generate one above.</p>
              )}
            </ScrollArea>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentDetailPage;
