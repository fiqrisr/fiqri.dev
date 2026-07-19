import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../lib/utils";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "accent" | "ghost";
  size?: "sm" | "default" | "lg" | "icon";
};

const variantStyles: Record<string, string> = {
  default: "bg-primary text-black",
  secondary: "bg-secondary text-black",
  accent: "bg-accent text-black",
  ghost: "bg-bg-base shadow-none border-2",
};

const sizeStyles: Record<string, string> = {
  sm: "h-9 px-3 text-sm",
  default: "h-11 px-5 text-base",
  lg: "h-14 px-8 text-lg",
  icon: "h-11 w-11",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-heading font-bold",
          "border-4 border-black rounded-none",
          "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          "transition-all duration-150 ease-in-out",
          "hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",
          "active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
          "focus-visible:outline-3 focus-visible:outline-dashed focus-visible:outline-secondary focus-visible:outline-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
