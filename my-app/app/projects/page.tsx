import { FolderKanban } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Projects() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
          <FolderKanban className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Projects</h1>
          <p className="text-slate-400">Project overview and roadmaps</p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-12 text-center">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Coming Soon</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Projects dashboard is under development. This will display all your 
            active projects with roadmaps, milestones, and progress tracking.
          </p>
          <Button variant="outline" className="border-slate-700 text-slate-300">
            Notify Me When Ready
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
