"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="max-w-md w-full border-rose-200 shadow-lg text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            An unexpected error occurred in Adversoft.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-rose-50 p-3 text-left">
            <p className="text-xs font-mono text-rose-800 break-all">
              {error?.message || 'Unknown runtime error'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => reset()}
              variant="default"
              size="sm"
              className="gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try again</span>
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Home className="h-4 w-4" />
                <span>Return to Dashboard</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
