import { useState } from "react";
import { useCreateTag, useDeleteTag } from "@/hooks/use-planner";
import { formatISODate } from "@/lib/date-utils";
import type { DayTag } from "@shared/schema";
import { X } from "lucide-react";
import { ExpandableText } from "./ExpandableText";
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
    if (e.key === 'Backspace' && !input && dayTags.length > 0) {
      deleteTag.mutate(dayTags[dayTags.length - 1].id);
    }
  };

  return (
    <div className="mb-1" data-testid="focus-tags-section">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🔥</span>
        <h3 className="font-bold text-base md:text-lg text-slate-800 dark:text-slate-100">على ماذا تريد التركيز اليوم؟</h3>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AnimatePresence mode="popLayout">
          {dayTags.map((tag) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              layout
              className="group flex items-center gap-1.5 bg-primary/6 dark:bg-primary/15 text-primary border border-primary/15 dark:border-primary/25 px-3.5 py-1.5 rounded-full text-sm md:text-base font-semibold cursor-default"
              data-testid={`focus-tag-${tag.id}`}
            >
              <ExpandableText text={tag.text} maxLength={35} />
              <button
                onClick={() => deleteTag.mutate(tag.id)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-0.5 hover:bg-primary/15 rounded-full -mr-0.5"
                data-testid={`delete-tag-${tag.id}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dayTags.length === 0 ? "أضف هدفاً رئيسياً لليوم..." : "أضف المزيد..."}
          className="flex-1 min-w-[140px] bg-transparent text-sm md:text-base py-1.5 text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none"
          data-testid="input-focus-tag"
        />
      </div>
    </div>
  );
}
