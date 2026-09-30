import { ExternalLink, Trash2, User, UserCheck } from "lucide-react";
import { useState } from "react";
import { isSafeHttpsUrl, isValidGitHubUsername } from "../lib/guestbook-validation";
import type { AuthUser, GuestbookEntry } from "../lib/types/guestbook";
import { cn } from "../lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";

export type GuestbookListProps = {
  entries: GuestbookEntry[];
  currentUser: AuthUser | null;
  onDeleteEntry: (id: string) => Promise<void>;
  isLoading?: boolean;
};

const formatRelativeTime = (timestamp: number): string => {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "Recently";
  const diff = Date.now() - timestamp;
  // Handle clock skew or immediately created entries
  if (diff < 60000) return "Just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const GuestbookList = ({
  entries,
  currentUser,
  onDeleteEntry,
  isLoading,
}: GuestbookListProps) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await onDeleteEntry(id);
      setConfirmDeleteId(null);
    } catch (err) {
      setDeleteError({
        id,
        message: err instanceof Error ? err.message : "Failed to delete message",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading && entries.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-4 border-black bg-bg-base p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black/10 border-2 border-black" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-black/10 w-32 border border-black" />
                <div className="h-3 bg-black/10 w-20 border border-black" />
              </div>
            </div>
            <div className="h-4 bg-black/10 w-full border border-black" />
            <div className="h-4 bg-black/10 w-2/3 border border-black" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="border-4 border-black bg-bg-base p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="inline-block p-3 border-2 border-black bg-secondary mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <User className="w-8 h-8 text-black" />
        </div>
        <h4 className="font-heading font-bold text-lg mb-1">NO ENTRIES LOGGED YET</h4>
        <p className="font-mono text-xs text-border-dark/70 max-w-sm mx-auto">
          [ LOG_STATUS: EMPTY ] Be the first to leave your message in the terminal guestbook!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b-2 border-black">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-border-dark/70">
          LOGGED MESSAGES ({entries.length})
        </span>
        <span className="font-mono text-[11px] text-border-dark/50">
          [ SYSTEM: D1_REPLICA_FEED ]
        </span>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => {
          const isOwner = currentUser && entry.userId && currentUser.id === entry.userId;
          const canDelete = currentUser?.isAdmin || isOwner;
          const isConfirming = confirmDeleteId === entry.id;
          const isDeleting = deletingId === entry.id;
          const hasAvatarFailed = failedAvatars[entry.id];
          const hasSafeAvatar =
            !hasAvatarFailed &&
            Boolean(entry.githubAvatarUrl && isSafeHttpsUrl(entry.githubAvatarUrl));
          const hasSafeUsername =
            !entry.isAnonymous &&
            Boolean(entry.githubUsername && isValidGitHubUsername(entry.githubUsername));
          const hasDeleteError = deleteError?.id === entry.id;

          return (
            <div
              key={entry.id}
              className={cn(
                "border-4 border-black bg-bg-base p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                "transition-all duration-150 ease-in-out",
                entry.isAnonymous ? "border-dashed" : "border-solid",
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {hasSafeAvatar && entry.githubAvatarUrl ? (
                    <img
                      src={entry.githubAvatarUrl}
                      alt={entry.name}
                      onError={() => setFailedAvatars((prev) => ({ ...prev, [entry.id]: true }))}
                      className="w-10 h-10 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover rounded-none shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 border-2 border-black bg-secondary/30 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                      <User className="w-5 h-5 text-border-dark" />
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-bold text-sm text-border-dark">
                        {entry.name}
                      </span>

                      {hasSafeUsername && entry.githubUsername && (
                        <a
                          href={`https://github.com/${entry.githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center font-mono text-xs font-semibold text-border-dark hover:underline hover:text-accent"
                        >
                          @{entry.githubUsername}
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                        </a>
                      )}

                      {!entry.isAnonymous ? (
                        <Badge variant="accent" className="text-[10px] py-0 px-1.5 font-bold">
                          <UserCheck className="w-2.5 h-2.5 mr-1 inline" />
                          VERIFIED
                        </Badge>
                      ) : (
                        <Badge
                          variant="default"
                          className="text-[10px] py-0 px-1.5 text-border-dark/70"
                        >
                          ANONYMOUS
                        </Badge>
                      )}
                    </div>

                    <div className="font-mono text-[11px] text-border-dark/60 mt-0.5">
                      {formatRelativeTime(entry.createdAt)}
                    </div>
                  </div>
                </div>

                {canDelete && (
                  <div className="shrink-0">
                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="accent"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => handleDelete(entry.id)}
                          className="bg-hazard text-white text-[11px] px-2 h-7 font-mono font-bold hover:bg-hazard"
                        >
                          {isDeleting ? "..." : "CONFIRM"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[11px] px-2 h-7 font-mono"
                        >
                          CANCEL
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(entry.id)}
                        title={
                          currentUser?.isAdmin ? "Delete message (Admin)" : "Delete your message"
                        }
                        className="p-1.5 border-2 border-transparent hover:border-black hover:bg-hazard/20 transition-all text-border-dark/60 hover:text-hazard"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {hasDeleteError && (
                <div
                  role="alert"
                  className="mt-2 mb-2 p-2 bg-hazard/20 border-2 border-hazard font-mono text-xs text-hazard font-bold"
                >
                  [ DELETE_FAILED: {deleteError.message} ]
                </div>
              )}

              <p className="font-body text-sm text-border-dark leading-relaxed whitespace-pre-wrap break-words pl-0 sm:pl-[52px]">
                {entry.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
