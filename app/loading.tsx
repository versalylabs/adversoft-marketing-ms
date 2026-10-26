import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200/80 bg-white p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-200/80 bg-white p-6 space-y-4 lg:col-span-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="rounded-xl border border-gray-200/80 bg-white p-6 space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  )
}
