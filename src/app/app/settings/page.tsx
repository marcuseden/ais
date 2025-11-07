"use client"

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || '');
        setUserProfile({
          fullName: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          company: user.user_metadata?.company || '',
        });
      }
    });
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/app/map">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                  {userProfile?.fullName?.charAt(0) || 'E'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{userProfile?.fullName || 'Loading...'}</div>
                  <div className="text-sm text-muted-foreground">{userEmail || 'Loading...'}</div>
                  {userProfile?.company && (
                    <div className="text-sm text-muted-foreground">{userProfile.company}</div>
                  )}
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-3">
                {userProfile?.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Phone Number</div>
                      <div className="font-medium">{userProfile.phone}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="font-medium">{userEmail}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About AIS Alert</CardTitle>
              <CardDescription>Real-time Baltic Sea vessel tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                AIS Alert provides real-time vessel tracking for the Baltic Sea region
                using publicly available AIS data.
              </p>
              <p className="pt-2">
                <strong>Data Sources:</strong>
                <br />
                AIS data provided by AISStream
                <br />
                Map tiles © OpenStreetMap contributors
              </p>
              <p className="pt-2">
                <strong>Privacy:</strong>
                <br />
                We only use publicly available maritime data. No personal information
                is collected without consent. GDPR compliant.
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

