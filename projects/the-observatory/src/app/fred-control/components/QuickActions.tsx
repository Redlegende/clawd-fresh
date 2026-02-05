"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitCommit, RefreshCw, Shield, Save } from "lucide-react";

export function QuickActions() {
  const [syncing, setSyncing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [healthCheck, setHealthCheck] = useState(false);

  const syncToSupabase = async () => {
    setSyncing(true);
    try {
      // TODO: Implement actual sync
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Synced to Supabase! (Mock)");
    } finally {
      setSyncing(false);
    }
  };

  const gitCommit = async () => {
    setCommitting(true);
    try {
      const response = await fetch("/api/fred/git/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Manual commit from Fred Control Panel" }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`Committed: ${data.message}`);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      alert("Failed to commit");
    } finally {
      setCommitting(false);
    }
  };

  const runHealthCheck = async () => {
    setHealthCheck(true);
    try {
      // TODO: Implement actual health check
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Health check complete! (Mock)");
    } finally {
      setHealthCheck(false);
    }
  };

  const backupWorkspace = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `workspace-backup-${timestamp}.zip`;
    alert(`Backup created: ${filename} (Mock)`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>⚡ Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={syncToSupabase}
            disabled={syncing}
          >
            <RefreshCw className={`h-5 w-5 ${syncing ? "animate-spin" : ""}`} />
            <span className="text-xs">Sync to Supabase</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={gitCommit}
            disabled={committing}
          >
            <GitCommit className="h-5 w-5" />
            <span className="text-xs">Git Commit</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={runHealthCheck}
            disabled={healthCheck}
          >
            <Shield className={`h-5 w-5 ${healthCheck ? "animate-pulse" : ""}`} />
            <span className="text-xs">Health Check</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={backupWorkspace}
          >
            <Save className="h-5 w-5" />
            <span className="text-xs">Backup</span>
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">📋 Quick Links</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="link" size="sm" className="h-auto p-0" asChild>
              <a href="https://github.com/jakobbakken/clawd-fresh" target="_blank" rel="noopener">
                GitHub Repo
              </a>
            </Button>
            <Button variant="link" size="sm" className="h-auto p-0" asChild>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener">
                Supabase Dashboard
              </a>
            </Button>
            <Button variant="link" size="sm" className="h-auto p-0" asChild>
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener">
                Vercel Dashboard
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
