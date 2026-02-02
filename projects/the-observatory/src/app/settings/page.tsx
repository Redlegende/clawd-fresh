'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, CheckCircle, AlertCircle, Link2, Unlink, Bell } from 'lucide-react';
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

interface WebhookStatus {
  connected: boolean;
  webhook_active: boolean;
  webhook_expires_at: string | null;
  sync_enabled: boolean;
  last_sync_at: string | null;
}

export default function SettingsPage() {
  const [connection, setConnection] = useState<CalendarConnection | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConnection();
    fetchWebhookStatus();
    
    // Check for query params
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'calendar_connected') {
      setMessage({ type: 'success', text: 'Calendar connected successfully!' });
      // Clear params
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

  async function fetchWebhookStatus() {
    try {
      const response = await fetch('/api/calendar/webhook/setup');
      if (response.ok) {
        const data = await response.json();
        setWebhookStatus(data);
      }
    } catch (error) {
      console.error('Error fetching webhook status:', error);
    }
  }

  async function handleConnect() {
    window.location.href = '/api/auth/google';
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect your calendar?')) return;

    try {
      // Stop webhook first
      await fetch('/api/calendar/webhook/setup', { method: 'DELETE' });

      // Delete connection
      const { error } = await supabase
        .from('calendars')
        .delete()
        .eq('user_id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61')
        .eq('provider', 'google');

      if (error) throw error;

      setConnection(null);
      setWebhookStatus(null);
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
          text: `Synced ${data.total_events_synced} events from ${data.calendars_successful} calendars!` 
        });
        fetchConnection();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Sync failed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Sync failed.' });
    } finally {
      setSyncing(false);
    }
  }

  async function handleSetupWebhook() {
    setSyncing(true);
    try {
      const response = await fetch('/api/calendar/webhook/setup', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: `Real-time sync enabled! Expires ${new Date(data.expiration).toLocaleDateString()}` 
        });
        fetchWebhookStatus();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Webhook setup failed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Webhook setup failed.' });
    } finally {
      setSyncing(false);
    }
  }

  const isWebhookExpired = webhookStatus?.webhook_expires_at 
    ? new Date(webhookStatus.webhook_expires_at) < new Date()
    : true;

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

              {/* Webhook Status */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Bell className={`w-4 h-4 ${webhookStatus?.webhook_active && !isWebhookExpired ? 'text-green-500' : 'text-gray-400'}`} />
                <span className="text-sm">
                  {webhookStatus?.webhook_active && !isWebhookExpired 
                    ? `Real-time sync active (expires ${new Date(webhookStatus.webhook_expires_at!).toLocaleDateString()})`
                    : 'Real-time sync inactive'
                  }
                </span>
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

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSync} disabled={syncing} variant="outline">
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                
                {(!webhookStatus?.webhook_active || isWebhookExpired) && (
                  <Button onClick={handleSetupWebhook} disabled={syncing} variant="outline">
                    <Bell className="w-4 h-4 mr-2" />
                    Enable Real-time Sync
                  </Button>
                )}
                
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
    </div>
  );
}
