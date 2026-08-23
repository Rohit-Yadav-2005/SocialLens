"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RotateCcw } from "lucide-react";

import { ProcessingStages } from "@/components/analysis/processing-stages";
import { Dropzone } from "@/components/upload/dropzone";
import { PlatformSelect } from "@/components/upload/platform-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAnalyzeFlow } from "@/hooks/use-analyze-flow";
import type { Platform } from "@/types/api";

export default function AnalyzePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState<Platform>("generic");
  const { stage, failedPhase, document, errorMessage, submit, isPending, reset } =
    useAnalyzeFlow();

  const isProcessing = stage === "uploading" || stage === "analyzing";

  useEffect(() => {
    if (stage === "complete" && document) {
      router.push(`/analyze/${document.id}`);
    }
  }, [stage, document, router]);

  const handleReset = () => {
    setFile(null);
    reset();
  };

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Analyze your content</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a PDF or image and get a scored breakdown with actionable recommendations.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-6">
        <Dropzone
          selectedFile={file}
          onFileSelected={setFile}
          onFileCleared={() => setFile(null)}
          disabled={isProcessing || stage === "complete"}
        />

        {file && !isProcessing && stage !== "error" && stage !== "complete" && (
          <PlatformSelect value={platform} onChange={setPlatform} disabled={isProcessing} />
        )}

        {stage === "error" && errorMessage && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Analysis failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {(isProcessing || stage === "complete" || stage === "error") && (
          <ProcessingStages stage={stage} failedPhase={failedPhase} />
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          {stage === "error" ? (
            <Button variant="outline" onClick={handleReset} className="flex-1">
              <RotateCcw />
              Start over
            </Button>
          ) : (
            <Button
              onClick={() => file && submit({ file, platform })}
              disabled={!file || isPending || stage === "complete"}
              className="h-10 flex-1 text-base"
            >
              {isPending || stage === "complete" ? "Analyzing…" : "Analyze Content"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
