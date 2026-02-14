'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileText, Search, Tag, Clock, FolderOpen, Activity, RefreshCw, ExternalLink } from "lucide-react"
import { createClient } from '@supabase/supabase-js'

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
        .select('*')
        .order('updated_at', { ascending: false })
    ])

    setProjects(projectsRes.data || [])
    setNotes(notesRes.data || [])
    setLoading(false)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">📚 Research</h1>
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
          Research Notes
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
                className="hover:border-purple-500/30 transition-colors cursor-pointer"
                onClick={() => setSelectedNote(selectedNote?.id === note.id ? null : note)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    {note.category && <Badge variant="outline" className="text-xs">{note.category}</Badge>}
                    {note.read_count !== undefined && note.read_count > 0 && (
                      <div className="flex items-center text-muted-foreground text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {note.read_count} reads
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-base mt-2">{note.title}</CardTitle>
                  {note.summary && (
                    <CardDescription className="line-clamp-2 text-xs">{note.summary}</CardDescription>
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
                  
                  {selectedNote?.id === note.id && note.summary && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium mb-1">Summary:</p>
                      <p className="text-muted-foreground">{note.summary}</p>
                    </div>
                  )}
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
                  <p className="text-sm mt-1">Research notes will appear here when indexed from your workspace md files.</p>
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
