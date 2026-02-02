import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, Search, Tag, Clock } from "lucide-react"

const mockNotes = [
  {
    id: 1,
    title: 'L. reuteri + SIBO Protocol',
    category: 'Health',
    tags: ['gut-health', 'probiotics', 'research'],
    summary: 'Dr. Davis protocol for SIBO using L. reuteri yogurt',
    read_count: 5,
  },
  {
    id: 2,
    title: '3dje Boligsektor - Tomte-sourcing',
    category: 'Business',
    tags: ['real-estate', 'henrik', 'kommune'],
    summary: 'System for finding developable land in Norway',
    read_count: 12,
  },
  {
    id: 3,
    title: 'Kvitfjellhytter iGMS Integration',
    category: 'Tech',
    tags: ['api', 'oauth', 'airbnb'],
    summary: 'OAuth flow and API endpoints for IGMS',
    read_count: 8,
  },
]

export default function ResearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📚 Research</h1>
        <p className="text-muted-foreground mt-1">Knowledge base and notes</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search research notes..." 
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['All', 'Health', 'Business', 'Tech', 'AI', 'Fitness'].map((tag) => (
          <Badge 
            key={tag} 
            variant={tag === 'All' ? 'default' : 'secondary'}
            className="cursor-pointer"
          >
            {tag}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockNotes.map((note) => (
          <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge variant="outline">{note.category}</Badge>
                <div className="flex items-center text-muted-foreground text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {note.read_count} reads
                </div>
              </div>
              <CardTitle className="text-lg mt-2">{note.title}</CardTitle>
              <CardDescription className="line-clamp-2">{note.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>📁 Recently Updated</CardTitle>
          <CardDescription>Latest research from your vault</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Gut Health Protocol v2</span>
              </div>
              <span className="text-xs text-muted-foreground">2 days ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">AI Orchestration Patterns</span>
              </div>
              <span className="text-xs text-muted-foreground">5 days ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Kvitfjellhytter Revenue Analysis</span>
              </div>
              <span className="text-xs text-muted-foreground">1 week ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
