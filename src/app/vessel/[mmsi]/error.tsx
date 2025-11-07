'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ship, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function VesselError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Vessel page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/map')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Vessel Details</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <div className="relative">
                <Ship className="h-16 w-16 text-muted-foreground mx-auto" />
                <AlertTriangle className="h-8 w-8 text-red-500 absolute -top-2 -right-2" />
              </div>
            </div>
            <CardTitle className="text-2xl">Unable to Load Vessel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We encountered an error while loading the vessel information. This might be due to:
            </p>
            <ul className="text-sm text-muted-foreground text-left space-y-1 max-w-md mx-auto">
              <li>• Network connectivity issues</li>
              <li>• Invalid vessel identifier</li>
              <li>• Temporary service unavailability</li>
            </ul>
            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={() => reset()} variant="default">
                Try Again
              </Button>
              <Button onClick={() => router.push('/map')} variant="outline">
                Back to Map
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
