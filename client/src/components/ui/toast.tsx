import { toast as sonnerToast } from 'sonner'

export function toast({ title, description, status = 'default' }: { title: string; description?: string; status?: 'default' | 'success' | 'error' | 'warning' }) {
  sonnerToast(
    <div>
      <div className="font-semibold">{title}</div>
      {description && <div className="text-xs text-gray-400 mt-1">{description}</div>}
    </div>,
    {
      className:
        status === 'success'
          ? 'bg-green-700 text-white'
          : status === 'error'
          ? 'bg-red-700 text-white'
          : status === 'warning'
          ? 'bg-yellow-700 text-white'
          : 'bg-gray-800 text-white',
    }
  )
}
