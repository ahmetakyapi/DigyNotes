"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface FollowUser {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  postCount: number;
}

interface FollowListModalProps {
  username: string;
  type: "followers" | "following";
  onClose: () => void;
}

const customLoader = ({ src }: { src: string }) => src;

export default function FollowListModal({ username, type, onClose }: FollowListModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  const title = type === "followers" ? "Takipçiler" : "Takip Edilenler";

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/users/${username}/${type}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username, type]);

  useEffect(() => {
    load();
  }, [load]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--bg-raised)]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-28 animate-pulse rounded bg-[var(--bg-raised)]" />
                    <div className="h-2.5 w-20 animate-pulse rounded bg-[var(--bg-raised)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                {type === "followers" ? "Henüz takipçi yok." : "Henüz kimse takip edilmiyor."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {users.map((u) => (
                <li key={u.id}>
                  <Link
                    href={u.username ? `/profile/${u.username}` : "#"}
                    onClick={onClose}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--bg-raised)]"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-raised)]">
                      {u.avatarUrl ? (
                        <Image
                          loader={customLoader}
                          src={u.avatarUrl}
                          alt={u.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-sm font-semibold text-[#c4a24b]">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{u.name}</p>
                      {u.username && (
                        <p className="text-xs text-[var(--text-muted)]">@{u.username}</p>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-[var(--text-muted)]">{u.postCount} not</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
