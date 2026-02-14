'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Wallet, TrendingUp, Clock, CheckCircle, Plus, RefreshCw, Building2, Truck,
  UtensilsCrossed, Briefcase, Download, Calendar, FileText, ChevronDown,
  MoreHorizontal, CheckCircle2, CircleDollarSign, Calculator, Receipt,
  Copy, ChevronLeft, ChevronRight, FileCheck
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from '@supabase/supabase-js'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const WORKPLACES = [
  { id: 'all', label: 'All Workplaces', icon: Briefcase, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  { id: 'Fåvang Varetaxi', label: 'Fåvang Varetaxi', icon: Truck, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { id: 'Treffen', label: 'Treffen (Skei)', icon: UtensilsCrossed, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  { id: 'Kvitfjellhytter', label: 'Kvitfjellhytter', icon: Building2, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  { id: 'Other', label: 'Other', icon: Briefcase, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
]

const RATES: Record<string, { day: number; night: number; mva: number }> = {
  'Fåvang Varetaxi': { day: 300, night: 400, mva: 1.25 },
  'Treffen': { day: 400, night: 400, mva: 1.25 },
  'Kvitfjellhytter': { day: 0, night: 0, mva: 1.25 },
  'Other': { day: 300, night: 300, mva: 1.25 },
}

function formatMonth(dateStr: string) {
  const [y, m] = dateStr.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('no-NO', { month: 'long', year: 'numeric' })
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// Generate month options (last 12 months + future 3)
function getMonthOptions() {
  const months = []
  const now = new Date()
  for (let i = -12; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = getMonthKey(d)
    const label = d.toLocaleDateString('no-NO', { month: 'long', year: 'numeric' })
    months.push({ value, label })
  }
  return months.reverse()
}

const MONTH_OPTIONS = getMonthOptions()

export default function FinancePage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey(new Date()))
  const [showAddModal, setShowAddModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copiedInvoice, setCopiedInvoice] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    source: 'Fåvang Varetaxi',
    description: '',
    hours: '',
    rate_nok: '300',
    start_time: '',
    end_time: '',
    business_type: 'day',
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('finance_entries')
      .select('*')
      .order('date', { ascending: false })

    if (error) console.error('Finance error:', error)
    setEntries(data || [])
    setLoading(false)
  }

  // Navigate months
  const navigateMonth = (dir: -1 | 1) => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + dir, 1)
    setSelectedMonth(getMonthKey(d))
  }

  // Filter by workplace and month
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchesWorkplace = activeTab === 'all' || e.source === activeTab
      const entryMonth = e.date.substring(0, 7)
      const matchesMonth = entryMonth === selectedMonth
      return matchesWorkplace && matchesMonth
    })
  }, [entries, activeTab, selectedMonth])

  // Calculate stats
  const stats = useMemo(() => {
    const totalExMva = filteredEntries.reduce((s, e) => s + Number(e.subtotal_nok || 0), 0)
    const totalWithMva = filteredEntries.reduce((s, e) => s + Number(e.total_nok || 0), 0)
    const totalMva = totalWithMva - totalExMva
    const totalHours = filteredEntries.reduce((s, e) => s + Number(e.hours || 0), 0)

    const paidEntries = filteredEntries.filter(e => e.paid)
    const invoicedEntries = filteredEntries.filter(e => e.invoiced && !e.paid)
    const pendingEntries = filteredEntries.filter(e => !e.invoiced && !e.paid)

    const paidExMva = paidEntries.reduce((s, e) => s + Number(e.subtotal_nok || 0), 0)
    const paidWithMva = paidEntries.reduce((s, e) => s + Number(e.total_nok || 0), 0)
    const invoicedExMva = invoicedEntries.reduce((s, e) => s + Number(e.subtotal_nok || 0), 0)
    const invoicedWithMva = invoicedEntries.reduce((s, e) => s + Number(e.total_nok || 0), 0)
    const pendingExMva = pendingEntries.reduce((s, e) => s + Number(e.subtotal_nok || 0), 0)
    const pendingWithMva = pendingEntries.reduce((s, e) => s + Number(e.total_nok || 0), 0)

    return {
      totalExMva,
      totalMva,
      totalWithMva,
      totalHours,
      entryCount: filteredEntries.length,
      paidCount: paidEntries.length,
      invoicedCount: invoicedEntries.length,
      pendingCount: pendingEntries.length,
      paidExMva,
      paidWithMva,
      invoicedExMva,
      invoicedWithMva,
      pendingExMva,
      pendingWithMva,
    }
  }, [filteredEntries])

  // Monthly overview (last 12 months)
  const monthlyOverview = useMemo(() => {
    const byMonth: Record<string, { exMva: number; mva: number; withMva: number; hours: number; invoiced: number; paid: number }> = {}

    entries.forEach(e => {
      const matchesWorkplace = activeTab === 'all' || e.source === activeTab
      if (!matchesWorkplace) return

      const month = e.date.substring(0, 7)
      if (!byMonth[month]) {
        byMonth[month] = { exMva: 0, mva: 0, withMva: 0, hours: 0, invoiced: 0, paid: 0 }
      }
      const exMva = Number(e.subtotal_nok || 0)
      const withMva = Number(e.total_nok || 0)
      byMonth[month].exMva += exMva
      byMonth[month].withMva += withMva
      byMonth[month].mva += withMva - exMva
      byMonth[month].hours += Number(e.hours || 0)
      if (e.invoiced) byMonth[month].invoiced += withMva
      if (e.paid) byMonth[month].paid += withMva
    })

    return Object.entries(byMonth)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
  }, [entries, activeTab])

  // Workplace breakdown for selected month
  const workplaceBreakdown = useMemo(() => {
    const bySource: Record<string, { entries: any[], exMva: number, withMva: number, hours: number }> = {}

    filteredEntries.forEach(e => {
      if (!bySource[e.source]) {
        bySource[e.source] = { entries: [], exMva: 0, withMva: 0, hours: 0 }
      }
      bySource[e.source].entries.push(e)
      bySource[e.source].exMva += Number(e.subtotal_nok || 0)
      bySource[e.source].withMva += Number(e.total_nok || 0)
      bySource[e.source].hours += Number(e.hours || 0)
    })

    return bySource
  }, [filteredEntries])

  const handleSourceChange = (source: string) => {
    const rate = RATES[source]
    setFormData(prev => ({
      ...prev,
      source,
      rate_nok: prev.business_type === 'night' ? String(rate?.night || 300) : String(rate?.day || 300)
    }))
  }

  const handleSubmit = async () => {
    if (!formData.hours || !formData.rate_nok) return
    setSaving(true)
    try {
      const { error } = await supabase.from('finance_entries').insert({
        date: formData.date,
        source: formData.source,
        description: formData.description || null,
        hours: parseFloat(formData.hours),
        rate_nok: parseFloat(formData.rate_nok),
        mva_rate: RATES[formData.source]?.mva || 1.25,
        business_type: formData.business_type,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
      })
      if (error) throw error
      setShowAddModal(false)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        source: 'Fåvang Varetaxi',
        description: '',
        hours: '',
        rate_nok: '300',
        start_time: '',
        end_time: '',
        business_type: 'day',
      })
      await fetchData()
    } catch (error) {
      console.error('Failed to add entry:', error)
    } finally {
      setSaving(false)
    }
  }

  const togglePaid = async (entry: any) => {
    try {
      const { error } = await supabase
        .from('finance_entries')
        .update({
          paid: !entry.paid,
          paid_at: !entry.paid ? new Date().toISOString() : null
        })
        .eq('id', entry.id)
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Failed to update:', error)
    }
  }

  const toggleInvoiced = async (entry: any) => {
    try {
      const { error } = await supabase
        .from('finance_entries')
        .update({
          invoiced: !entry.invoiced,
          invoiced_at: !entry.invoiced ? new Date().toISOString() : null
        })
        .eq('id', entry.id)
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Failed to update:', error)
    }
  }

  // Batch mark all filtered entries as invoiced
  const batchMarkInvoiced = async () => {
    const uninvoiced = filteredEntries.filter(e => !e.invoiced)
    if (uninvoiced.length === 0) return
    try {
      const ids = uninvoiced.map(e => e.id)
      const { error } = await supabase
        .from('finance_entries')
        .update({ invoiced: true, invoiced_at: new Date().toISOString() })
        .in('id', ids)
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Batch invoiced failed:', error)
    }
  }

  // Batch mark all filtered entries as paid
  const batchMarkPaid = async () => {
    const unpaid = filteredEntries.filter(e => !e.paid)
    if (unpaid.length === 0) return
    try {
      const ids = unpaid.map(e => e.id)
      const { error } = await supabase
        .from('finance_entries')
        .update({ paid: true, paid_at: new Date().toISOString() })
        .in('id', ids)
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Batch paid failed:', error)
    }
  }

  // Generate invoice text for accounting software
  const generateInvoiceText = () => {
    // Group entries by source for the selected month
    const sourceFilter = activeTab === 'all' ? null : activeTab
    const invoiceEntries = filteredEntries
      .filter(e => !sourceFilter || e.source === sourceFilter)
      .sort((a, b) => a.date.localeCompare(b.date))

    if (invoiceEntries.length === 0) return ''

    const monthLabel = formatMonth(selectedMonth)
    const source = sourceFilter || invoiceEntries[0]?.source || 'Unknown'

    // Group by rate (day vs night)
    const dayEntries = invoiceEntries.filter(e => {
      const rate = Number(e.rate_nok)
      const dayRate = RATES[e.source]?.day || 0
      return rate === dayRate
    })
    const nightEntries = invoiceEntries.filter(e => {
      const rate = Number(e.rate_nok)
      const dayRate = RATES[e.source]?.day || 0
      return rate !== dayRate
    })

    const lines: string[] = []
    lines.push(`Faktura — ${source}`)
    lines.push(`Periode: ${monthLabel}`)
    lines.push('')
    lines.push('---')
    lines.push('')

    // Individual entries
    invoiceEntries.forEach(e => {
      const date = new Date(e.date).toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const timeRange = e.start_time && e.end_time ? ` (${e.start_time.slice(0,5)}–${e.end_time.slice(0,5)})` : ''
      const rate = Number(e.rate_nok)
      const hours = Number(e.hours)
      lines.push(`${date}${timeRange} — ${hours}t × ${rate} kr/t = ${(hours * rate).toLocaleString('no-NO')} kr`)
    })

    lines.push('')
    lines.push('---')
    lines.push('')

    // Summary by rate
    if (dayEntries.length > 0) {
      const dayHours = dayEntries.reduce((s, e) => s + Number(e.hours), 0)
      const dayRate = Number(dayEntries[0].rate_nok)
      lines.push(`Dagtimer: ${dayHours}t × ${dayRate} kr/t = ${(dayHours * dayRate).toLocaleString('no-NO')} kr`)
    }
    if (nightEntries.length > 0) {
      const nightHours = nightEntries.reduce((s, e) => s + Number(e.hours), 0)
      const nightRate = Number(nightEntries[0].rate_nok)
      lines.push(`Nattimer: ${nightHours}t × ${nightRate} kr/t = ${(nightHours * nightRate).toLocaleString('no-NO')} kr`)
    }

    lines.push('')
    const totalExMva = invoiceEntries.reduce((s, e) => s + Number(e.subtotal_nok || 0), 0)
    const totalMva = invoiceEntries.reduce((s, e) => s + Number(e.total_nok || 0) - Number(e.subtotal_nok || 0), 0)
    const totalWithMva = invoiceEntries.reduce((s, e) => s + Number(e.total_nok || 0), 0)
    const totalHours = invoiceEntries.reduce((s, e) => s + Number(e.hours || 0), 0)

    lines.push(`Timer totalt: ${totalHours}t`)
    lines.push(`Sum eks. MVA: ${totalExMva.toLocaleString('no-NO')} kr`)
    lines.push(`MVA (25%): ${totalMva.toLocaleString('no-NO')} kr`)
    lines.push(`Totalbeløp: ${totalWithMva.toLocaleString('no-NO')} kr`)

    return lines.join('\n')
  }

  const copyInvoiceText = () => {
    const text = generateInvoiceText()
    navigator.clipboard.writeText(text)
    setCopiedInvoice(true)
    setTimeout(() => setCopiedInvoice(false), 2000)
  }

  const downloadStatement = () => {
    const monthLabel = MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label || selectedMonth
    const workplaceLabel = WORKPLACES.find(w => w.id === activeTab)?.label || activeTab

    const csvRows = [
      ['Date', 'Source', 'Description', 'Start', 'End', 'Hours', 'Rate (kr)', 'Ex-MVA', 'MVA', 'Total', 'Status'].join(';')
    ]

    filteredEntries.forEach(e => {
      const exMva = Number(e.subtotal_nok || 0)
      const withMva = Number(e.total_nok || 0)
      const mva = withMva - exMva
      const status = e.paid ? 'Paid' : e.invoiced ? 'Invoiced' : 'Pending'
      csvRows.push([
        e.date,
        e.source,
        e.description || '',
        e.start_time?.slice(0,5) || '',
        e.end_time?.slice(0,5) || '',
        e.hours,
        e.rate_nok,
        exMva.toFixed(2),
        mva.toFixed(2),
        withMva.toFixed(2),
        status
      ].join(';'))
    })

    csvRows.push('')
    csvRows.push(['Summary', '', '', '', '', stats.totalHours.toFixed(2), '', stats.totalExMva.toFixed(2), stats.totalMva.toFixed(2), stats.totalWithMva.toFixed(2), ''].join(';'))

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Statement_${workplaceLabel.replace(/\s+/g, '_')}_${selectedMonth}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Finance</h1>
          <p className="text-muted-foreground mt-1 text-sm">Hours, earnings, invoicing & expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadStatement} disabled={filteredEntries.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => setShowInvoiceModal(true)} disabled={filteredEntries.length === 0}>
            <Receipt className="h-4 w-4 mr-1" />
            Invoice
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Workplace Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="flex flex-wrap h-auto">
            {WORKPLACES.map(wp => {
              const Icon = wp.icon
              return (
                <TabsTrigger key={wp.id} value={wp.id} className="flex items-center gap-1">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{wp.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings (ex-MVA)</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalExMva.toLocaleString('no-NO')} kr
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.entryCount} entries &middot; {stats.totalHours.toFixed(1)}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MVA Owed</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {stats.totalMva.toLocaleString('no-NO')} kr
            </div>
            <p className="text-xs text-muted-foreground">25% of {stats.totalExMva.toLocaleString('no-NO')} kr</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoiced</CardTitle>
            <FileCheck className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {stats.invoicedWithMva.toLocaleString('no-NO')} kr
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.invoicedCount} entries &middot; Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {stats.paidWithMva.toLocaleString('no-NO')} kr
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.paidCount} of {stats.entryCount} entries paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending summary - only show if there are uninvoiced entries */}
      {stats.pendingCount > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="font-medium">{stats.pendingCount} uninvoiced entries &middot; {stats.pendingWithMva.toLocaleString('no-NO')} kr</p>
                  <p className="text-xs text-muted-foreground">Ready to invoice for {formatMonth(selectedMonth)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowInvoiceModal(true)}>
                  <Receipt className="h-4 w-4 mr-1" />
                  Generate Invoice
                </Button>
                <Button variant="outline" size="sm" onClick={batchMarkInvoiced}>
                  <FileCheck className="h-4 w-4 mr-1" />
                  Mark All Invoiced
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch action for marking paid */}
      {stats.invoicedCount > 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-medium">{stats.invoicedCount} invoiced &middot; {stats.invoicedWithMva.toLocaleString('no-NO')} kr awaiting payment</p>
                  <p className="text-xs text-muted-foreground">Mark as paid when payment is received</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={batchMarkPaid}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark All Paid
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workplace Breakdown for Selected Month */}
      {activeTab === 'all' && Object.keys(workplaceBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Workplace</CardTitle>
            <CardDescription>{formatMonth(selectedMonth)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(workplaceBreakdown).map(([source, data]) => {
                const wp = WORKPLACES.find(w => w.id === source)
                const Icon = wp?.icon || Briefcase
                return (
                  <div key={source} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${wp?.color || 'text-muted-foreground'}`} />
                      <div>
                        <span className="font-medium">{source}</span>
                        <span className="text-sm text-muted-foreground ml-2">{data.hours.toFixed(1)}h &middot; {data.entries.length} entries</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{data.exMva.toLocaleString('no-NO')} kr</div>
                      <div className="text-xs text-muted-foreground">{data.withMva.toLocaleString('no-NO')} kr med MVA</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Entries</CardTitle>
            <CardDescription>
              {formatMonth(selectedMonth)} &middot; {WORKPLACES.find(w => w.id === activeTab)?.label}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Source</th>
                    <th className="text-left py-2">Time</th>
                    <th className="text-center py-2">Hours</th>
                    <th className="text-right py-2">Rate</th>
                    <th className="text-right py-2">Ex-MVA</th>
                    <th className="text-right py-2">With MVA</th>
                    <th className="text-center py-2">Status</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry: any) => (
                    <tr key={entry.id} className={`border-b last:border-0 ${entry.paid ? 'opacity-60' : ''}`}>
                      <td className="py-2">{new Date(entry.date).toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit' })}</td>
                      <td className="py-2">
                        <Badge variant="outline" className="text-xs">{entry.source}</Badge>
                      </td>
                      <td className="py-2 text-muted-foreground text-xs">
                        {entry.start_time && entry.end_time
                          ? `${entry.start_time.slice(0,5)}–${entry.end_time.slice(0,5)}`
                          : entry.description || '-'}
                      </td>
                      <td className="text-center py-2">{entry.hours}t</td>
                      <td className="text-right py-2 text-muted-foreground">{Number(entry.rate_nok)} kr/t</td>
                      <td className="text-right py-2">{Number(entry.subtotal_nok).toLocaleString('no-NO')} kr</td>
                      <td className="text-right py-2 font-medium">{Number(entry.total_nok).toLocaleString('no-NO')} kr</td>
                      <td className="text-center py-2">
                        {entry.paid ? (
                          <Badge className="bg-green-500/20 text-green-400">Paid</Badge>
                        ) : entry.invoiced ? (
                          <Badge className="bg-amber-500/20 text-amber-400">Invoiced</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </td>
                      <td className="text-right py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleInvoiced(entry)}>
                              {entry.invoiced ? 'Mark as Not Invoiced' : 'Mark as Invoiced'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePaid(entry)}>
                              {entry.paid ? 'Mark as Unpaid' : 'Mark as Paid'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-medium">
                    <td className="py-2" colSpan={3}>Total</td>
                    <td className="text-center py-2">{stats.totalHours.toFixed(1)}t</td>
                    <td className="text-right py-2"></td>
                    <td className="text-right py-2">{stats.totalExMva.toLocaleString('no-NO')} kr</td>
                    <td className="text-right py-2 text-cyan-400">{stats.totalWithMva.toLocaleString('no-NO')} kr</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No entries for {formatMonth(selectedMonth)}</p>
              <p className="text-sm mt-1">Click &quot;Add Entry&quot; to start tracking</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Overview */}
      {monthlyOverview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Overview</CardTitle>
            <CardDescription>
              {WORKPLACES.find(w => w.id === activeTab)?.label} &middot; Last {monthlyOverview.length} months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Month</th>
                    <th className="text-center py-2">Hours</th>
                    <th className="text-right py-2">Earnings (ex-MVA)</th>
                    <th className="text-right py-2">MVA</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-right py-2">Invoiced</th>
                    <th className="text-right py-2">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyOverview.map(([month, data]) => (
                    <tr
                      key={month}
                      className={`border-b last:border-0 cursor-pointer hover:bg-muted/50 ${month === selectedMonth ? 'bg-cyan-500/10' : ''}`}
                      onClick={() => setSelectedMonth(month)}
                    >
                      <td className="py-2 font-medium">{formatMonth(month)}</td>
                      <td className="text-center py-2">{data.hours.toFixed(1)}t</td>
                      <td className="text-right py-2">{data.exMva.toLocaleString('no-NO')} kr</td>
                      <td className="text-right py-2 text-red-400">{data.mva.toLocaleString('no-NO')} kr</td>
                      <td className="text-right py-2 font-medium">{data.withMva.toLocaleString('no-NO')} kr</td>
                      <td className="text-right py-2">
                        {data.invoiced > 0 ? (
                          <span className="text-amber-400">{data.invoiced.toLocaleString('no-NO')} kr</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="text-right py-2">
                        {data.paid > 0 ? (
                          <span className="text-green-400">{data.paid.toLocaleString('no-NO')} kr</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Entry Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Hour Entry</DialogTitle>
            <DialogDescription>Log hours worked at a specific workplace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Workplace</Label>
                <Select value={formData.source} onValueChange={handleSourceChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fåvang Varetaxi">Fåvang Varetaxi</SelectItem>
                    <SelectItem value="Treffen">Treffen (Skei)</SelectItem>
                    <SelectItem value="Kvitfjellhytter">Kvitfjellhytter</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input type="number" step="0.25" placeholder="8.0" value={formData.hours} onChange={e => setFormData(p => ({ ...p, hours: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Rate (kr/t)</Label>
                <Input type="number" value={formData.rate_nok} onChange={e => setFormData(p => ({ ...p, rate_nok: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Shift</Label>
                <Select value={formData.business_type} onValueChange={v => {
                  const rate = RATES[formData.source]
                  setFormData(p => ({ ...p, business_type: v, rate_nok: v === 'night' ? String(rate?.night || 400) : String(rate?.day || 300) }))
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day (&lt;22:00)</SelectItem>
                    <SelectItem value="night">Night (&gt;22:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={formData.start_time} onChange={e => setFormData(p => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={formData.end_time} onChange={e => setFormData(p => ({ ...p, end_time: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="What did you do?" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>

            {formData.hours && formData.rate_nok && (
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal (ex-MVA):</span>
                  <span>{(parseFloat(formData.hours) * parseFloat(formData.rate_nok)).toLocaleString('no-NO')} kr</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>MVA (25%):</span>
                  <span>{(parseFloat(formData.hours) * parseFloat(formData.rate_nok) * 0.25).toLocaleString('no-NO')} kr</span>
                </div>
                <div className="flex justify-between font-bold mt-1 pt-1 border-t border-cyan-500/20">
                  <span>Total (med MVA):</span>
                  <span>{(parseFloat(formData.hours) * parseFloat(formData.rate_nok) * 1.25).toLocaleString('no-NO')} kr</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !formData.hours}>
              {saving ? 'Saving...' : 'Add Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Generation Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate Invoice Text</DialogTitle>
            <DialogDescription>
              Copy this into your accounting software for {formatMonth(selectedMonth)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">
              {generateInvoiceText() || 'No entries to invoice'}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>Close</Button>
            <Button onClick={copyInvoiceText} disabled={filteredEntries.length === 0}>
              {copiedInvoice ? (
                <><CheckCircle2 className="h-4 w-4 mr-1" /> Copied!</>
              ) : (
                <><Copy className="h-4 w-4 mr-1" /> Copy to Clipboard</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
