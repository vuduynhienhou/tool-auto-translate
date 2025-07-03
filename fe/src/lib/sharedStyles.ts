export const sharedStyles = {
  modal: {
    overlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    content: 'bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto',
    header: 'flex items-center justify-between mb-4',
    title: 'text-lg font-semibold',
    closeButton: 'text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100',
    footer: 'mt-6 flex justify-end space-x-2',
  },
  
  button: {
    base: 'px-4 py-2 rounded font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  },
  
  card: {
    base: 'bg-white rounded-lg border border-gray-200',
    padding: 'p-4',
    shadow: 'shadow-sm',
    hover: 'hover:shadow-md transition-shadow duration-200',
    interactive: 'cursor-pointer hover:bg-gray-50',
  },
  
  input: {
    base: 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
    error: 'border-red-500 focus:ring-red-500 focus:border-red-500',
    disabled: 'bg-gray-100 cursor-not-allowed',
  },
  
  dragDrop: {
    area: 'border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors duration-200',
    active: 'border-blue-500 bg-blue-50',
    hover: 'border-gray-400 bg-gray-50',
  },
  
  layout: {
    container: 'container mx-auto px-4',
    pageHeader: 'mb-8',
    section: 'mb-6',
    grid: 'grid gap-4',
    flexCenter: 'flex items-center justify-center',
    flexBetween: 'flex items-center justify-between',
  },
  
  text: {
    heading1: 'text-3xl font-bold text-gray-900',
    heading2: 'text-2xl font-semibold text-gray-900',
    heading3: 'text-lg font-medium text-gray-900',
    body: 'text-sm text-gray-700',
    caption: 'text-xs text-gray-500',
    error: 'text-sm text-red-600',
    success: 'text-sm text-green-600',
  },
  
  status: {
    badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800',
  },
  
  progress: {
    bar: 'w-full bg-gray-200 rounded-full h-2',
    fill: 'h-2 bg-blue-600 rounded-full transition-all duration-300',
    text: 'text-sm text-gray-600 mt-1',
  },
  
  animation: {
    fadeIn: 'animate-in fade-in duration-200',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
    slideDown: 'animate-in slide-in-from-top-4 duration-300',
    spin: 'animate-spin',
    pulse: 'animate-pulse',
  },
  
  spacing: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },
};

// Utility function to combine classes
export function combineStyles(...styles: (string | undefined | null | false)[]): string {
  return styles.filter(Boolean).join(' ');
}