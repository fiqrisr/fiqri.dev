import { LogIn, LogOut, ShieldCheck, User } from "lucide-react";
import type { AuthUser } from "../lib/types/guestbook";
import { Badge } from "./badge";
import { Button } from "./button";

export type GuestbookAuthBarProps = {
  user: AuthUser | null;
  isLoading: boolean;
  allowAnonymous?: boolean;
  onLogout: () => Promise<void>;
};

export const GuestbookAuthBar = ({
  user,
  isLoading,
  allowAnonymous = true,
  onLogout,
}: GuestbookAuthBarProps) => {
  if (isLoading) {
    return (
      <div className="border-4 border-black bg-bg-base p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
        <div className="font-mono text-xs text-border-dark/60 animate-pulse flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-secondary border border-black animate-ping" />[
          AUTH_SYNC_IN_PROGRESS... ]
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="border-4 border-black bg-bg-base p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-10 h-10 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover rounded-none"
            />
          ) : (
            <div className="w-10 h-10 border-2 border-black bg-secondary flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <User className="w-5 h-5 text-black" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-border-dark/60 uppercase tracking-wider">
                SIGNED IN AS
              </span>
              {user.isAdmin && (
                <Badge variant="accent" className="text-[10px] px-1.5 py-0">
                  <ShieldCheck className="w-3 h-3 mr-1 inline" />
                  ADMIN
                </Badge>
              )}
            </div>
            <a
              href={`https://github.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-bold text-sm text-border-dark hover:underline"
            >
              @{user.username}
            </a>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="font-mono text-xs flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          SIGN OUT
        </Button>
      </div>
    );
  }

  if (!allowAnonymous) {
    return (
      <div className="border-4 border-black bg-hazard/10 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-dashed">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-hazard uppercase tracking-wider">
              [ AUTH REQUIRED: GITHUB LOGIN ONLY ]
            </span>
            <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 bg-secondary border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              STRICT MODE
            </span>
          </div>
          <p className="font-body text-xs text-border-dark/80 max-w-md">
            Anonymous comments are disabled on this guestbook to prevent spam. You must sign in with
            your GitHub account to drop a comment.
          </p>
        </div>

        <a href="/api/auth/github">
          <Button variant="default" size="sm" className="font-mono text-xs flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            SIGN IN WITH GITHUB
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="border-4 border-black bg-secondary/15 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-dashed">
      <div className="space-y-1">
        <div className="font-mono text-xs font-bold text-hazard uppercase tracking-wider">
          [ AUTH STATUS: GUEST ]
        </div>
        <p className="font-body text-xs text-border-dark/80 max-w-md">
          Sign in with GitHub to verify your message and display your GitHub profile badge, or post
          anonymously below.
        </p>
      </div>

      <a href="/api/auth/github">
        <Button variant="default" size="sm" className="font-mono text-xs flex items-center gap-2">
          <LogIn className="w-4 h-4" />
          SIGN IN WITH GITHUB
        </Button>
      </a>
    </div>
  );
};
