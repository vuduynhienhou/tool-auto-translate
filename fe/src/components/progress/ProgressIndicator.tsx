import React from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Typography } from '@/components/ui/typography'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { UploadProgress } from '@/types'

interface ProgressIndicatorProps {
  progress: UploadProgress[]
  onClose: () => void
}

export function ProgressIndicator({ progress, onClose }: ProgressIndicatorProps) {
  const allComplete = progress.every(p => p.status === 'complete')
  const hasError = progress.some(p => p.status === 'error')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Processing Images</CardTitle>
          {allComplete && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {progress.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.status === 'complete' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  {(item.status === 'uploading' || 
                    item.status === 'processing' || 
                    item.status === 'translating') && (
                    <LoadingSpinner size="sm" />
                  )}
                  <Typography variant="small" className="font-medium">
                    {item.file}
                  </Typography>
                </div>
                <Typography variant="muted" className="text-xs">
                  {item.progress}%
                </Typography>
              </div>
              
              <Progress 
                value={item.progress} 
                className={`h-2 ${
                  item.status === 'error' ? 'bg-destructive/20' : ''
                }`}
              />
              
              {item.message && (
                <Typography variant="muted" className="text-xs">
                  {item.message}
                </Typography>
              )}
            </div>
          ))}
          
          {allComplete && (
            <div className="text-center pt-4">
              <Typography variant="small" className="text-green-600 font-medium">
                All images processed successfully!
              </Typography>
            </div>
          )}
          
          {hasError && (
            <div className="text-center pt-4">
              <Typography variant="small" className="text-destructive font-medium">
                Some images failed to process
              </Typography>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}