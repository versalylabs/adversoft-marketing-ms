import { Loader2 } from 'lucide-react';

interface LoadingProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loading({ label = 'Loading...', size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <Loader2 className={`${sizeClasses} animate-spin text-indigo-600`} />
      {label && <p className="text-sm font-medium text-gray-500">{label}</p>}
    </div>
  );
}