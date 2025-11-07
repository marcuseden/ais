"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Ship, Bell, ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface AlertRule {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  geofences: { name: string } | null;
}

interface AlertEvent {
  id: number;
  mmsi: number;
  vessel_name: string | null;
  event_type: string;
  event_ts: string;
  details: any;
}

export default function AlertsPage() {
  const { toast } = useToast();
  const { data, error } = useSWR('/api/alerts', fetcher, {
    refreshInterval: 30000,
  });

  const rules: AlertRule[] = data?.rules || [];
  const events: AlertEvent[] = data?.events || [];

  const handleToggle = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/alerts/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) throw new Error('Failed to update alert');

      mutate('/api/alerts');
      
      toast({
        title: isActive ? 'Alert enabled' : 'Alert disabled',
        description: 'Your alert rule has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update alert rule.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) return;

    try {
      const response = await fetch(`/api/alerts/${ruleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete alert');

      mutate('/api/alerts');
      
      toast({
        title: 'Alert deleted',
        description: 'The alert rule has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete alert rule.',
        variant: 'destructive',
      });
    }
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
              <h1 className="text-2xl font-bold">Alerts</h1>
              <p className="text-sm text-muted-foreground">
                Manage your vessel tracking alerts
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Alert Rules */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Active Alert Rules</h2>
            
            {rules.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No alert rules configured yet.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Alert rules are automatically created for new users.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <Card key={rule.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{rule.name}</CardTitle>
                          <CardDescription>
                            {rule.geofences?.name || 'Unknown geofence'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={(checked) =>
                              handleToggle(rule.id, checked)
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Events */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Alerts</h2>
            
            {events.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No alerts triggered yet.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    You'll see notifications here when vessels enter your monitored zones.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <Ship className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base">
                            {event.vessel_name || `MMSI ${event.mmsi}`}
                          </CardTitle>
                          <CardDescription>
                            Entered {event.details?.geofence_name || 'monitored zone'}
                          </CardDescription>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(event.event_ts), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

