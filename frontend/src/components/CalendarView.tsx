import { useState } from "react"
import { Button } from "@/components/ui/button"

export type CalendarEvent = {
  id: string
  date: string // YYYY-MM-DD
  time?: string
  title: string
  colorClass?: string
  onClick?: () => void
}

interface CalendarViewProps {
  events: CalendarEvent[]
  onDateClick?: (date: string) => void
  selectedDate?: string
}

export default function CalendarView({ events, onDateClick, selectedDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    return selectedDate ? new Date(selectedDate) : new Date()
  })
  
  const [view, setView] = useState<"month" | "week" | "day">("month")

  const handlePrev = () => {
    const newDate = new Date(currentDate)
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
      newDate.setDate(1)
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else if (view === "day") {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
      newDate.setDate(1)
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else if (view === "day") {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
  const dayNamesShort = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
  const dayNamesFull = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const days: { day: number, isCurrentMonth: boolean, fullDate: string, dateObj?: Date }[] = []

  if (view === "month") {
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      const day = prevMonthDays - firstDayOfMonth + i + 1
      days.push({ day, isCurrentMonth: false, fullDate: "" })
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`
      days.push({ day: i, isCurrentMonth: true, fullDate, dateObj: new Date(year, month, i) })
    }
    
    const totalCells = days.length > 35 ? 42 : 35
    const remainingCells = totalCells - days.length
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ day: i, isCurrentMonth: false, fullDate: "" })
    }
  } else if (view === "week") {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()) // Sunday
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(d.getDate() + i)
      const fullDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      days.push({ day: d.getDate(), isCurrentMonth: true, fullDate, dateObj: d })
    }
  } else if (view === "day") {
    const d = currentDate
    const fullDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    days.push({ day: d.getDate(), isCurrentMonth: true, fullDate, dateObj: d })
  }

  let headerTitle = ""
  if (view === "month") {
    headerTitle = `${monthNames[month]} ${year}`
  } else if (view === "week" && days.length > 0) {
    const start = days[0].dateObj!
    const end = days[6].dateObj!
    if (start.getMonth() === end.getMonth()) {
      headerTitle = `Du ${start.getDate()} au ${end.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()}`
    } else {
      headerTitle = `Du ${start.getDate()} ${monthNames[start.getMonth()].substring(0,3)} au ${end.getDate()} ${monthNames[end.getMonth()].substring(0,3)} ${end.getFullYear()}`
    }
  } else if (view === "day") {
    headerTitle = `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold w-48 truncate sm:w-auto">{headerTitle}</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrev}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleNext}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Button>
          </div>
        </div>
        <div className="flex rounded-md bg-muted p-1">
          <button 
            onClick={() => setView("month")} 
            className={`px-4 py-1 text-sm font-medium rounded-sm transition-all ${view === "month" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Mois
          </button>
          <button 
            onClick={() => setView("week")} 
            className={`px-4 py-1 text-sm font-medium rounded-sm transition-all ${view === "week" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Semaine
          </button>
          <button 
            onClick={() => setView("day")} 
            className={`px-4 py-1 text-sm font-medium rounded-sm transition-all ${view === "day" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Jour
          </button>
        </div>
      </div>

      {/* Week days header */}
      {view !== "day" && (
        <div className="grid grid-cols-7 text-center border-b bg-muted/20">
          {dayNamesShort.map((day) => (
            <div key={day} className="py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
      )}
      {view === "day" && (
        <div className="grid grid-cols-1 text-center border-b bg-muted/20">
          <div className="py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {dayNamesFull[currentDate.getDay()]}
          </div>
        </div>
      )}

      {/* Days grid */}
      <div className={`grid ${view === "day" ? "grid-cols-1" : "grid-cols-7"} ${view === "month" ? "auto-rows-[minmax(120px,1fr)]" : "auto-rows-[minmax(400px,1fr)]"} flex-1`}>
        {days.map((d, i) => {
          const dayEvents = d.fullDate ? events.filter(e => e.date === d.fullDate) : []
          const isToday = d.fullDate === todayStr
          const isSelected = d.fullDate === selectedDate

          return (
            <div 
              key={i} 
              className={`
                relative border-r border-b p-2 transition-colors flex flex-col
                ${d.isCurrentMonth ? "bg-background" : "bg-muted/10"} 
                ${isSelected && view === "month" ? "bg-primary/5" : ""}
                ${onDateClick && d.fullDate ? "cursor-pointer hover:bg-muted/30" : ""}
              `}
              onClick={() => d.fullDate && onDateClick && onDateClick(d.fullDate)}
            >
              <div className={`flex ${view === "day" ? "justify-center mb-4" : "justify-end mb-1"}`}>
                <span className={`
                  flex items-center justify-center rounded-full text-sm
                  ${view === "day" ? "h-12 w-12 text-xl" : "h-7 w-7"}
                  ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
                  ${!isToday && d.isCurrentMonth ? "text-foreground font-medium" : ""}
                  ${!d.isCurrentMonth ? "text-muted-foreground/50" : ""}
                `}>
                  {d.day}
                </span>
              </div>
              <div className={`flex-1 space-y-1.5 overflow-y-auto no-scrollbar ${view === "month" ? "max-h-[80px]" : ""}`}>
                {dayEvents.map((evt) => (
                  <div 
                    key={evt.id} 
                    onClick={(e) => { e.stopPropagation(); evt.onClick?.(); }}
                    className={`rounded-md px-2 py-1.5 text-xs transition-opacity hover:opacity-80 ${view !== "month" ? "text-sm py-2" : "truncate"} ${evt.colorClass || "bg-primary/10 text-primary font-medium border border-primary/20"}`}
                    title={evt.title}
                  >
                    {evt.time && <span className="font-semibold opacity-80 mr-1">{evt.time}</span>}
                    {evt.title}
                  </div>
                ))}
                {view !== "month" && dayEvents.length === 0 && (
                   <div className="flex items-center justify-center h-full text-sm text-muted-foreground opacity-50 pt-10">
                     Aucun événement
                   </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}