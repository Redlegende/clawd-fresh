import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Heart, Moon, Flame, TrendingUp } from "lucide-react"

const fitnessCards = [
  { title: 'VO2 Max', value: '--', unit: 'ml/kg/min', icon: TrendingUp, color: 'text-blue-500' },
  { title: 'Body Battery', value: '--', unit: '/100', icon: Battery, color: 'text-green-500' },
  { title: 'HRV', value: '--', unit: 'ms', icon: Activity, color: 'text-purple-500' },
  { title: 'Sleep Score', value: '--', unit: '/100', icon: Moon, color: 'text-indigo-500' },
  { title: 'Resting HR', value: '--', unit: 'bpm', icon: Heart, color: 'text-red-500' },
  { title: 'Steps', value: '--', unit: 'today', icon: Flame, color: 'text-orange-500' },
]

function Battery({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="16" height="10" rx="2" />
      <path d="M22 11v2" />
    </svg>
  )
}

export default function FitnessPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">💪 Fitness Lab</h1>
        <p className="text-muted-foreground mt-1">Garmin data and health metrics</p>
      </div>

      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Activity className="h-5 w-5" />
            🔌 Garmin Integration
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Connect your Garmin Epix Pro to sync sleep, Body Battery, VO2 Max, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p>Status: <Badge variant="outline">Waiting for credentials</Badge></p>
            <p className="text-xs mt-2">Required: Garmin Connect username/password</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {fitnessCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.unit}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>📊 Weekly Trends</CardTitle>
            <CardDescription>7-day rolling averages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Connect Garmin to see charts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>😴 Sleep Analysis</CardTitle>
            <CardDescription>Sleep score and duration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Connect Garmin to see sleep data
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
