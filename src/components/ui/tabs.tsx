"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Lightweight, self-contained Tabs.
 *
 * The previous implementation wrapped `@base-ui/react/tabs` with a
 * shadcn/Tailwind-v4 stylesheet (classes like `data-active:`,
 * `data-horizontal:flex-col`, `group-data-vertical/tabs:`). This project runs
 * Tailwind v3, where those classes don't compile — which left the tabs root as
 * a flex ROW and broke every tabbed page's layout (list squished beside the
 * panels + horizontal overflow on mobile). This version is plain React state
 * with Tailwind-v3-valid classes and standard `data-[state=active]` styling.
 */

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = React.useContext(TabsContext)
  if (!ctx) {
    throw new Error("Tabs components must be used within <Tabs>")
  }
  return ctx
}

interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")
  const isControlled = value !== undefined
  const current = isControlled ? (value as string) : internalValue

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next)
      onValueChange?.(next)
    },
    [isControlled, onValueChange]
  )

  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-center justify-center gap-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

function TabsTrigger({ value, className, disabled, ...props }: TabsTriggerProps) {
  const ctx = useTabsContext()
  const isActive = ctx.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      disabled={disabled}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all",
        "data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        "dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white",
        "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

function TabsContent({ value, className, ...props }: TabsContentProps) {
  const ctx = useTabsContext()
  if (ctx.value !== value) return null

  return (
    <div
      role="tabpanel"
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
