'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Kanban, Activity, Wallet, FileText, Settings } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Mission Control', icon: LayoutDashboard },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/fitness', label: 'Fitness Lab', icon: Activity },
  { href: '/finance', label: 'Finance', icon: Wallet },
  { href: '/research', label: 'Research', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">🔭 The Observatory</h1>
        <p className="text-sm text-muted-foreground">Personal Command Center</p>
      </div>
      
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-8">
        <div className="px-3 py-2 text-xs text-muted-foreground">
          <p>Status: 🟡 Setting up</p>
          <p className="mt-1">v0.1.0-alpha</p>
        </div>
      </div>
    </aside>
  )
}
