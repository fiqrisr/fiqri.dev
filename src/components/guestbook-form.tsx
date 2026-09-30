import { AlertCircle, CheckCircle2, Send, Sparkles, UserX } from "lucide-react";
import { useState } from "react";
import type { AuthUser, GuestbookEntry } from "../lib/types/guestbook";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { TurnstileWidget } from "./turnstile-widget";

export type GuestbookFormProps = {
  user: AuthUser | null;
  turnstileSiteKey?: string;
  onEntryCreated: (entry: GuestbookEntry) => void;
};

const MAX_MESSAGE_CHARS = 300;

export const GuestbookForm = ({
  user,
  turnstileSiteKey = "0x4AAAAAAAx_test_key_xxxx",
  onEntryCreated,
}: GuestbookFormProps) => {
  const [message, setMessage] = useState<string>("");
  const [anonymousName, setAnonymousName] = useState<string>("");
  const [forceAnonymous, setForceAnonymous] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileResetKey, setTurnstileResetKey] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const isPostingAnonymously = !user || forceAnonymous;
  const remainingChars = MAX_MESSAGE_CHARS - message.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmed = message.trim();
    if (!trimmed) {
      setError("Please write a message before submitting.");
      return;
    }

    if (trimmed.length > MAX_MESSAGE_CHARS) {
      setError(`Message exceeds ${MAX_MESSAGE_CHARS} characters.`);
      return;
    }

    if (isPostingAnonymously && !turnstileToken) {
      if (!turnstileSiteKey) {
        setError("Security check is still initializing. Please wait a moment.");
      } else {
        setError("Please complete the security verification challenge.");
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: {
        message: string;
        name?: string;
        turnstileToken?: string;
      } = {
        message: trimmed,
      };

      if (isPostingAnonymously) {
        if (anonymousName.trim()) {
          payload.name = anonymousName.trim();
        }
        if (turnstileToken) {
          payload.turnstileToken = turnstileToken;
        }
      }

      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to submit message");
      }

      const newEntry = (await response.json()) as GuestbookEntry;
      setMessage("");
      setAnonymousName("");
      setTurnstileToken("");
      setTurnstileResetKey((prev) => prev + 1);
      setSuccess(true);
      onEntryCreated(newEntry);

      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-4 border-black bg-bg-base p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-black pb-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-primary border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap shrink-0">
            [ FORM: INPUT_CHANNEL ]
          </span>
          <h3 className="font-heading font-bold text-lg leading-tight">Sign the Ledger</h3>
        </div>

        {user && (
          <button
            type="button"
            onClick={() => setForceAnonymous(!forceAnonymous)}
            className="font-mono text-xs font-semibold underline hover:text-hazard transition-colors flex items-center gap-1.5 self-start md:self-auto shrink-0"
          >
            {forceAnonymous ? (
              <>
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Post as @{user.username}</span>
              </>
            ) : (
              <>
                <UserX className="w-3.5 h-3.5 shrink-0" />
                <span>Post anonymously instead</span>
              </>
            )}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isPostingAnonymously && (
          <div>
            <label
              htmlFor="guestbook-name"
              className="block font-mono text-xs font-bold uppercase tracking-wider mb-1"
            >
              YOUR NAME / CALLSIGN (OPTIONAL)
            </label>
            <input
              id="guestbook-name"
              type="text"
              maxLength={50}
              placeholder="e.g. Fellow Dev, Alex, Neo"
              value={anonymousName}
              onChange={(e) => setAnonymousName(e.target.value)}
              disabled={isSubmitting}
              className={cn(
                "w-full px-4 py-2.5 bg-white text-border-dark border-2 border-black font-body text-sm rounded-none",
                "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-3 focus:outline-dashed focus:outline-secondary",
                "disabled:opacity-50",
              )}
            />
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="guestbook-message"
              className="block font-mono text-xs font-bold uppercase tracking-wider"
            >
              MESSAGE
            </label>
            <span
              className={cn(
                "font-mono text-xs font-bold",
                remainingChars < 20 ? "text-hazard" : "text-border-dark/60",
              )}
            >
              {remainingChars} / {MAX_MESSAGE_CHARS}
            </span>
          </div>
          <textarea
            id="guestbook-message"
            rows={3}
            maxLength={MAX_MESSAGE_CHARS}
            placeholder={
              user && !forceAnonymous
                ? `Write your note as @${user.username}...`
                : "Share a greeting, note on architecture, or drop your project link..."
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSubmitting}
            required
            className={cn(
              "w-full px-4 py-3 bg-white text-border-dark border-2 border-black font-body text-sm rounded-none resize-y min-h-[90px]",
              "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-3 focus:outline-dashed focus:outline-secondary",
              "disabled:opacity-50",
            )}
          />
        </div>

        {isPostingAnonymously && (
          <div className="border-2 border-black bg-white/50 p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {turnstileSiteKey ? (
              <TurnstileWidget
                siteKey={turnstileSiteKey}
                resetKey={turnstileResetKey}
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken("")}
              />
            ) : (
              <div className="p-3 font-mono text-xs text-border-dark/60 text-center animate-pulse">
                [ INITIALIZING_SECURITY_CHECK... ]
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-hazard text-white border-2 border-black font-mono text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>[ ERROR: {error} ]</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-accent text-black border-2 border-black font-mono text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>[ TRANSMISSION LOGGED: Message added to guestbook! ]</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="font-mono text-[11px] text-border-dark/60">
            {user && !forceAnonymous ? (
              <span className="text-accent font-bold">✓ Verified via GitHub identity</span>
            ) : (
              <span>Posting in anonymous mode</span>
            )}
          </div>

          <Button
            type="submit"
            variant="default"
            size="default"
            disabled={isSubmitting || message.trim().length === 0}
            className="w-full sm:w-auto font-mono text-xs tracking-wider flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "TRANSMITTING..." : "TRANSMIT ENTRY"}
          </Button>
        </div>
      </form>
    </div>
  );
};
