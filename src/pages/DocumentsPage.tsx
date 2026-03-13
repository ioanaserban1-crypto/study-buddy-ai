import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Home, Upload, Trash2, Eye, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import { fetchDocuments, deleteDocument, downloadDocumentFile, summarizeDocument } from "@/lib/api";
import type { Document } from "@/lib/api";

const DocumentsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
    },
    onError: () => toast.error("Failed to delete document"),
  });

  const summarizeMutation = useMutation({
    mutationFn: (id: string) => summarizeDocument(id, "concise"),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Summarization started");
      navigate(`/documents/${id}`);
    },
    onError: () => toast.error("Failed to summarize"),
  });

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd.MM.yyyy HH:mm");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 px-8 py-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <Home className="w-4 h-4" /> Home
          </Button>
          <h1 className="text-2xl font-bold text-foreground">My documents</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate("/upload")} className="gap-2">
            <Upload className="w-4 h-4" /> Upload new file
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No documents yet. Upload your first file!</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="surface-highlight">
                  <TableHead className="font-semibold text-foreground">Title</TableHead>
                  <TableHead className="font-semibold text-foreground">Type</TableHead>
                  <TableHead className="font-semibold text-foreground">Time</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc: Document) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <button
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        className="text-primary hover:underline font-medium text-left"
                      >
                        {doc.title}
                      </button>
                    </TableCell>
                    <TableCell className="uppercase text-xs font-semibold text-muted-foreground">
                      {doc.fileType}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(doc.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.status === "summarized" ? "default" : "secondary"}>
                        {doc.status === "summarized" ? "Summarized" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={() => navigate(`/documents/${doc.id}`)}>
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                        {doc.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => summarizeMutation.mutate(doc.id)}
                            disabled={summarizeMutation.isPending}
                          >
                            Summarize
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadDocumentFile(doc.id).catch(() => toast.error("Download failed"))}
                          >
                            <Download className="w-3 h-3 mr-1" /> Download
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate(doc.id)}
                          disabled={deleteMutation.isPending}
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentsPage;
