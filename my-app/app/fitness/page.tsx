import { Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function FitnessLab() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Fitness Lab</h1>
          <p className="text-slate-400">Track your health and performance metrics</p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-12 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Coming Soon</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Fitness Lab is under development. This module will sync with your Garmin 
            device to display Body Battery, VO2 Max, and workout analytics.
          </p>
          <Button variant="outline" className="border-slate-700 text-slate-300">
            Notify Me When Ready
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
