import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "primary" | "secondary" | "accent";
};

const variantStyles: Record<string, string> = {
  default: "bg-bg-base text-border-dark",
  primary: "bg-primary text-black",
  secondary: "bg-secondary text-black",
  accent: "bg-accent text-black",
};

export const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 font-mono text-sm font-semibold",
        "border-2 border-black rounded-none",
        "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
};
