"use client";

import { useState } from "react";
import { 
  CalendarDays, ChevronLeft, ChevronRight, Target, 
  Briefcase, Clock, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: string; // GOAL | INTERVIEW | STUDY
}

export function CalendarClient({ initialEvents }: { initialEvents: CalendarEvent[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper arrays
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Selected date events
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  // Build grid cells
  const cells: { day: number | null; dateString: string | null }[] = [];
  
  // Padding for prefix days
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ day: null, dateString: null });
  }

  // Days of the month
  for (let d = 1; d <= totalDays; d++) {
    const isoDateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateString: isoDateString });
  }

  // Helper to filter events by date string
  const getEventsForDate = (dateStr: string) => {
    return initialEvents.filter(e => e.date.startsWith(dateStr));
  };

  const activeDateString = selectedDay 
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` 
    : "";

  const selectedDateEvents = activeDateString ? getEventsForDate(activeDateString) : [];

  const EventDot = ({ type }: { type: string }) => {
    const colors = {
      GOAL: "bg-red-500",
      INTERVIEW: "bg-accent",
      STUDY: "bg-emerald-500",
    };
    return (
      <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", colors[type as keyof typeof colors] || "bg-zinc-400")} />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-accent" />
            Study & Interview Calendar
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Keep track of upcoming deadlines, interview rounds, and deep work sessions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month View Grid */}
        <div className="lg:col-span-2 card p-5 border-border/40 bg-zinc-900/30 space-y-4">
          <div className="flex justify-between items-center pb-2">
            <h2 className="text-sm font-semibold text-white">{monthNames[month]} {year}</h2>
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500 font-medium">
            {dayNames.map(d => <div key={d} className="py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((cell, idx) => {
              const dayEvents = cell.dateString ? getEventsForDate(cell.dateString) : [];
              const isSelected = selectedDay === cell.day;
              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => cell.day && setSelectedDay(cell.day)}
                  disabled={!cell.day}
                  className={cn(
                    "h-14 rounded-md border flex flex-col justify-between p-1.5 text-left transition-all",
                    !cell.day && "bg-transparent border-transparent opacity-0 cursor-default",
                    cell.day && !isSelected && "bg-zinc-900/40 border-border/30 hover:border-zinc-700 hover:bg-zinc-900",
                    isSelected && "bg-accent border-accent-hover text-black shadow-lg shadow-accent/10"
                  )}
                >
                  {cell.day && (
                    <>
                      <span className={cn(
                        "text-[11px] font-bold",
                        isSelected ? "text-black" : "text-zinc-400"
                      )}>
                        {cell.day}
                      </span>
                      {hasEvents && (
                        <div className="flex flex-wrap gap-0.5 max-w-full overflow-hidden">
                          {dayEvents.slice(0, 3).map((e, i) => (
                            <EventDot key={e.id} type={e.type} />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className={cn(
                              "text-[8px] font-extrabold font-mono leading-none shrink-0",
                              isSelected ? "text-black" : "text-zinc-500"
                            )}>
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel */}
        <div className="card p-5 border-border/40 bg-zinc-900/30 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Schedule Checklist
              </h3>
              {selectedDay && (
                <span className="text-xs text-white font-medium">
                  {selectedDay} {monthNames[month].slice(0, 3)}
                </span>
              )}
            </div>

            {selectedDateEvents.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <Sparkles className="h-6 w-6 text-zinc-650 mx-auto mb-2" />
                <p className="text-xs">No scheduled milestones or session logs recorded for this date.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {selectedDateEvents.map((e) => {
                  return (
                    <div 
                      key={e.id} 
                      className={cn(
                        "p-3 rounded border flex items-start gap-2.5 text-xs transition-colors",
                        e.type === "GOAL" && "bg-red-500/5 border-red-500/10 text-red-300",
                        e.type === "INTERVIEW" && "bg-accent/5 border-accent/10 text-accent",
                        e.type === "STUDY" && "bg-emerald-500/5 border-emerald-500/10 text-emerald-300"
                      )}
                    >
                      {e.type === "GOAL" && <Target className="h-4 w-4 shrink-0 mt-0.5" />}
                      {e.type === "INTERVIEW" && <Briefcase className="h-4 w-4 shrink-0 mt-0.5" />}
                      {e.type === "STUDY" && <Clock className="h-4 w-4 shrink-0 mt-0.5" />}
                      
                      <div className="leading-tight">
                        <p className="font-semibold">{e.title}</p>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1 block">
                          {e.type} EVENT
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Color Key */}
          <div className="border-t border-zinc-800/80 pt-4 flex justify-between items-center text-[10px] text-zinc-500 uppercase font-medium">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Due Dates
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Interviews
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Study Hrs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
