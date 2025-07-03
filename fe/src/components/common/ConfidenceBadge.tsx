import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ConfidenceBadgeProps {
  confidence: number
  className?: string
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100)
  
  const getVariant = (conf: number) => {
    if (conf >= 0.9) return "default"
    if (conf >= 0.7) return "secondary" 
    return "destructive"
  }

  return (
    <Badge 
      variant={getVariant(confidence)}
      className={cn("text-xs font-mono", className)}
    >
      {percentage}%
    </Badge>
  )
}