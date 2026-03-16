import { useState } from "react";
import { useCreateTag, useDeleteTag } from "@/hooks/use-planner";
import { formatISODate } from "@/lib/date-utils";
import type { DayTag } from "@shared/schema";
import { X } from "lucide-react";
import { ExpandableText } from "./ExpandableText";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
        <h3 className="font-bold text-base md:text-lg text-foreground">على ماذا تريد التركيز اليوم؟</h3>
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
              className="group inline-flex items-center gap-1.5"
              data-testid={`focus-tag-${tag.id}`}
            >
              <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 rounded-full text-sm font-semibold cursor-default">
                <ExpandableText text={tag.text} maxLength={35} />
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-full -mr-0.5 hover:bg-primary/15 text-primary"
                onClick={() => deleteTag.mutate(tag.id)}
                data-testid={`delete-tag-${tag.id}`}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dayTags.length === 0 ? "أضف هدفاً رئيسياً لليوم..." : "أضف المزيد..."}
          className="flex-1 min-w-[140px] border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 px-0"
          data-testid="input-focus-tag"
        />
      </div>
    </div>
  );
}

