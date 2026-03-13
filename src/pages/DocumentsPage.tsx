import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Upload, Trash2, Eye, FileText, Download, CloudUpload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import { fetchDocuments, deleteDocument, downloadDocumentFile, summarizeDocument, uploadDocument } from "@/lib/api";
import type { Document } from "@/lib/api";

const ALLOWED = ["pdf", "docx", "txt"];

const DocumentsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const getExt = (f: File) => f.name.split(".").pop()?.toLowerCase() || "";

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED.includes(ext)) {
      toast.error("Only PDF, DOCX, and TXT files are allowed");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }, [title]);

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

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("No file");
      return uploadDocument(title, file, getExt(file));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded successfully!");
      setFile(null);
      setTitle("");
      setShowUpload(false);
    },
    onError: () => toast.error("Upload failed"),
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
      <main className="flex-1 px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">My documents</h1>
          <Button
            size="sm"
            variant={showUpload ? "secondary" : "default"}
            onClick={() => setShowUpload((v) => !v)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {showUpload ? "Hide upload" : "Upload file"}
          </Button>
        </div>

        <div className="flex gap-6 items-start">
          {/* Left: Documents table */}
          <div className={`${showUpload ? "flex-1 min-w-0" : "w-full"} transition-all`}>
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
                    <TableRow>
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
                          {doc.file_type}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(doc.created_at)}
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
          </div>

          {/* Right: Upload panel (toggled) */}
          {showUpload && (
            <div className="w-80 shrink-0 rounded-2xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Upload file</h2>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  dragOver ? "border-primary bg-accent/40" : "border-border"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudUpload className="w-8 h-8 mx-auto mb-2 text-primary/40" />
                <p className="text-sm text-muted-foreground">Drag & drop or</p>
                <Button variant="outline" size="sm" type="button" className="mt-1">Browse</Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>

              {file && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/30 text-sm">
                  <span className="flex-1 truncate font-medium">{file.name}</span>
                  <span className="uppercase text-xs text-muted-foreground font-semibold">{getExt(file)}</span>
                  <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <Input
                placeholder="File name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Button
                className="w-full"
                onClick={() => uploadMutation.mutate()}
                disabled={!file || !title.trim() || uploadMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DocumentsPage;
