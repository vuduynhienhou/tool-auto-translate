import { z } from "zod"

export const fileUploadSchema = z.object({
  files: z.instanceof(FileList).refine(
    (files) => files.length > 0,
    "Please select at least one file"
  ).refine(
    (files) => Array.from(files).every(file => 
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    ),
    "Only JPG, PNG, and WEBP files are allowed"
  ).refine(
    (files) => Array.from(files).every(file => file.size <= 10 * 1024 * 1024),
    "Files must be smaller than 10MB"
  ),
  targetLanguage: z.string().min(1, "Please select a target language"),
  sourceLanguage: z.string().min(1, "Please select a source language"),
})

export const textEditSchema = z.object({
  text: z.string().min(1, "Text cannot be empty"),
  fontSize: z.number().min(8).max(72),
  fontWeight: z.enum(['normal', 'bold']),
  fontStyle: z.enum(['normal', 'italic']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
})

export const projectSettingsSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name too long"),
  targetLanguage: z.string().min(1, "Please select a target language"),
  sourceLanguage: z.string().min(1, "Please select a source language"),
})

export const exportSettingsSchema = z.object({
  format: z.enum(['png', 'jpg']),
  quality: z.number().min(60).max(100),
  includeOriginal: z.boolean(),
  exportType: z.enum(['single', 'all', 'zip']),
})

export type FileUploadFormData = z.infer<typeof fileUploadSchema>
export type TextEditFormData = z.infer<typeof textEditSchema>
export type ProjectSettingsFormData = z.infer<typeof projectSettingsSchema>
export type ExportSettingsFormData = z.infer<typeof exportSettingsSchema>