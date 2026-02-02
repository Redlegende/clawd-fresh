'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Kanban, 
  BookOpen, 
  Activity, 
  Wallet, 
  Calendar,
  FolderKanban
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Mission Control', icon: LayoutDashboard },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/research', label: 'Research Reader', icon: BookOpen },
  { href: '/fitness', label: 'Fitness Lab', icon: Activity, disabled: true },
  { href: '/finance', label: 'Finance', icon: Wallet, disabled: true },
  { href: '/calendar', label: 'Calendar', icon: Calendar, disabled: true },
  { href: '/projects', label: 'Projects', icon: FolderKanban, disabled: true },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">O</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-lg">Observatory</h1>
            <p className="text-xs text-slate-500">Command Center</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.disabled ? '#' : item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900",
                item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
              {item.disabled && (
                <span className="ml-auto text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                  Soon
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-900/50 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-2">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-slate-300">Systems Online</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
