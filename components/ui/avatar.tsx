import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
}

export function Avatar({ src, alt = "", fallback = "AD", className, ...props }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false)

  return (
    <div
      className={cn(
        "relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100 font-medium text-xs text-gray-700",
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-700 font-semibold uppercase">
          {fallback.slice(0, 2)}
        </div>
      )}
    </div>
  )
}
