import { useState, useEffect } from "react"
import { Button } from "./button"
import { Moon, Sun } from "lucide-react"

type Theme = "light" | "dark" | "system"

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system")
  const [mounted, setMounted] = useState(false)

  // Check if we're on the client
  useEffect(() => {
    setMounted(true)
    
    // Get theme from localStorage or use system preference
    const savedTheme = localStorage.getItem("theme") as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      setTheme(systemTheme)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Apply theme class to document
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    
    // If system theme, check system preference
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
    
    // Save theme to localStorage
    localStorage.setItem("theme", theme)
  }, [theme, mounted])

  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!mounted) {
    // Return a placeholder to avoid layout shift
    return <div className="w-10 h-10" />
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className="rounded-full"
    >
      {theme === "dark" ? (
        <Moon className="h-5 w-5 text-violet-200" />
      ) : (
        <Sun className="h-5 w-5 text-violet-700" />
      )}
    </Button>
  )
} 