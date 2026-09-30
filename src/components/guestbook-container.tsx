import { useEffect, useState } from "react";
import type { AuthUser, GuestbookEntry, GuestbookResponse } from "../lib/types/guestbook";
import { GuestbookAuthBar } from "./guestbook-auth-bar";
import { GuestbookForm } from "./guestbook-form";
import { GuestbookList } from "./guestbook-list";

export type GuestbookContainerProps = {
  initialEntries?: GuestbookEntry[];
  turnstileSiteKey?: string;
};

export const GuestbookContainer = ({
  initialEntries = [],
  turnstileSiteKey,
}: GuestbookContainerProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [entries, setEntries] = useState<GuestbookEntry[]>(initialEntries);
  const [activeSiteKey, setActiveSiteKey] = useState<string>(turnstileSiteKey || "");
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isEntriesLoading, setIsEntriesLoading] = useState<boolean>(initialEntries.length === 0);
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = (await response.json()) as {
            authenticated: boolean;
            user: AuthUser | null;
            turnstileSiteKey?: string;
          };
          setUser(data.user);
          if (data.turnstileSiteKey) {
            setActiveSiteKey(data.turnstileSiteKey);
          }
        }
      } catch {
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    const fetchEntries = async () => {
      try {
        const response = await fetch("/api/guestbook?limit=50");
        if (response.ok) {
          const data = (await response.json()) as GuestbookResponse;
          setEntries(data.entries);
        }
      } catch {
        // keep initial entries on error
      } finally {
        setIsEntriesLoading(false);
      }
    };

    fetchSession();
    fetchEntries();
  }, []);

  const handleEntryCreated = (newEntry: GuestbookEntry) => {
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleDeleteEntry = async (id: string) => {
    const response = await fetch(`/api/guestbook/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error || "Failed to delete message");
    }

    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch {}
  };

  return (
    <div className="space-y-8">
      <GuestbookAuthBar user={user} isLoading={isAuthLoading} onLogout={handleLogout} />

      <GuestbookForm
        user={user}
        turnstileSiteKey={activeSiteKey}
        onEntryCreated={handleEntryCreated}
      />

      <GuestbookList
        entries={entries}
        currentUser={user}
        onDeleteEntry={handleDeleteEntry}
        isLoading={isEntriesLoading}
      />
    </div>
  );
};
