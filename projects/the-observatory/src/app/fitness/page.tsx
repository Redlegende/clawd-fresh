'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Heart, Moon, Flame, TrendingUp, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react"
import { createClient } from '@supabase/supabase-js'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function Battery({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="16" height="10" rx="2" />
      <path d="M22 11v2" />
    </svg>
  )
}

export default function FitnessPage() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('fitness_metrics')
      .select('*')
      .order('date', { ascending: false })
      .limit(30)

    if (error) console.error('Fitness data error:', error)
    setMetrics(data || [])
    setLoading(false)
  }

  async function handleSync() {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const res = await fetch('/api/fitness/sync', { method: 'POST' })
      const data = await res.json()
      setSyncMessage(data.message || 'Sync request sent!')
      await fetchData()
    } catch (error) {
      setSyncMessage('Sync request failed. Try again.')
    } finally {
      setSyncing(false)
    }
  }

  const latest = metrics[0] || null
  const hasData = metrics.length > 0

  const avgBodyBattery = metrics.length
    ? Math.round(metrics.reduce((sum, m) => sum + (m.body_battery || 0), 0) / (metrics.filter(m => m.body_battery).length || 1))
    : null
  const avgSleep = metrics.length
    ? (metrics.reduce((sum, m) => sum + (m.sleep_hours || 0), 0) / (metrics.filter(m => m.sleep_hours).length || 1)).toFixed(1)
    : null
  const avgRestingHR = metrics.length
    ? Math.round(metrics.reduce((sum, m) => sum + (m.resting_hr || 0), 0) / (metrics.filter(m => m.resting_hr).length || 1))
    : null

  const latestDate = latest?.date ? new Date(latest.date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  }) : 'No data'

  const daysSinceSync = latest?.date
    ? Math.floor((Date.now() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24))
    : null

  const last7Days = metrics.slice(0, 7).reverse()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">💪 Fitness Lab</h1>
          <p className="text-muted-foreground mt-1 text-sm">Garmin Epix Pro data and health metrics</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Requesting Sync...' : 'Sync Garmin'}
        </Button>
      </div>

      {syncMessage && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
          {syncMessage}
        </div>
      )}

      {/* Sync Status Banner */}
      {daysSinceSync !== null && daysSinceSync > 1 && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Data is {daysSinceSync} days old — Last sync: {latestDate}
            </CardTitle>
            <CardDescription className="text-amber-400/70">
              Click &quot;Sync Garmin&quot; to request fresh data from your Garmin Epix Pro.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Connection Status */}
      <Card className={hasData ? "border-green-500/20 bg-green-500/5" : "border-blue-500/20 bg-blue-500/5"}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 text-sm ${hasData ? "text-green-400" : "text-blue-400"}`}>
            {hasData ? <CheckCircle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
            {hasData ? "Garmin Connected" : "Garmin Integration"}
          </CardTitle>
          <CardDescription>
            {hasData
              ? `Last sync: ${latestDate} · ${metrics.length} days of data`
              : "Connect your Garmin Epix Pro to sync sleep, Body Battery, VO2 Max, and more."
            }
          </CardDescription>
        </CardHeader>
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
              {avgBodyBattery ? `Avg: ${avgBodyBattery}` : '/100'}
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
              {avgRestingHR ? `Avg: ${avgRestingHR}` : 'bpm'}
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
            <p className="text-xs text-muted-foreground">latest</p>
          </CardContent>
        </Card>
      </div>

      {/* Sleep Hours Card */}
      {latest?.sleep_hours && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-indigo-500" />
              Sleep Last Night
            </CardTitle>
            <CardDescription>{latest.sleep_hours} hours · {latestDate}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-indigo-400">{latest.sleep_hours}h</div>
              <div className="text-sm text-muted-foreground">
                {avgSleep && <p>7-day average: {avgSleep}h</p>}
                <p className={Number(latest.sleep_hours) >= 7 ? 'text-green-400' : 'text-amber-400'}>
                  {Number(latest.sleep_hours) >= 7 ? '✅ Good sleep' : '⚠️ Below 7h target'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Charts */}
      {metrics.length > 3 && (() => {
        const chartData = metrics
          .slice(0, 14)
          .reverse()
          .map(m => ({
            date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            bodyBattery: m.body_battery,
            sleepHours: m.sleep_hours ? Number(m.sleep_hours) : null,
            restingHR: m.resting_hr,
            steps: m.steps,
            sleepScore: m.sleep_score,
          }))

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Body Battery Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Battery className="h-4 w-4 text-green-500" />
                  Body Battery Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#888' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="bodyBattery" stroke="#22c55e" fill="url(#bbGrad)" strokeWidth={2} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sleep Hours Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-500" />
                  Sleep Hours Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} />
                    <YAxis domain={[4, 10]} tick={{ fontSize: 10, fill: '#888' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="sleepHours" stroke="#6366f1" fill="url(#sleepGrad)" strokeWidth={2} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resting HR Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Resting Heart Rate Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#888' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="restingHR" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Steps Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Daily Steps Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="stepsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="steps" stroke="#f97316" fill="url(#stepsGrad)" strokeWidth={2} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )
      })()}

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
                  {last7Days.map((day: any) => (
                    <tr key={day.date} className="border-b last:border-0">
                      <td className="py-2">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                      <td className="text-center py-2">
                        {day.body_battery ? (
                          <span className={day.body_battery >= 70 ? 'text-green-400' : day.body_battery >= 50 ? 'text-amber-400' : 'text-red-400'}>
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