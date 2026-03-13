import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload as UploadIcon, CloudUpload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import { uploadDocument } from "@/lib/api";
import heroImage from "@/assets/hero-study.png";

const ALLOWED = ["pdf", "docx", "txt"];

const UploadPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const getExt = (f: File) => f.name.split(".").pop()?.toLowerCase() || "";

  const handleFile = useCallback((f: File) => {
    const ext = getExt(f);
    if (!ALLOWED.includes(ext)) {
      toast.error("Only PDF, DOCX, and TXT files are allowed");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }, [title]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("No file");
      return uploadDocument(title, file, getExt(file));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded successfully!");
      navigate("/documents");
    },
    onError: () => toast.error("Upload failed"),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Hero text */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Let's study together!
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Upload your files and transform complex content into focused summaries designed for smarter studying
            </p>
          </div>

          {/* Right: Upload form */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
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
              <CloudUpload className="w-10 h-10 mx-auto mb-2 text-primary/40" />
              <p className="text-sm text-muted-foreground">Drag or drop files here</p>
              <p className="text-xs text-muted-foreground my-1">-OR-</p>
              <Button variant="outline" size="sm" type="button">Browse</Button>
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
              placeholder="Type file name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => mutation.mutate()}
                disabled={!file || !title.trim() || mutation.isPending}
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                {mutation.isPending ? "Uploading..." : "Upload"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/documents")}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadPage;
