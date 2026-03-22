import { useMemo, useState } from "react";
import { ImageIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MealMediaProps {
  image: string;
  imageType: "emoji" | "static" | "generated" | "upload" | "local";
  imageSource: string;
  alt: string;
  size?: "sm" | "md";
}

function resolveRenderableSource(imageSource: string, imageType: MealMediaProps["imageType"]) {
  if (imageType === "local" && imageSource.startsWith("/images/")) return null;
  if (/^https?:\/\//.test(imageSource) || imageSource.startsWith("data:image/") || imageSource.startsWith("/")) return imageSource;
  return null;
}

export function MealMedia({ image, imageType, imageSource, alt, size = "md" }: MealMediaProps) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => resolveRenderableSource(imageSource, imageType), [imageSource, imageType]);
  const sizes = size === "sm" ? "h-12 w-12 rounded-2xl" : "h-16 w-16 rounded-[1.35rem]";

  if (imageType === "emoji") {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-teal-500/15 via-sky-500/10 to-violet-500/15 text-2xl ring-1 ring-border/60", sizes)}>
        <span aria-hidden="true">{image}</span>
      </div>
    );
  }

  if (src && !failed) {
    return (
      <div className={cn("overflow-hidden bg-muted ring-1 ring-border/60", sizes)}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-slate-100 via-teal-50 to-sky-100 ring-1 ring-border/60 dark:from-slate-900 dark:via-teal-950/40 dark:to-sky-950/40", sizes)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.16),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.16),transparent_40%)]" />
      <div className="relative flex h-full w-full items-center justify-center">
        {imageType === "generated" ? (
          <Sparkles className="h-5 w-5 text-primary/80" />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
