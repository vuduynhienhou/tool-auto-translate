import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { configService, AppConfig } from '@/services/configService';
import { Settings, Key, Image, Download, Palette, Info } from 'lucide-react';

const configSchema = z.object({
  googleTranslateApiKey: z.string().optional(),
  deepLApiKey: z.string().optional(),
  libreTranslateUrl: z.string().url().optional().or(z.literal('')),
  libreTranslateApiKey: z.string().optional(),
  ocrLanguages: z.string().min(1),
  ocrConfidenceThreshold: z.number().min(0).max(100),
  useWebWorkers: z.boolean(),
  maxImageSize: z.number().min(100000),
  compressionQuality: z.number().min(0.1).max(1),
  theme: z.enum(['light', 'dark', 'system']),
  autoSave: z.boolean(),
  showConfidenceScores: z.boolean(),
  defaultExportFormat: z.enum(['png', 'jpeg', 'pdf']),
  includeOriginalInExport: z.boolean(),
  includeMetadataInExport: z.boolean(),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface SettingsDialogProps {
  children: React.ReactNode;
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('translation');
  const { toast } = useToast();
  
  const config = configService.getConfig();
  
  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      googleTranslateApiKey: config.googleTranslateApiKey || '',
      deepLApiKey: config.deepLApiKey || '',
      libreTranslateUrl: config.libreTranslateUrl || '',
      libreTranslateApiKey: config.libreTranslateApiKey || '',
      ocrLanguages: config.ocrLanguages,
      ocrConfidenceThreshold: config.ocrConfidenceThreshold,
      useWebWorkers: config.useWebWorkers,
      maxImageSize: config.maxImageSize,
      compressionQuality: config.compressionQuality,
      theme: config.theme,
      autoSave: config.autoSave,
      showConfidenceScores: config.showConfidenceScores,
      defaultExportFormat: config.defaultExportFormat,
      includeOriginalInExport: config.includeOriginalInExport,
      includeMetadataInExport: config.includeMetadataInExport,
    },
  });

  const onSubmit = (data: ConfigFormData) => {
    try {
      // Filter out empty strings for optional API keys
      const cleanedData = {
        ...data,
        googleTranslateApiKey: data.googleTranslateApiKey || undefined,
        deepLApiKey: data.deepLApiKey || undefined,
        libreTranslateUrl: data.libreTranslateUrl || undefined,
        libreTranslateApiKey: data.libreTranslateApiKey || undefined,
      };
      
      configService.updateConfig(cleanedData);
      
      toast({
        title: 'Settings saved',
        description: 'Your configuration has been updated successfully.',
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    configService.resetConfig();
    const newConfig = configService.getConfig();
    form.reset(newConfig);
    
    toast({
      title: 'Settings reset',
      description: 'All settings have been reset to defaults.',
    });
  };

  const handleExport = () => {
    try {
      const configJson = configService.exportConfig();
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'manga-translator-config.json';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Config exported',
        description: 'Configuration exported successfully.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export configuration.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const configJson = e.target?.result as string;
        if (configService.importConfig(configJson)) {
          const newConfig = configService.getConfig();
          form.reset(newConfig);
          
          toast({
            title: 'Config imported',
            description: 'Configuration imported successfully.',
          });
        } else {
          throw new Error('Invalid configuration file');
        }
      } catch (error) {
        toast({
          title: 'Import failed',
          description: 'Failed to import configuration. Please check the file format.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const translationProviders = configService.getTranslationProviders();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure OCR, translation services, and application preferences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="translation" className="flex items-center gap-1">
                <Key className="h-4 w-4" />
                Translation
              </TabsTrigger>
              <TabsTrigger value="processing" className="flex items-center gap-1">
                <Image className="h-4 w-4" />
                Processing
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Export
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-1">
                <Palette className="h-4 w-4" />
                Appearance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="translation" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Translation Services</h3>
                  <div className="flex gap-1">
                    {translationProviders.map((provider) => (
                      <Badge key={provider} variant="secondary" className="text-xs">
                        {provider}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="googleTranslateApiKey">Google Translate API Key</Label>
                    <Input
                      id="googleTranslateApiKey"
                      type="password"
                      placeholder="Enter your Google Translate API key"
                      {...form.register('googleTranslateApiKey')}
                    />
                    <p className="text-sm text-muted-foreground">
                      Get your API key from the Google Cloud Console
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deepLApiKey">DeepL API Key</Label>
                    <Input
                      id="deepLApiKey"
                      type="password"
                      placeholder="Enter your DeepL API key"
                      {...form.register('deepLApiKey')}
                    />
                    <p className="text-sm text-muted-foreground">
                      Get your API key from the DeepL Pro account
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="libreTranslateUrl">LibreTranslate URL</Label>
                    <Input
                      id="libreTranslateUrl"
                      placeholder="https://libretranslate.de/translate"
                      {...form.register('libreTranslateUrl')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="libreTranslateApiKey">LibreTranslate API Key (Optional)</Label>
                    <Input
                      id="libreTranslateApiKey"
                      type="password"
                      placeholder="Enter LibreTranslate API key"
                      {...form.register('libreTranslateApiKey')}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="processing" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">OCR & Processing Settings</h3>

                <div className="space-y-2">
                  <Label htmlFor="ocrLanguages">OCR Languages</Label>
                  <Input
                    id="ocrLanguages"
                    placeholder="eng+jpn+chi_sim+chi_tra+kor"
                    {...form.register('ocrLanguages')}
                  />
                  <p className="text-sm text-muted-foreground">
                    Tesseract language codes separated by + (e.g., eng+jpn+chi_sim)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ocrConfidenceThreshold">OCR Confidence Threshold (%)</Label>
                  <Input
                    id="ocrConfidenceThreshold"
                    type="number"
                    min="0"
                    max="100"
                    {...form.register('ocrConfidenceThreshold', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxImageSize">Max Image Size (pixels)</Label>
                  <Input
                    id="maxImageSize"
                    type="number"
                    min="100000"
                    {...form.register('maxImageSize', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compressionQuality">Compression Quality</Label>
                  <Input
                    id="compressionQuality"
                    type="number"
                    min="0.1"
                    max="1"
                    step="0.1"
                    {...form.register('compressionQuality', { valueAsNumber: true })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="useWebWorkers"
                    {...form.register('useWebWorkers')}
                  />
                  <Label htmlFor="useWebWorkers">Use Web Workers for Processing</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Export Settings</h3>

                <div className="space-y-2">
                  <Label htmlFor="defaultExportFormat">Default Export Format</Label>
                  <Select
                    value={form.watch('defaultExportFormat')}
                    onValueChange={(value) => form.setValue('defaultExportFormat', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeOriginalInExport"
                    {...form.register('includeOriginalInExport')}
                  />
                  <Label htmlFor="includeOriginalInExport">Include Original Images in Export</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeMetadataInExport"
                    {...form.register('includeMetadataInExport')}
                  />
                  <Label htmlFor="includeMetadataInExport">Include Metadata in Export</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Appearance & Behavior</h3>

                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={form.watch('theme')}
                    onValueChange={(value) => form.setValue('theme', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoSave"
                    {...form.register('autoSave')}
                  />
                  <Label htmlFor="autoSave">Auto-save Projects</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showConfidenceScores"
                    {...form.register('showConfidenceScores')}
                  />
                  <Label htmlFor="showConfidenceScores">Show Confidence Scores</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between border-t pt-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset to Defaults
              </Button>
              <Button type="button" variant="outline" onClick={handleExport}>
                Export Config
              </Button>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-config"
                />
                <Label htmlFor="import-config">
                  <Button type="button" variant="outline" asChild>
                    <span>Import Config</span>
                  </Button>
                </Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Settings</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}