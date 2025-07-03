export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  return validTypes.includes(file.type) && file.size <= maxSize
}

export const createImageUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const downloadImage = (canvas: HTMLCanvasElement, filename: string) => {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export const downloadZip = async (pages: any[], projectName: string) => {
  // In a real implementation, this would create a ZIP file
  // For now, we'll simulate the download
  const blob = new Blob(['Simulated ZIP content'], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${projectName}.zip`
  link.click()
  URL.revokeObjectURL(url)
}