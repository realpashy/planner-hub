import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  expandedClassName?: string;
}

export function ExpandableText({ text, maxLength = 60, className = "", expandedClassName = "" }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > maxLength;

  if (!needsTruncation) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
      className={`cursor-pointer ${expanded ? expandedClassName || className : className}`}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      {expanded ? text : `${text.slice(0, maxLength).trimEnd()}...`}
    </span>
  );
}
