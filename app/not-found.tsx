import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="max-w-md w-full border-gray-200 shadow-lg text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Compass className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            The billboard or resource you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/" className="inline-block w-full">
            <Button variant="default" className="w-full gap-1.5">
              <Home className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
