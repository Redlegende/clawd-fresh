'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
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
  last_sync_at: string | null;
  scopes: string[];
  calendars: { id: string; summary: string; primary: boolean }[];
}

export default function SettingsPage() {
  const [connection, setConnection] = useState<CalendarConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConnection();
    
    // Check for query params
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'calendar_connected') {
      setMessage({ type: 'success', text: 'Calendar connected successfully!' });
    } else if (params.get('error')) {
      setMessage({ type: 'error', text: 'Failed to connect calendar. Please try again.' });
    }
  }, []);

  async function fetchConnection() {
    try {
      const { data, error } = await supabase
        .from('orchestrator.calendars')
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
        .from('orchestrator.calendars')
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
    setLoading(true);
    try {
      const response = await fetch('/api/calendar/sync', { method: 'POST' });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Calendar synced!' });
        fetchConnection();
      } else {
        setMessage({ type: 'error', text: 'Sync failed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Sync failed.' });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
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
          {connection ? (
            <>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">{connection.email}</p>
                  <p className="text-sm text-gray-500">
                    Last synced: {connection.last_sync_at
                      ? new Date(connection.last_sync_at).toLocaleString()
                      : 'Never'}
                  </p>
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
                          <span className="ml-1 text-cyan-500">(primary)</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSync} disabled={loading} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </Button>
                <Button onClick={handleDisconnect} variant="destructive">
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
                Connect Google Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
