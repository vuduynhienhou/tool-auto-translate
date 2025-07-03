import React, { useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

import { FileUpload } from "@/components/upload/FileUpload";
import { ProgressIndicator } from "@/components/progress/ProgressIndicator";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/useToast";
import { createImageUrl } from "@/utils/imageProcessing";
import { detectTextBoxes, translateText } from "@/utils/mockOCR";
import { generateId } from "@/lib/utils";
import { MangaPage, TranslationProject, UploadProgress } from "@/types";
import { FileUploadFormData } from "@/lib/validations";
import ImageViewer from "@/components/ImageViewer";

function App() {
  const { project, isProcessing, setProject, setIsProcessing } = useAppStore();

  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = React.useState<UploadProgress[]>(
    []
  );

  const handleFilesSelected = useCallback(
    async (data: FileUploadFormData) => {
      setIsProcessing(true);

      const files = Array.from(data.files);
      const progressItems: UploadProgress[] = files.map((file) => ({
        file: file.name,
        progress: 0,
        status: "uploading",
      }));

      setUploadProgress(progressItems);

      const pages: MangaPage[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          try {
            // Update progress - uploading
            setUploadProgress((prev) =>
              prev.map((item, index) =>
                index === i
                  ? {
                      ...item,
                      progress: 25,
                      status: "uploading",
                      message: "Reading file...",
                    }
                  : item
              )
            );

            const imageUrl = await createImageUrl(file);

            // Update progress - processing
            setUploadProgress((prev) =>
              prev.map((item, index) =>
                index === i
                  ? {
                      ...item,
                      progress: 50,
                      status: "processing",
                      message: "Detecting text...",
                    }
                  : item
              )
            );

            const textBoxes = await detectTextBoxes(imageUrl);

            // Update progress - translating
            setUploadProgress((prev) =>
              prev.map((item, index) =>
                index === i
                  ? {
                      ...item,
                      progress: 75,
                      status: "translating",
                      message: "Translating...",
                    }
                  : item
              )
            );

            const translatedTextBoxes = await Promise.all(
              textBoxes.map(async (textBox) => {
                const translatedText = await translateText(
                  textBox.text,
                  data.sourceLanguage,
                  data.targetLanguage
                );
                return {
                  ...textBox,
                  text: translatedText,
                  targetLanguage: data.targetLanguage,
                };
              })
            );

            const page: MangaPage = {
              id: generateId(),
              file,
              imageUrl,
              textBoxes: translatedTextBoxes,
              originalTextBoxes: textBoxes,
              name: file.name.replace(/\.[^/.]+$/, ""),
              status: "completed",
            };

            pages.push(page);

            // Update progress - complete
            setUploadProgress((prev) =>
              prev.map((item, index) =>
                index === i
                  ? {
                      ...item,
                      progress: 100,
                      status: "complete",
                      message: "Complete!",
                    }
                  : item
              )
            );
          } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            setUploadProgress((prev) =>
              prev.map((item, index) =>
                index === i
                  ? { ...item, status: "error", message: "Failed to process" }
                  : item
              )
            );
          }
        }

        // Create new project
        const newProject: TranslationProject = {
          id: generateId(),
          name: `Manga Translation ${new Date().toLocaleDateString()}`,
          pages,
          targetLanguage: data.targetLanguage,
          sourceLanguage: data.sourceLanguage,
          createdAt: Date.now(),
          lastModified: Date.now(),
        };

        setProject(newProject);

        toast({
          title: "Success!",
          description: `Processed ${pages.length} pages successfully.`,
        });

        // Auto-hide progress after 2 seconds
        setTimeout(() => {
          setUploadProgress([]);
        }, 2000);
      } catch (error) {
        console.error("Error processing files:", error);
        toast({
          title: "Error",
          description: "Failed to process some files. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [setProject, setIsProcessing, toast]
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          {!project ? (
            <FileUpload
              onFilesSelected={handleFilesSelected}
              isProcessing={isProcessing}
            />
          ) : (
            <ImageEditor />
          )}
        </div>

        {/* Modals */}
        {uploadProgress.length > 0 && (
          <ProgressIndicator
            progress={uploadProgress}
            onClose={() => setUploadProgress([])}
          />
        )}
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

function ImageEditor() {
  const {
    project,
    currentPageIndex,
    selectedTextBox,
    setCurrentPageIndex,
    setSelectedTextBox,
    updateTextBox,
    addToHistory,
  } = useAppStore();

  if (!project) return null;

  // Wrapper to match ImageViewer's expected signature
  const handleTextBoxSelect = (pageId: string, textBoxId: string) => {
    setSelectedTextBox({ pageId, textBoxId });
  };

  return (
    <ImageViewer
      pages={project.pages}
      currentPageIndex={currentPageIndex}
      onPageChange={setCurrentPageIndex}
      onTextBoxSelect={handleTextBoxSelect}
      onTextBoxUpdate={updateTextBox}
      selectedTextBox={selectedTextBox}
      onAddAction={addToHistory}
    />
  );
}

export default App;
