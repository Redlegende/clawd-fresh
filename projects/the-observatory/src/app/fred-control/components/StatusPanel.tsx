"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, CheckCircle, AlertCircle, Database } from "lucide-react";

interface SystemStatus {
  git: {
    clean: boolean;
    lastCommit: string;
    branch: string;
  };
  supabase: {
    connected: boolean;
  };
  health: {
    status: "ok" | "warning" | "error";
    issues: string[];
  };
  cronJobs: number;
}

export function StatusPanel() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Fetch git status
      const gitRes = await fetch("/api/fred/git/status");
      const gitData = await gitRes.json();

      // For now, use placeholder data for other systems
      setStatus({
        git: {
          clean: gitData.clean,
          lastCommit: gitData.lastCommit || "Unknown",
          branch: gitData.branch || "main",
        },
        supabase: {
          connected: false, // TODO: Check actual connection
        },
        health: {
          status: "ok",
          issues: [],
        },
        cronJobs: 4, // TODO: Fetch from actual cron
      });
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading status...</div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Failed to load status</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Git Status */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <GitBranch className="h-5 w-5 text-purple-500" />
            <div className="flex-1">
              <div className="text-sm font-medium">Git Repository</div>
              <div className="text-xs text-muted-foreground">
                {status.git.branch} • {status.git.lastCommit}
              </div>
            </div>
            {status.git.clean ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Clean
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Changes
              </Badge>
            )}
          </div>

          {/* Supabase Status */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Database className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <div className="text-sm font-medium">Supabase</div>
              <div className="text-xs text-muted-foreground">Task Database</div>
            </div>
            {status.supabase.connected ? (
              <Badge variant="default" className="bg-green-500">Connected</Badge>
            ) : (
              <Badge variant="outline" className="text-amber-500 border-amber-500">
                Not Configured
              </Badge>
            )}
          </div>

          {/* Health Status */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div className="flex-1">
              <div className="text-sm font-medium">Workspace Health</div>
              <div className="text-xs text-muted-foreground">
                {status.health.issues.length === 0
                  ? "No issues found"
                  : `${status.health.issues.length} issues`}
              </div>
            </div>
            <Badge
              variant={status.health.status === "ok" ? "default" : "destructive"}
              className={status.health.status === "ok" ? "bg-green-500" : ""}
            >
              {status.health.status === "ok" ? "Healthy" : "Issues"}
            </Badge>
          </div>

          {/* Cron Jobs */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="h-5 w-5 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold">
              ⏰
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Cron Jobs</div>
              <div className="text-xs text-muted-foreground">Scheduled tasks</div>
            </div>
            <Badge variant="secondary">{status.cronJobs} active</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
