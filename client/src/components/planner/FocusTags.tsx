import React, { useState } from "react";
import { useCreateTag, useDeleteTag } from "@/hooks/use-planner";
import { formatISODate } from "@/lib/date-utils";
import { DayTag } from "@shared/schema";
import { X, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FocusTags({ tags, selectedDate }: { tags: DayTag[], selectedDate: Date }) {
  const [input, setInput] = useState("");
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const dateISO = formatISODate(selectedDate);
  const dayTags = tags.filter(t => t.date === dateISO);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      createTag.mutate({ date: dateISO, text: input.trim() });
      setInput("");
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 text-slate-700">
        <Hash className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">بؤرة التركيز</h3>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <AnimatePresence>
          {dayTags.map((tag) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group flex items-center gap-2 bg-primary/5 text-primary border border-primary/20 px-3 py-1.5 rounded-xl text-sm font-semibold"
            >
              {tag.text}
              <button 
                onClick={() => deleteTag.mutate(tag.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-primary/20 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="أضف هدفاً رئيسياً لليوم (اضغط Enter)"
        className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
      />
    </div>
  );
}
