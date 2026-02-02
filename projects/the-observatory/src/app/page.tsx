import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Wallet, Kanban, FileText, TrendingUp, AlertCircle } from "lucide-react"

export default function MissionControl() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🎯 Mission Control</h1>
        <p className="text-muted-foreground mt-1">Overview of everything that matters</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Kanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Connect Supabase to see data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VO2 Max</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Connect Garmin to sync</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- kr</div>
            <p className="text-xs text-muted-foreground">Connect Supabase to see data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research Notes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Connect Supabase to see data</p>
          </CardContent>
        </Card>
      </div>

      {/* Setup Status */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-5 w-5" />
            🚧 Setup in Progress
          </CardTitle>
          <CardDescription className="text-amber-700 dark:text-amber-300">
            The Observatory is being built. Here is what is ready and what needs your input:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">✅ Ready</h4>
            <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
              <li>• Next.js 16 app initialized</li>
              <li>• shadcn/ui components installed</li>
              <li>• Database schema designed (5 tables)</li>
              <li>• Garmin skill Python environment ready</li>
              <li>• Folder structure created</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">🔴 Needs Your Input</h4>
            <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
              <li>• Supabase project URL and anon key</li>
              <li>• Garmin Connect credentials</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>🗂️ Projects</CardTitle>
            <CardDescription>Active project health scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Kvitfjellhytter</span>
                <Badge variant="secondary">Soon</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">3dje Boligsektor</span>
                <Badge variant="secondary">Soon</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">The Observatory</span>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 Priority Tasks</CardTitle>
            <CardDescription>Top items from your kanban</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connect Supabase to see your tasks here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
