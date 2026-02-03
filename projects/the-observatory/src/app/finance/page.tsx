import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, TrendingUp, Clock, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

async function getFinanceData() {
  const { data: entries, error } = await supabase
    .from('finance_entries')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Finance data error:', error)
    return { entries: [], stats: null }
  }

  const allEntries = entries || []
  
  // Calculate stats
  const totalEarnings = allEntries.reduce((sum, e) => sum + (e.total_nok || 0), 0)
  const totalHours = allEntries.reduce((sum, e) => sum + (e.hours || 0), 0)
  const invoicedAmount = allEntries.filter(e => e.invoiced).reduce((sum, e) => sum + (e.total_nok || 0), 0)
  const avgRate = totalHours > 0 ? totalEarnings / totalHours : 0
  
  // Get current month entries
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const thisMonthEntries = allEntries.filter(e => {
    const date = new Date(e.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  const thisMonthEarnings = thisMonthEntries.reduce((sum, e) => sum + (e.total_nok || 0), 0)
  const thisMonthHours = thisMonthEntries.reduce((sum, e) => sum + (e.hours || 0), 0)

  return {
    entries: allEntries.slice(0, 10), // Last 10 entries
    stats: {
      totalEarnings,
      totalHours,
      invoicedAmount,
      avgRate,
      thisMonthEarnings,
      thisMonthHours,
      entryCount: allEntries.length
    }
  }
}

export default async function FinancePage() {
  const { entries, stats } = await getFinanceData()
  const hasData = entries.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">💰 Finance</h1>
          <p className="text-muted-foreground mt-1">Hours tracking and earnings</p>
        </div>
        <Button>Add Entry</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasData ? `${stats?.thisMonthEarnings.toLocaleString('no-NO')} kr` : '-- kr'}
            </div>
            <p className="text-xs text-muted-foreground">Including MVA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasData ? `${stats?.thisMonthHours.toFixed(1)} h` : '-- h'}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasData ? `${stats?.invoicedAmount.toLocaleString('no-NO')} kr` : '-- kr'}
            </div>
            <p className="text-xs text-muted-foreground">Ready for payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hourly Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasData ? `${Math.round(stats?.avgRate || 0).toLocaleString('no-NO')} kr` : '-- kr'}
            </div>
            <p className="text-xs text-muted-foreground">Average all time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>📋 Recent Entries</CardTitle>
          <CardDescription>Latest hours logged</CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Source</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-center py-2">Hours</th>
                    <th className="text-right py-2">Rate</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-center py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="py-2">{new Date(entry.date).toLocaleDateString('no-NO')}</td>
                      <td className="py-2">
                        <Badge variant="outline">{entry.source}</Badge>
                      </td>
                      <td className="py-2 text-muted-foreground truncate max-w-[200px]">
                        {entry.description || '-'}
                      </td>
                      <td className="text-center py-2">{entry.hours}</td>
                      <td className="text-right py-2">{entry.rate_nok} kr</td>
                      <td className="text-right py-2 font-medium">{entry.total_nok.toLocaleString('no-NO')} kr</td>
                      <td className="text-center py-2">
                        {entry.paid ? (
                          <Badge className="bg-green-100 text-green-800">Paid</Badge>
                        ) : entry.invoiced ? (
                          <Badge className="bg-amber-100 text-amber-800">Invoiced</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No finance entries yet</p>
              <p className="text-sm mt-1">Add your first entry to start tracking earnings</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>📊 Summary</CardTitle>
            <CardDescription>All-time totals</CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Earnings</span>
                  <span className="text-xl font-bold">{stats?.totalEarnings.toLocaleString('no-NO')} kr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Hours</span>
                  <span className="text-xl font-bold">{stats?.totalHours.toFixed(1)} h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Entries</span>
                  <span className="text-xl font-bold">{stats?.entryCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Average Rate</span>
                  <span className="text-xl font-bold">{Math.round(stats?.avgRate || 0).toLocaleString('no-NO')} kr/h</span>
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📈 By Source</CardTitle>
            <CardDescription>Earnings breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <div className="space-y-2">
                {Array.from(new Set(entries.map(e => e.source))).map(source => {
                  const sourceEntries = entries.filter(e => e.source === source)
                  const sourceTotal = sourceEntries.reduce((sum, e) => sum + e.total_nok, 0)
                  const sourceHours = sourceEntries.reduce((sum, e) => sum + e.hours, 0)
                  return (
                    <div key={source} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                      <div>
                        <span className="font-medium">{source}</span>
                        <span className="text-sm text-muted-foreground ml-2">{sourceHours}h</span>
                      </div>
                      <span className="font-semibold">{sourceTotal.toLocaleString('no-NO')} kr</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
