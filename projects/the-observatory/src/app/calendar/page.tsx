'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, Plus, MapPin, Clock, Pencil, Trash2 } from "lucide-react"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  starts_at: string
  ends_at: string
  is_all_day: boolean
  status?: string
  calendar_id?: string
}

interface Task {
  id: string
  title: string
  due_date?: string
  status: string
  priority: string
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: { date: Date; isCurrentMonth: boolean }[] = []

  // Monday-based week (ISO)
  let startDay = firstDay.getDay() - 1
  if (startDay < 0) startDay = 6

  // Previous month days
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({ date: d, isCurrentMonth: false })
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true })
  }

  // Next month days to fill grid
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
  }

  return days
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    starts_at: '',
    ends_at: '',
    is_all_day: false,
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = getMonthDays(year, month)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const startOfMonth = new Date(year, month, 1).toISOString()
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

      const [eventsRes, tasksRes] = await Promise.all([
        supabase
          .from('events')
          .select('*')
          .gte('starts_at', startOfMonth)
          .lte('starts_at', endOfMonth)
          .is('deleted_at', null)
          .order('starts_at', { ascending: true }),
        supabase
          .from('tasks')
          .select('id, title, due_date, status, priority')
          .not('due_date', 'is', null)
          .gte('due_date', startOfMonth.split('T')[0])
          .lte('due_date', endOfMonth.split('T')[0])
          .neq('status', 'done')
          .neq('status', 'archived')
      ])

      setEvents(eventsRes.data || [])
      setTasks(tasksRes.data || [])
    } catch (error) {
      console.error('Failed to fetch calendar data:', error)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/calendar/sync-all', { method: 'POST' })
      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  const openAddEvent = (date?: Date) => {
    const d = date || selectedDate
    const dateStr = d.toISOString().split('T')[0]
    setEditingEventId(null)
    setEventForm({
      title: '',
      description: '',
      location: '',
      starts_at: `${dateStr}T09:00`,
      ends_at: `${dateStr}T10:00`,
      is_all_day: false,
    })
    setShowEventModal(true)
  }

  const openEditEvent = (event: CalendarEvent) => {
    setEditingEventId(event.id)
    const startLocal = event.is_all_day
      ? event.starts_at.split('T')[0]
      : new Date(event.starts_at).toISOString().slice(0, 16)
    const endLocal = event.is_all_day
      ? (event.ends_at || event.starts_at).split('T')[0]
      : new Date(event.ends_at).toISOString().slice(0, 16)
    setEventForm({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      starts_at: startLocal,
      ends_at: endLocal,
      is_all_day: event.is_all_day,
    })
    setShowEventModal(true)
  }

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.starts_at) return
    setSaving(true)
    try {
      const payload: any = {
        title: eventForm.title,
        description: eventForm.description || undefined,
        location: eventForm.location || undefined,
        is_all_day: eventForm.is_all_day,
        timezone: 'Europe/Oslo',
      }
      if (eventForm.is_all_day) {
        payload.starts_at = eventForm.starts_at.split('T')[0]
        payload.ends_at = eventForm.ends_at ? eventForm.ends_at.split('T')[0] : payload.starts_at
      } else {
        payload.starts_at = new Date(eventForm.starts_at).toISOString()
        payload.ends_at = eventForm.ends_at ? new Date(eventForm.ends_at).toISOString() : undefined
      }

      let res: Response
      if (editingEventId) {
        payload.id = editingEventId
        res = await fetch('/api/calendar/events', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      if (res.ok) {
        setShowEventModal(false)
        await fetchData()
      } else {
        const err = await res.json()
        console.error('Save event failed:', err)
      }
    } catch (error) {
      console.error('Save event error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event? It will also be removed from Google Calendar.')) return
    setDeleting(eventId)
    try {
      const res = await fetch(`/api/calendar/events?id=${eventId}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Delete event error:', error)
    } finally {
      setDeleting(null)
    }
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(e => isSameDay(new Date(e.starts_at), date))
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date + 'T00:00:00'), date))
  }

  const selectedEvents = getEventsForDate(selectedDate)
  const selectedTasks = getTasksForDate(selectedDate)
  const today = new Date()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Calendar
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Events and task deadlines</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openAddEvent()}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>{MONTHS[month]} {year}</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {days.map(({ date, isCurrentMonth }, i) => {
                const dayEvents = getEventsForDate(date)
                const dayTasks = getTasksForDate(date)
                const isToday = isSameDay(date, today)
                const isSelected = isSameDay(date, selectedDate)
                const hasItems = dayEvents.length > 0 || dayTasks.length > 0

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[80px] p-1.5 text-left transition-colors relative ${
                      isCurrentMonth ? 'bg-card' : 'bg-card/50'
                    } ${isSelected ? 'ring-2 ring-cyan-500/50' : ''} ${
                      isToday ? 'bg-cyan-500/10' : ''
                    } hover:bg-accent/50`}
                  >
                    <span className={`text-xs font-medium ${
                      isToday ? 'bg-cyan-500 text-black rounded-full w-6 h-6 flex items-center justify-center' : 
                      isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'
                    }`}>
                      {date.getDate()}
                    </span>
                    
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map(e => (
                        <div key={e.id} className="text-[10px] truncate px-1 py-0.5 rounded bg-blue-500/20 text-blue-400">
                          {e.title}
                        </div>
                      ))}
                      {dayTasks.slice(0, 2).map(t => (
                        <div key={t.id} className={`text-[10px] truncate px-1 py-0.5 rounded ${
                          t.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                          t.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {t.title}
                        </div>
                      ))}
                      {(dayEvents.length + dayTasks.length) > 2 && (
                        <div className="text-[10px] text-muted-foreground pl-1">
                          +{dayEvents.length + dayTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardTitle>
              <div className="flex items-center justify-between">
                <CardDescription>
                  {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} · {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} due
                </CardDescription>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAddEvent()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedEvents.length === 0 && selectedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No events or tasks for this day</p>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map(e => (
                    <div key={e.id} className="group p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{e.title}</p>
                          {!e.is_all_day && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatTime(e.starts_at)} – {formatTime(e.ends_at)}
                            </p>
                          )}
                          {e.is_all_day && (
                            <p className="text-xs text-muted-foreground mt-0.5">All day</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditEvent(e)}
                            className="p-1 rounded hover:bg-blue-500/20 text-blue-400"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(e.id)}
                            disabled={deleting === e.id}
                            className="p-1 rounded hover:bg-red-500/20 text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {e.location && (
                        <p className="text-xs text-muted-foreground mt-1">📍 {e.location}</p>
                      )}
                      {e.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
                      )}
                    </div>
                  ))}
                  
                  {selectedTasks.map(t => (
                    <div key={t.id} className={`p-3 rounded-lg border ${
                      t.priority === 'urgent' ? 'bg-red-500/10 border-red-500/20' :
                      t.priority === 'high' ? 'bg-orange-500/10 border-orange-500/20' :
                      'bg-yellow-500/10 border-yellow-500/20'
                    }`}>
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium">{t.title}</p>
                        <Badge className={`text-xs ${
                          t.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                          t.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {t.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Task due · {t.status.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming events card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const next7 = events.filter(e => {
                  const eDate = new Date(e.starts_at)
                  return eDate >= today && eDate <= new Date(today.getTime() + 7 * 86400000)
                })
                const next7Tasks = tasks.filter(t => {
                  if (!t.due_date) return false
                  const tDate = new Date(t.due_date + 'T00:00:00')
                  return tDate >= today && tDate <= new Date(today.getTime() + 7 * 86400000)
                })

                if (next7.length === 0 && next7Tasks.length === 0) {
                  return <p className="text-sm text-muted-foreground text-center py-4">Clear week ahead!</p>
                }

                return (
                  <div className="space-y-2">
                    {next7.map(e => (
                      <div key={e.id} className="flex items-center gap-2 text-sm">
                        <span className="text-xs text-muted-foreground w-12">
                          {new Date(e.starts_at).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })}
                        </span>
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="truncate">{e.title}</span>
                      </div>
                    ))}
                    {next7Tasks.map(t => (
                      <div key={t.id} className="flex items-center gap-2 text-sm">
                        <span className="text-xs text-muted-foreground w-12">
                          {new Date(t.due_date + 'T00:00:00').toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${
                          t.priority === 'urgent' ? 'bg-red-400' : t.priority === 'high' ? 'bg-orange-400' : 'bg-yellow-400'
                        }`} />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Event Modal (Create / Edit) */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingEventId ? 'Edit Event' : 'Add Event'}</DialogTitle>
            <DialogDescription>
              {editingEventId ? 'Update this event in Google Calendar' : 'Create a new Google Calendar event'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Event title"
                value={eventForm.title}
                onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">All day</label>
              <Switch
                checked={eventForm.is_all_day}
                onCheckedChange={(checked: boolean) => setEventForm(prev => ({ ...prev, is_all_day: checked }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                <Input
                  type={eventForm.is_all_day ? 'date' : 'datetime-local'}
                  value={eventForm.is_all_day ? eventForm.starts_at.split('T')[0] : eventForm.starts_at}
                  onChange={(e) => setEventForm(prev => ({ ...prev, starts_at: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">End</label>
                <Input
                  type={eventForm.is_all_day ? 'date' : 'datetime-local'}
                  value={eventForm.is_all_day ? eventForm.ends_at.split('T')[0] : eventForm.ends_at}
                  onChange={(e) => setEventForm(prev => ({ ...prev, ends_at: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Location (optional)"
                value={eventForm.location}
                onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <Textarea
              placeholder="Description (optional)"
              value={eventForm.description}
              onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[60px] resize-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEventModal(false)}>Cancel</Button>
              <Button onClick={handleSaveEvent} disabled={!eventForm.title || saving}>
                {saving ? 'Saving...' : editingEventId ? 'Save Changes' : 'Create Event'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
