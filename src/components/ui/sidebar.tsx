import * as React from "react"
import { cn } from "@/lib/utils"

type SidebarContextValue = {
  isMobile: boolean
  state: "expanded" | "collapsed"
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Sidebar({ className, children, ...props }: SidebarProps) {
  const [isMobile, setIsMobile] = React.useState(false)
  const [state, setState] = React.useState<"expanded" | "collapsed">("expanded")

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setState("collapsed")
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const toggleSidebar = () => {
    setState((prev) => (prev === "expanded" ? "collapsed" : "expanded"))
  }

  return (
    <SidebarContext.Provider value={{ isMobile, state, toggleSidebar }}>
      <div
        className={cn(
          "relative flex h-full flex-col border-r bg-background transition-all duration-300",
          state === "collapsed" ? "w-16" : "w-64",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex h-16 items-center border-b px-4", className)}
      {...props}
    />
  )
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto py-4", className)}
      {...props}
    />
  )
}

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-t p-4", className)}
      {...props}
    />
  )
}

export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("space-y-1", className)}
      {...props}
    />
  )
}

export function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-2", className)}
      {...props}
    />
  )
}

export function SidebarMenuButton({ className, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

export function SidebarTrigger({ className, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={toggleSidebar}
      {...props}
    />
  )
} 