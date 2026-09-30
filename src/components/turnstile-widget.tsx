import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";

export type TurnstileWidgetProps = {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (error?: unknown) => void;
  onExpire?: () => void;
  className?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: (error?: unknown) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          "refresh-expired"?: "auto" | "manual" | "never";
          "retry-interval"?: number;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export const TurnstileWidget = ({
  siteKey,
  onVerify,
  onError,
  onExpire,
  className,
}: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Store latest callbacks in refs so changing function identity does NOT re-trigger useEffect
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;
  });

  const renderWidget = useCallback(() => {
    if (
      typeof window === "undefined" ||
      !window.turnstile ||
      !containerRef.current ||
      widgetIdRef.current
    ) {
      return;
    }

    try {
      setErrorMessage(null);
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          setErrorMessage(null);
          onVerifyRef.current(token);
        },
        "error-callback": (err: unknown) => {
          // Cloudflare Turnstile error codes: 110200 = domain mismatch, etc.
          const errorStr = String(err || "");
          let userFriendly = "Security verification encountered an error.";
          if (
            errorStr.includes("401") ||
            errorStr.includes("110200") ||
            errorStr.includes("domain")
          ) {
            userFriendly =
              "Domain authorization mismatch. Ensure this domain (fiqri.dev) is added to Allowed Domains in Cloudflare Turnstile dashboard.";
          }
          setErrorMessage(userFriendly);
          onErrorRef.current?.(err);
        },
        "expired-callback": () => {
          onExpireRef.current?.();
        },
        theme: "auto",
        "refresh-expired": "manual",
      });
      setIsLoaded(true);
    } catch (err) {
      setErrorMessage("Failed to initialize security verification.");
      onErrorRef.current?.(err);
    }
  }, [siteKey]);

  const handleRetry = () => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        setErrorMessage(null);
      } catch {
        // If reset fails, re-render
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
        renderWidget();
      }
    } else {
      renderWidget();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !siteKey) return;

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.getElementById("cf-turnstile-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "cf-turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          renderWidget();
        };
        document.head.appendChild(script);
      } else {
        const checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            renderWidget();
          }
        }, 100);

        return () => clearInterval(checkInterval);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, renderWidget]);

  return (
    <div className={cn("flex flex-col items-center justify-center p-2 min-h-[65px]", className)}>
      <div ref={containerRef} className="flex items-center justify-center" />

      {!isLoaded && !errorMessage && (
        <div className="font-mono text-xs text-border-dark/60 animate-pulse">
          [ LOADING_SECURITY_CHECK... ]
        </div>
      )}

      {errorMessage && (
        <div className="mt-2 p-2 bg-hazard/10 border border-hazard font-mono text-[11px] text-hazard text-center max-w-sm">
          <p className="font-bold mb-1">[ VERIFICATION NOTICE ]</p>
          <p className="mb-2">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1 px-2 py-0.5 border border-black bg-bg-base text-border-dark font-bold hover:bg-secondary transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> RETRY
          </button>
        </div>
      )}
    </div>
  );
};
