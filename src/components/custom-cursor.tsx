import { motion, useMotionValue, useSpring } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { cn } from "../lib/utils";

const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
};

export const CustomCursor = () => {
  const [isTouch, setIsTouch] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
    setIsDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const springConfig = { damping: 25, stiffness: 400 };
  const x = useSpring(cursorX, springConfig);
  const y = useSpring(cursorY, springConfig);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    },
    [cursorX, cursorY, isVisible],
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    const selector = 'a, button, [role="button"], [tabindex="0"]';

    const handleMouseOver = (e: MouseEvent) => {
      if ((e.target as Element).closest(selector)) setIsHovering(true);
    };
    const handleMouseOut = (e: MouseEvent) => {
      if ((e.target as Element).closest(selector)) setIsHovering(false);
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  if (!isVisible || isTouch) return null;

  return (
    <motion.div
      className={cn(
        "fixed top-0 left-0 z-cursor pointer-events-none",
        isDark ? "mix-blend-normal" : "mix-blend-difference",
      )}
      style={{ x, y }}
    >
      <motion.div
        className="relative -translate-x-1/2 -translate-y-1/2"
        animate={{
          width: isHovering ? 32 : 16,
          height: isHovering ? 32 : 16,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      >
        {/* Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("absolute w-full h-[3px]", isDark ? "bg-border-dark" : "bg-white")} />
          <div className={cn("absolute h-full w-[3px]", isDark ? "bg-border-dark" : "bg-white")} />
        </div>
        {/* Outer ring on hover */}
        <motion.div
          className={cn(
            "absolute inset-0 border-[3px]",
            isDark ? "border-border-dark" : "border-white",
          )}
          animate={{ opacity: isHovering ? 1 : 0, scale: isHovering ? 1 : 0.5 }}
          transition={{ duration: 0.15 }}
        />
      </motion.div>
    </motion.div>
  );
};
