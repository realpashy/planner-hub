import React, { useRef, useEffect } from "react";
import { formatDayDate, getArabicDay, isSameDay } from "@/lib/date-utils";
import { motion } from "framer-motion";

interface DayStripProps {
  days: Date[];
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

export function DayStrip({ days, selectedDate, onSelect }: DayStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected day on mount or change
  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate, days]);

  return (
    <div className="relative mb-6">
      {/* Fade Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto hide-scrollbar gap-3 px-4 py-2"
        dir="rtl"
      >
        {days.map((date, i) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          
          return (
            <motion.button
              key={date.toISOString()}
              data-selected={isSelected}
              onClick={() => onSelect(date)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                flex-shrink-0 flex flex-col items-center justify-center 
                w-[4.5rem] h-[5.5rem] rounded-2xl transition-colors duration-300
                ${isSelected 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                  : 'bg-white text-slate-600 border border-slate-100 hover:border-primary/30'}
                ${isToday && !isSelected ? 'ring-2 ring-primary/20 ring-offset-2 ring-offset-background' : ''}
              `}
            >
              <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                {getArabicDay(date).split(' ')[0]}
              </span>
              <span className="text-xl font-bold">
                {date.getDate()}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
