import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { portfolioData } from "../data/portfolio-data";

export const RawModeToggle = () => {
  const [isRaw, setIsRaw] = useState(false);

  const toggle = useCallback(() => {
    setIsRaw((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isRaw) {
      document.body.classList.add("raw-mode");
    } else {
      document.body.classList.remove("raw-mode");
    }
  }, [isRaw]);

  return (
    <>
      <div className="fixed top-6 right-6 z-chrome flex items-center gap-3">
        <span className="font-mono text-xs font-bold uppercase select-none bg-bg-base border-2 border-black px-2 py-1">
          RAW
        </span>
        <button
          type="button"
          onClick={toggle}
          className="relative w-16 h-9 border-4 border-black bg-bg-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
          aria-label="Toggle raw mode"
          aria-pressed={isRaw}
        >
          <motion.div
            className="absolute top-0.5 w-6 h-full bg-border-dark"
            animate={{ left: isRaw ? "calc(100% - 28px)" : "2px" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {isRaw && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed inset-0 z-overlay bg-bg-base overflow-auto p-8 pt-24"
        >
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-mono text-2xl font-bold">portfolio-data.ts</h2>
              <span className="font-mono text-xs border-2 border-border-dark px-2 py-1 bg-secondary">
                RAW JSON
              </span>
            </div>
            <pre className="font-mono text-xs leading-relaxed bg-border-dark text-bg-base p-8 border-4 border-border-dark shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(portfolioData, null, 2)}
            </pre>
          </div>
        </motion.div>
      )}
    </>
  );
};
