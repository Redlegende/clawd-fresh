'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, BookOpen, Clock, Tag, ExternalLink, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface ResearchNote {
  id: string
  title: string
  content: string
  topic: string
  tags: string[]
  source_url?: string
  created_at: string
  updated_at: string
}

const topics = ['All', 'AI', 'Health', 'Business', 'Tech', 'Finance', 'Other']

export default function ResearchReader() {
  const [notes, setNotes] = useState<ResearchNote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [selectedNote, setSelectedNote] = useState<ResearchNote | null>(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  async function fetchNotes() {
    try {
      const { data } = await supabase
        .from('research_notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setNotes(data)
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTopic = selectedTopic === 'All' || note.topic === selectedTopic
    return matchesSearch && matchesTopic
  })

  return (
    <div className="p-8 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Research Reader</h1>
          <p className="text-slate-400">Your knowledge base and research notes</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            type="text"
            placeholder="Search research notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          {topics.map((topic) => (
            <Button
              key={topic}
              variant={selectedTopic === topic ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTopic(topic)}
              className={selectedTopic === topic 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'border-slate-700 text-slate-400 hover:text-slate-200'
              }
            >
              {topic}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
        {/* Notes List */}
        <div className="col-span-1 overflow-y-auto space-y-3 pr-2">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No research notes found</p>
              <Button variant="outline" className="mt-4 border-slate-700 text-slate-300">
                Create your first note
              </Button>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <Card 
                key={note.id}
                className={`cursor-pointer transition-all ${
                  selectedNote?.id === note.id 
                    ? 'bg-slate-800 border-emerald-500/30' 
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => setSelectedNote(note)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-200 line-clamp-2 mb-1">{note.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs border-emerald-500/30 text-emerald-400"
                        >
                          {note.topic}
                        </Badge>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(note.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Note Detail */}
        <div className="col-span-2 overflow-y-auto">
          {selectedNote ? (
            <Card className="bg-slate-900/50 border-slate-800 h-full">
              <CardHeader className="border-b border-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Badge 
                      variant="outline" 
                      className="mb-3 border-emerald-500/30 text-emerald-400"
                    >
                      {selectedNote.topic}
                    </Badge>
                    <CardTitle className="text-2xl text-slate-100">{selectedNote.title}</CardTitle>
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Created {new Date(selectedNote.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {selectedNote.source_url && (
                        <a 
                          href={selectedNote.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Source
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                {selectedNote.tags && selectedNote.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {selectedNote.tags.map((tag) => (
                      <Badge 
                        key={tag}
                        variant="outline" 
                        className="border-slate-700 text-slate-400"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-invert max-w-none">
                  {selectedNote.content ? (
                    <div className="text-slate-300 whitespace-pre-wrap">
                      {selectedNote.content}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No content yet...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Select a note to read</p>
                <p className="text-sm mt-2">Or create a new research note</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
