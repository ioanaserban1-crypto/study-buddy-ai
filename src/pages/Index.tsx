import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import heroImage from "@/assets/hero-study.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Let's study together!
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Upload your files and transform complex content into focused summaries designed for smarter studying
            </p>
            <Button
              size="lg"
              className="px-10 text-base font-semibold"
              onClick={() => navigate("/documents")}
            >
              START
            </Button>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-2xl border border-border p-6 bg-card">
              <img src={heroImage} alt="Study desk illustration" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
