'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, CheckCircle, AlertCircle, Link2, Unlink, Bell, Settings } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CalendarConnection {
  id: string;
  provider: string;
  email: string;
  sync_enabled: boolean;
  last_synced_at: string | null;
  webhook_expiration: string | null;
  scopes: string[];
  calendars: { id: string; summary: string; primary: boolean }[];
}

export default function SettingsPage() {
  const [connection, setConnection] = useState<CalendarConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchConnection();
    
    // Check for query params safely
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'calendar_connected') {
        setMessage({ type: 'success', text: 'Calendar connected successfully!' });
        window.history.replaceState({}, '', window.location.pathname);
      } else if (params.get('error')) {
        const error = params.get('error');
        const errorMessages: Record<string, string> = {
          'oauth_denied': 'Access denied. You can reconnect anytime.',
          'no_code': 'Authentication failed. Please try again.',
          'db_error': 'Failed to save calendar. Please try again.',
          'oauth_failed': 'Google authentication failed. Please try again.',
        };
        setMessage({ type: 'error', text: errorMessages[error!] || 'Something went wrong.' });
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  async function fetchConnection() {
    try {
      const { data, error } = await supabase
        .from('calendars')
        .select('*')
        .eq('user_id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61')
        .eq('provider', 'google')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching connection:', error);
      }

      setConnection(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    window.location.href = '/api/auth/google';
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect your calendar?')) return;

    try {
      const { error } = await supabase
        .from('calendars')
        .delete()
        .eq('user_id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61')
        .eq('provider', 'google');

      if (error) throw error;

      setConnection(null);
      setMessage({ type: 'success', text: 'Calendar disconnected.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect calendar.' });
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const response = await fetch('/api/calendar/sync-all', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: `Synced ${data.total_events_synced || 0} events!` 
        });
        fetchConnection();
      } else {
        setMessage({ type: 'error', text: 'Sync failed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Sync failed.' });
    } finally {
      setSyncing(false);
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage your integrations and preferences</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your integrations and preferences</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to enable task scheduling and conflict detection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
            </div>
          ) : connection ? (
            <>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {connection.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{connection.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Last synced: {connection.last_synced_at
                        ? new Date(connection.last_synced_at).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
                <Badge variant={connection.sync_enabled ? 'default' : 'secondary'}>
                  {connection.sync_enabled ? 'Connected' : 'Paused'}
                </Badge>
              </div>

              {connection.calendars && connection.calendars.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Connected Calendars:</p>
                  <div className="flex flex-wrap gap-2">
                    {connection.calendars.map((cal) => (
                      <Badge key={cal.id} variant="outline">
                        {cal.summary}
                        {cal.primary && (
                          <span className="ml-1 text-cyan-500">★</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={handleSync} disabled={syncing} variant="outline">
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                
                <Button onClick={handleDisconnect} variant="destructive">
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-4">
                No calendar connected. Connect your Google Calendar to get started.
              </p>
              <Button onClick={handleConnect} size="lg">
                <Link2 className="w-4 h-4 mr-2" />
                Connect Google Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you want to be notified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notification settings will be available soon.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              General
            </CardTitle>
            <CardDescription>
              App preferences and defaults.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              General settings will be available soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
