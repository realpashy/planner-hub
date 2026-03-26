"use client"

import * as React from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchableTagSelectProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  allowCreate?: boolean
  clearLabel?: string
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function SearchableTagSelect({
  value,
  onChange,
  options,
  placeholder = "בחר או כתוב",
  searchPlaceholder = "חיפוש או הקלדה...",
  emptyText = "לא נמצאו תוצאות",
  className,
  disabled = false,
  allowCreate = false,
  clearLabel,
}: SearchableTagSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState(value)

  React.useEffect(() => {
    if (!open) {
      setQuery(value)
    }
  }, [open, value])

  const uniqueOptions = React.useMemo(
    () => Array.from(new Set(options.map((option) => option.trim()).filter(Boolean))),
    [options],
  )

  const filteredOptions = React.useMemo(() => {
    const normalizedQuery = normalize(query)
    if (!normalizedQuery) return uniqueOptions
    if (query.trim().length < 3) {
      return uniqueOptions.filter((option) => normalize(option).startsWith(normalizedQuery))
    }
    return uniqueOptions.filter((option) => normalize(option).includes(normalizedQuery))
  }, [query, uniqueOptions])

  const commitCustomValue = React.useCallback(() => {
    if (!allowCreate) return
    const trimmed = query.trim()
    if (trimmed !== value) {
      onChange(trimmed)
    }
  }, [allowCreate, onChange, query, value])

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          commitCustomValue()
        } else {
          setQuery(value)
        }
        setOpen(nextOpen)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-between rounded-[5px] border border-input bg-card/[0.88] px-3.5 py-2 text-right text-sm font-semibold shadow-[var(--app-shadow)] hover:bg-muted/60",
            className,
          )}
        >
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right" dir="rtl">
            <span className={cn("block w-full truncate text-right", value ? "text-foreground" : "text-muted-foreground")}>
              {value || placeholder}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent dir="rtl" align="start" sideOffset={8} className="w-[min(26rem,var(--radix-popover-trigger-width))] rounded-[5px] border border-border/70 bg-popover/[0.98] p-3 shadow-xl backdrop-blur-xl">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  commitCustomValue()
                  setOpen(false)
                }
              }}
              placeholder={searchPlaceholder}
              className="h-11 rounded-[5px] border-border/60 bg-background/80 pr-9 text-right focus:border-primary/50"
            />
          </div>

          <div className="modern-scrollbar max-h-56 space-y-1 overflow-y-auto">
            {clearLabel ? (
              <button
                type="button"
                onClick={() => {
                  onChange("")
                  setQuery("")
                  setOpen(false)
                }}
                className="flex w-full items-center justify-end gap-2 rounded-[5px] border border-transparent bg-transparent px-3 py-2 text-right text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                dir="rtl"
              >
                <span>{clearLabel}</span>
                {!value ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
              </button>
            ) : null}

            {filteredOptions.map((option) => {
              const selected = option === value
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option)
                    setQuery(option)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center justify-end gap-2 rounded-[5px] px-3 py-2 text-right text-sm font-medium transition-colors",
                    selected ? "bg-primary/[0.12] text-primary" : "text-foreground hover:bg-muted/60",
                  )}
                  dir="rtl"
                >
                  {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
                  <span className="block flex-1 truncate text-right">{option}</span>
                </button>
              )
            })}

            {filteredOptions.length === 0 ? (
              <div className="rounded-[5px] border border-dashed border-border/50 px-3 py-3 text-center text-xs text-muted-foreground">
                {allowCreate && query.trim().length > 0 ? `לחץ Enter כדי לשמור "${query.trim()}"` : emptyText}
              </div>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
