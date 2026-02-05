'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, Kanban, Activity, Wallet, FileText, Menu, Settings, Cpu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'

const navItems = [
  { href: '/', label: 'Mission Control', icon: LayoutDashboard },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/fitness', label: 'Fitness Lab', icon: Activity },
  { href: '/finance', label: 'Finance', icon: Wallet },
  { href: '/research', label: 'Research', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/fred-control', label: 'Fred Control', icon: Cpu },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarContent() {
  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">🔭 The Observatory</h1>
          <p className="text-sm text-muted-foreground">Personal Command Center</p>
        </div>
        <ThemeToggle />
      </div>

      <NavLinks />

      <div className="mt-auto pt-8">
        <div className="px-3 py-2 text-xs text-muted-foreground">
          <p>Status: 🟢 Online</p>
          <p className="mt-1">v0.1.0-alpha</p>
        </div>
      </div>
    </>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border min-h-screen p-4 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Header with Hamburger - LEFT SIDE */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 -ml-2">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-4 flex flex-col">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold">🔭 The Observatory</h1>
                <p className="text-sm text-muted-foreground">Personal Command Center</p>
              </div>
              <ThemeToggle />
            </div>

            <NavLinks onNavigate={() => setOpen(false)} />

            <div className="mt-auto pt-8">
              <div className="px-3 py-2 text-xs text-muted-foreground">
                <p>Status: 🟢 Online</p>
                <p className="mt-1">v0.1.0-alpha</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Title in center */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🔭</span>
          <span className="font-bold hidden sm:inline">The Observatory</span>
        </div>
        
        {/* Theme toggle on right */}
        <ThemeToggle />
      </div>
    </>
  )
}
