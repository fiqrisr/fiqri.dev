import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";

export type NavLink = {
  href: string;
  label: string;
  ref: string;
};

export const navLinks: NavLink[] = [
  { href: "/", label: "Home", ref: "000" },
  { href: "/experience", label: "Experience", ref: "001" },
  { href: "/#projects", label: "Projects", ref: "002" },
  { href: "/#skills", label: "Skills", ref: "003" },
  { href: "/#contact", label: "Contact", ref: "004" },
  { href: "/guestbook", label: "Guestbook", ref: "005" },
];

export type SectionNavProps = {
  currentPath?: string;
};

export const SectionNav = ({ currentPath = "/" }: SectionNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const [activePathname, setActivePathname] = useState(currentPath);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Sync route and hash on client
  useEffect(() => {
    setActivePathname(window.location.pathname);
    setActiveHash(window.location.hash);

    const handleHashChange = () => {
      setActiveHash(window.location.hash);
      setActivePathname(window.location.pathname);
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, []);

  // Track scroll position for header offset
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 32);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll and notify ScrollToTop when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.dataset.dialogOpen = "true";
      menuRef.current?.focus();
    } else {
      document.body.style.overflow = "";
      delete document.body.dataset.dialogOpen;
    }

    return () => {
      document.body.style.overflow = "";
      delete document.body.dataset.dialogOpen;
    };
  }, [isOpen]);

  // Close menu on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        toggleButtonRef.current?.focus();
      }
    },
    [isOpen],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Close menu on resize to desktop (>= 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  const isLinkActive = useCallback(
    (href: string) => {
      if (href === "/") {
        return activePathname === "/" && (!activeHash || activeHash === "#");
      }
      if (href.startsWith("/#")) {
        const hash = href.slice(1);
        return activePathname === "/" && activeHash === hash;
      }
      return activePathname === href || activePathname === `${href}/`;
    },
    [activePathname, activeHash],
  );

  const handleLinkClick = useCallback(
    (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
      setIsOpen(false);

      // Smooth scroll if clicking Home when already on "/" with no hash
      if (href === "/" && activePathname === "/" && !activeHash) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (href.startsWith("/#") && activePathname === "/") {
        const targetId = href.slice(2);
        const element = document.getElementById(targetId);
        if (element) {
          e.preventDefault();
          element.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", `#${targetId}`);
          setActiveHash(`#${targetId}`);
        }
      }
    },
    [activePathname, activeHash],
  );

  const handleToggleRaw = useCallback(() => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("toggle-raw-mode"));
  }, []);

  return (
    <>
      {/* ── Desktop Navigation Bar (hidden on mobile, visible md+) ── */}
      <nav
        id="top-nav"
        aria-label="Section navigation"
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-overlay hidden md:flex",
          "border-2 border-black bg-bg-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          "transition-all duration-300 ease-in-out",
          isScrolled ? "top-6" : "top-12",
        )}
      >
        {navLinks.map((link, i) => {
          const active = isLinkActive(link.href);
          return (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleLinkClick(link.href, e)}
              className={cn(
                "px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em]",
                "hover:bg-secondary active:bg-primary transition-colors duration-150",
                i > 0 && "border-l-2 border-black",
                active && "bg-secondary",
              )}
            >
              <span className="text-hazard mr-1">{link.ref}</span>
              {link.label}
            </a>
          );
        })}
      </nav>

      {/* ── Mobile Top Bar (visible on mobile, hidden md+) ── */}
      <div
        className={cn(
          "fixed inset-x-3 z-overlay md:hidden",
          "transition-all duration-300 ease-in-out",
          isScrolled ? "top-3" : "top-11",
        )}
      >
        <header
          className={cn(
            "flex items-center justify-between px-3 py-2",
            "bg-bg-base border-2 border-black",
            "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          )}
        >
          {/* Brand / Home Link */}
          <a
            href="/"
            onClick={(e) => handleLinkClick("/", e)}
            className="flex items-center gap-2 group"
            aria-label="Fiqri Syah Redha portfolio - Home"
          >
            <span
              className="inline-block h-2.5 w-2.5 bg-hazard border border-black"
              aria-hidden="true"
            />
            <span className="font-heading font-bold text-sm tracking-tight text-black group-hover:text-hazard transition-colors">
              FIQRI.DEV
            </span>
            <span className="font-mono text-[10px] text-border-dark/60 border border-black/40 px-1 bg-bg-base">
              000
            </span>
          </a>

          {/* Current Page Pill + Menu Toggle */}
          <div className="flex items-center gap-2">
            {activePathname === "/guestbook" && (
              <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-primary border border-black">
                GUESTBOOK
              </span>
            )}

            <button
              ref={toggleButtonRef}
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1",
                "bg-secondary border-2 border-black rounded-none",
                "font-mono text-xs font-bold uppercase tracking-wider",
                "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                "hover:bg-primary hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
                "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
                "focus-visible:outline-3 focus-visible:outline-dashed focus-visible:outline-secondary",
                "transition-all duration-150",
              )}
            >
              <span>{isOpen ? "CLOSE" : "MENU"}</span>
              {isOpen ? (
                <X size={14} strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <Menu size={14} strokeWidth={2.5} aria-hidden="true" />
              )}
            </button>
          </div>
        </header>
      </div>

      {/* ── Mobile Menu Drawer Overlay & Content ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-overlay bg-black/60 backdrop-blur-xs md:hidden"
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              ref={menuRef}
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Menu"
              tabIndex={-1}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsOpen(false);
                  toggleButtonRef.current?.focus();
                }
              }}
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
              className={cn(
                "fixed top-24 inset-x-3 z-chrome md:hidden",
                "bg-bg-base border-4 border-black rounded-none",
                "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
                "p-4 max-h-[calc(100dvh-7.5rem)] overflow-y-auto",
                "focus:outline-none",
              )}
            >
              {/* Telemetry Header */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-hazard text-white border border-black">
                    INDEX
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-border-dark/80">
                    {"SYS // NAVIGATION"}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-border-dark/60 font-bold">
                  [ 000–005 ]
                </span>
              </div>

              {/* Hazard Warning Stripes */}
              <div
                className="h-2 bg-hazard-stripes border-b-2 border-black -mx-4 my-3"
                aria-hidden="true"
              />

              {/* Routes List */}
              <nav aria-label="Mobile section links" className="flex flex-col gap-2 my-1">
                {navLinks.map((link) => {
                  const active = isLinkActive(link.href);
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleLinkClick(link.href, e)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-3",
                        "font-mono text-xs font-bold uppercase tracking-wider",
                        "border-2 border-black rounded-none",
                        "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
                        "transition-all duration-150",
                        "hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",
                        "active:shadow-none active:translate-x-[3px] active:translate-y-[3px]",
                        "focus-visible:outline-3 focus-visible:outline-dashed focus-visible:outline-secondary",
                        active
                          ? "bg-secondary text-black"
                          : "bg-bg-base text-border-dark hover:bg-secondary/40",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-hazard font-bold">{link.ref}</span>
                        <span>{link.label}</span>
                      </div>
                      {active ? (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-black text-secondary font-bold">
                          CURRENT
                        </span>
                      ) : (
                        <span className="text-border-dark/40 font-mono text-xs" aria-hidden="true">
                          →
                        </span>
                      )}
                    </a>
                  );
                })}
              </nav>

              {/* Raw Mode Toggle in Menu */}
              <div className="mt-3 pt-3 border-t-2 border-black flex items-center justify-between">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-black">
                    RAW DATA MODE
                  </div>
                  <div className="font-mono text-[9px] text-border-dark/60 uppercase">
                    INSPECT JSON SPEC
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleRaw}
                  className={cn(
                    "px-2.5 py-1 bg-bg-base border-2 border-black rounded-none",
                    "font-mono text-[10px] font-bold uppercase tracking-wider",
                    "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                    "hover:bg-secondary hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
                    "active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                    "transition-all duration-150",
                  )}
                >
                  TOGGLE RAW
                </button>
              </div>

              {/* Industrial Spec Footer */}
              <div className="mt-3 pt-3 border-t-2 border-black/20 flex items-center justify-between font-mono text-[9px] text-border-dark/60 uppercase tracking-wider">
                <span>{"SYS // ONLINE"}</span>
                <span>REV 2.6</span>
                <span>JAKARTA, ID</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
