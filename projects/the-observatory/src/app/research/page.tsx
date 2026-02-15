'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileText, Search, Tag, Clock, FolderOpen, Activity, RefreshCw, ArrowLeft, BookOpen, ChevronRight } from "lucide-react"
import { createClient } from '@supabase/supabase-js'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Project {
  id: string
  name: string
  description?: string
  status: string
  health_score?: number
  folder_path?: string
  updated_at?: string
}

interface ResearchNote {
  id: string
  title: string
  slug?: string
  file_path: string
  category?: string
  tags?: string[]
  summary?: string
  content?: string
  key_insights?: string[]
  status?: string
  read_count?: number
  project_id?: string
  created_at?: string
  updated_at?: string
}

const CATEGORIES = ['All', 'api-research', 'project-docs', 'health-research', 'content', 'system-docs']
const CATEGORY_LABELS: Record<string, string> = {
  'All': 'All',
  'api-research': 'API Research',
  'project-docs': 'Project Docs',
  'health-research': 'Health',
  'content': 'Content',
  'system-docs': 'System',
}

export default function ResearchPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [notes, setNotes] = useState<ResearchNote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedNote, setSelectedNote] = useState<ResearchNote | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [projectsRes, notesRes] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .in('status', ['active', 'paused'])
        .order('priority', { ascending: false }),
      supabase
        .from('research_notes')
        .select('id, title, slug, file_path, category, tags, summary, key_insights, status, read_count, project_id, created_at, updated_at')
        .order('updated_at', { ascending: false })
    ])

    setProjects(projectsRes.data || [])
    setNotes(notesRes.data || [])
    setLoading(false)
  }

  async function openNote(note: ResearchNote) {
    setLoadingContent(true)
    setSelectedNote({ ...note, content: note.content || undefined })
    window.scrollTo(0, 0)

    // Fetch full content
    const { data } = await supabase
      .from('research_notes')
      .select('content, key_insights')
      .eq('id', note.id)
      .single()

    if (data) {
      setSelectedNote(prev => prev ? { ...prev, content: data.content, key_insights: data.key_insights } : null)
      // Update local cache
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, content: data.content, key_insights: data.key_insights } : n))
    }

    setLoadingContent(false)

    // Increment read count (fire and forget)
    supabase
      .from('research_notes')
      .update({
        read_count: (note.read_count || 0) + 1,
        last_read_at: new Date().toISOString()
      })
      .eq('id', note.id)
      .then(() => {})
  }

  const filteredNotes = notes.filter(n => {
    const matchesSearch = !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = activeCategory === 'All' ||
      n.category?.toLowerCase() === activeCategory.toLowerCase() ||
      n.tags?.some(t => t.toLowerCase() === activeCategory.toLowerCase())

    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-cyan-500" />
      </div>
    )
  }

  // Full-screen reader view
  if (selectedNote) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedNote(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Research
          </Button>
          {selectedNote.category && (
            <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[selectedNote.category] || selectedNote.category}</Badge>
          )}
        </div>

        <div className="max-w-4xl">
          <h1 className="text-2xl lg:text-3xl font-bold">{selectedNote.title}</h1>

          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {selectedNote.updated_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(selectedNote.updated_at).toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            {selectedNote.read_count !== undefined && (
              <span>{selectedNote.read_count} reads</span>
            )}
            <span className="font-mono text-xs">{selectedNote.file_path}</span>
          </div>

          {selectedNote.tags && selectedNote.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {selectedNote.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Key Insights */}
          {selectedNote.key_insights && selectedNote.key_insights.length > 0 && (
            <Card className="mt-4 border-cyan-500/20 bg-cyan-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-cyan-400">Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {selectedNote.key_insights.map((insight, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-cyan-400 shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {loadingContent ? (
            <div className="flex items-center justify-center h-32 mt-6">
              <RefreshCw className="h-5 w-5 animate-spin text-cyan-500" />
            </div>
          ) : selectedNote.content ? (
            <div className="mt-6 md-content max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedNote.content}</ReactMarkdown>
            </div>
          ) : selectedNote.summary ? (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground italic">No full content available. Summary:</p>
                <p className="text-sm mt-2">{selectedNote.summary}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-6">
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No content available for this note yet.</p>
                <p className="text-xs mt-1">Content will appear here when research is saved to the database.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Research</h1>
        <p className="text-muted-foreground mt-1 text-sm">Active projects and research knowledge base</p>
      </div>

      {/* Active Projects Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-cyan-400" />
          Active Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <Card key={project.id} className="hover:border-cyan-500/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {project.status}
                  </Badge>
                  {project.health_score !== null && project.health_score !== undefined && (
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span className={`text-xs font-medium ${
                        project.health_score >= 70 ? 'text-green-400' :
                        project.health_score >= 40 ? 'text-amber-400' : 'text-red-400'
                      }`}>{project.health_score}%</span>
                    </div>
                  )}
                </div>
                <CardTitle className="text-base mt-2">{project.name}</CardTitle>
                {project.description && (
                  <CardDescription className="text-xs line-clamp-2">{project.description}</CardDescription>
                )}
              </CardHeader>
              {project.folder_path && (
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {project.folder_path}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <p>No active projects found</p>
            </div>
          )}
        </div>
      </div>

      {/* Research Notes Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          Research Notes ({filteredNotes.length})
        </h2>

        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search research notes..."
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          {CATEGORIES.map(cat => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_LABELS[cat] || cat}
            </Badge>
          ))}
        </div>

        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map(note => (
              <Card
                key={note.id}
                className="hover:border-purple-500/30 transition-colors cursor-pointer group"
                onClick={() => openNote(note)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    {note.category && <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[note.category] || note.category}</Badge>}
                    <div className="flex items-center gap-2">
                      {note.content && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <BookOpen className="h-3 w-3" />
                          Full
                        </Badge>
                      )}
                      {note.read_count !== undefined && note.read_count > 0 && (
                        <span className="flex items-center text-muted-foreground text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {note.read_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-base mt-2 group-hover:text-cyan-400 transition-colors">{note.title}</CardTitle>
                  {note.summary && (
                    <CardDescription className="line-clamp-3 text-xs">{note.summary}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground font-mono truncate">{note.file_path}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {notes.length === 0 ? (
                <>
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No research notes yet</p>
                  <p className="text-sm mt-1">Ask Fred to research a topic and it&apos;ll show up here.</p>
                </>
              ) : (
                <p>No notes match your search</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
