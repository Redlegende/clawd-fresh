import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Heart, Moon, Flame, TrendingUp, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

async function getFitnessData() {
  // Fetch last 30 days of fitness data
  const { data: metrics, error } = await supabase
    .from('fitness_metrics')
    .select('*')
    .order('date', { ascending: false })
    .limit(30)

  if (error) {
    console.error('Fitness data error:', error)
    return { metrics: [], latest: null }
  }

  const latest = metrics?.[0] || null
  
  // Calculate averages
  const avgBodyBattery = metrics?.length 
    ? Math.round(metrics.reduce((sum, m) => sum + (m.body_battery || 0), 0) / metrics.filter(m => m.body_battery).length)
    : null
  
  const avgSleep = metrics?.length
    ? (metrics.reduce((sum, m) => sum + (m.sleep_hours || 0), 0) / metrics.filter(m => m.sleep_hours).length).toFixed(1)
    : null

  const avgRestingHR = metrics?.length
    ? Math.round(metrics.reduce((sum, m) => sum + (m.resting_hr || 0), 0) / metrics.filter(m => m.resting_hr).length)
    : null

  return { 
    metrics: metrics || [], 
    latest,
    averages: {
      bodyBattery: avgBodyBattery,
      sleep: avgSleep,
      restingHR: avgRestingHR
    }
  }
}

function Battery({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="16" height="10" rx="2" />
      <path d="M22 11v2" />
    </svg>
  )
}

export default async function FitnessPage() {
  const { metrics, latest, averages } = await getFitnessData()
  
  const hasData = metrics.length > 0
  const latestDate = latest?.date ? new Date(latest.date).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }) : 'No data'

  // Get last 7 days for charts
  const last7Days = metrics.slice(0, 7).reverse()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">💪 Fitness Lab</h1>
        <p className="text-muted-foreground mt-1">Garmin Epix Pro data and health metrics</p>
      </div>

      {/* Connection Status */}
      <Card className={hasData ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-blue-200 bg-blue-50 dark:bg-blue-950/20"}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${hasData ? "text-green-800 dark:text-green-200" : "text-blue-800 dark:text-blue-200"}`}>
            {hasData ? <CheckCircle className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
            {hasData ? "✅ Garmin Connected" : "🔌 Garmin Integration"}
          </CardTitle>
          <CardDescription className={hasData ? "text-green-700 dark:text-green-300" : "text-blue-700 dark:text-blue-300"}>
            {hasData 
              ? `Last sync: ${latestDate} • ${metrics.length} days of data`
              : "Connect your Garmin Epix Pro to sync sleep, Body Battery, VO2 Max, and more."
            }
          </CardDescription>
        </CardHeader>
        {hasData && (
          <CardContent>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <p>Data source: <Badge variant="outline" className="bg-green-100">Garmin Connect</Badge></p>
              <p className="text-xs mt-2">Auto-sync: Daily at 6:00 AM</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VO2 Max</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latest?.vo2_max || '--'}</div>
            <p className="text-xs text-muted-foreground">ml/kg/min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Body Battery</CardTitle>
            <Battery className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latest?.body_battery || '--'}</div>
            <p className="text-xs text-muted-foreground">
              {averages?.bodyBattery ? `Avg: ${averages.bodyBattery}` : '/100'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HRV</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latest?.hrv || '--'}</div>
            <p className="text-xs text-muted-foreground">ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep Score</CardTitle>
            <Moon className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latest?.sleep_score || '--'}</div>
            <p className="text-xs text-muted-foreground">/100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resting HR</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latest?.resting_hr || '--'}</div>
            <p className="text-xs text-muted-foreground">
              {averages?.restingHR ? `Avg: ${averages.restingHR}` : 'bpm'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Steps</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latest?.steps?.toLocaleString() || '--'}</div>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>
      </div>

      {/* Sleep Hours Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-indigo-500" />
            😴 Sleep Last Night
          </CardTitle>
          <CardDescription>
            {latest?.sleep_hours ? `${latest.sleep_hours} hours • ${latestDate}` : 'No sleep data available'}
          </CardDescription>
        </CardHeader>
        {latest?.sleep_hours && (
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-indigo-600">{latest.sleep_hours}h</div>
              <div className="text-sm text-muted-foreground">
                {averages?.sleep && (
                  <p>7-day average: {averages.sleep}h</p>
                )}
                <p className={latest.sleep_hours >= 7 ? 'text-green-600' : 'text-amber-600'}>
                  {latest.sleep_hours >= 7 ? '✅ Good sleep' : '⚠️ Below 7h target'}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Historical Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Last 7 Days</CardTitle>
          <CardDescription>Daily metrics from Garmin Connect</CardDescription>
        </CardHeader>
        <CardContent>
          {last7Days.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-center py-2">Body Battery</th>
                    <th className="text-center py-2">Sleep (h)</th>
                    <th className="text-center py-2">Resting HR</th>
                    <th className="text-center py-2">Steps</th>
                  </tr>
                </thead>
                <tbody>
                  {last7Days.map((day) => (
                    <tr key={day.date} className="border-b last:border-0">
                      <td className="py-2">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                      <td className="text-center py-2">
                        {day.body_battery ? (
                          <span className={day.body_battery >= 70 ? 'text-green-600' : day.body_battery >= 50 ? 'text-amber-600' : 'text-red-600'}>
                            {day.body_battery}
                          </span>
                        ) : '--'}
                      </td>
                      <td className="text-center py-2">{day.sleep_hours || '--'}</td>
                      <td className="text-center py-2">{day.resting_hr || '--'}</td>
                      <td className="text-center py-2">{day.steps?.toLocaleString() || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              No historical data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}