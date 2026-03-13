-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create summaries table
CREATE TABLE public.summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  summary_type TEXT NOT NULL DEFAULT 'concise',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id)
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required, matching your original backend)
CREATE POLICY "Anyone can read documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Anyone can insert documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete documents" ON public.documents FOR DELETE USING (true);

CREATE POLICY "Anyone can read summaries" ON public.summaries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert summaries" ON public.summaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update summaries" ON public.summaries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete summaries" ON public.summaries FOR DELETE USING (true);

-- Storage bucket for document files
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

CREATE POLICY "Anyone can read document files" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Anyone can upload document files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Anyone can delete document files" ON storage.objects FOR DELETE USING (bucket_id = 'documents');