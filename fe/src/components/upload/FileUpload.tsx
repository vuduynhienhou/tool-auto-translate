import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, FileImage, X, Languages } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Typography } from '@/components/ui/typography'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { fileUploadSchema, type FileUploadFormData } from '@/lib/validations'
import { formatFileSize } from '@/lib/utils'

interface FileUploadProps {
  onFilesSelected: (data: FileUploadFormData) => void
  isProcessing: boolean
}

const languages = [
  { value: 'ja', label: 'Japanese' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ko', label: 'Korean' },
]

export function FileUpload({ onFilesSelected, isProcessing }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FileUploadFormData>({
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {
      targetLanguage: 'en',
      sourceLanguage: 'ja',
    },
  })

  const targetLanguage = watch('targetLanguage')
  const sourceLanguage = watch('sourceLanguage')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const validateFiles = (files: File[]) => {
    return files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      const maxSize = 10 * 1024 * 1024 // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    const validFiles = validateFiles(files)
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles)
      // Create a new FileList-like object
      const dt = new DataTransfer()
      validFiles.forEach(file => dt.items.add(file))
      setValue('files', dt.files)
    }
  }, [setValue])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = validateFiles(files)
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles)
      setValue('files', e.target.files!)
    }
  }, [setValue])

  const removeFile = useCallback((index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    
    if (newFiles.length === 0) {
      setValue('files', new DataTransfer().files)
    } else {
      const dt = new DataTransfer()
      newFiles.forEach(file => dt.items.add(file))
      setValue('files', dt.files)
    }
  }, [selectedFiles, setValue])

  const onSubmit = (data: FileUploadFormData) => {
    onFilesSelected(data)
    setSelectedFiles([])
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Languages className="h-8 w-8 text-primary" />
          <Typography variant="h1">Manga Translator</Typography>
        </div>
        <Typography variant="lead">
          Upload your manga pages to get started with automatic translation
        </Typography>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Language Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Translation Settings</CardTitle>
            <CardDescription>
              Select the source and target languages for translation
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Typography variant="small">Source Language</Typography>
              <Select
                value={sourceLanguage}
                onValueChange={(value) => setValue('sourceLanguage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sourceLanguage && (
                <Typography variant="small" className="text-destructive">
                  {errors.sourceLanguage.message}
                </Typography>
              )}
            </div>

            <div className="space-y-2">
              <Typography variant="small">Target Language</Typography>
              <Select
                value={targetLanguage}
                onValueChange={(value) => setValue('targetLanguage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.targetLanguage && (
                <Typography variant="small" className="text-destructive">
                  {errors.targetLanguage.message}
                </Typography>
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardContent className="p-0">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-primary/10 p-6">
                  <Upload className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <Typography variant="h4">
                    Drop manga images here or click to select
                  </Typography>
                  <Typography variant="muted">
                    Supports JPG, PNG, WEBP up to 10MB each
                  </Typography>
                </div>
                <input
                  {...register('files')}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={isProcessing}
                />
                <Button asChild variant="outline" size="lg" disabled={isProcessing}>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Select Images
                  </label>
                </Button>
              </div>
            </div>
            {errors.files && (
              <div className="p-4">
                <Typography variant="small" className="text-destructive">
                  {errors.files.message}
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Files ({selectedFiles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-muted rounded-lg"
                  >
                    <FileImage className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Typography variant="small" className="truncate font-medium">
                        {file.name}
                      </Typography>
                      <Typography variant="muted" className="text-xs">
                        {formatFileSize(file.size)}
                      </Typography>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      disabled={isProcessing}
                      className="h-6 w-6 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isProcessing || !isValid}
                  className="min-w-[200px]"
                >
                  {isProcessing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Process Images'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}