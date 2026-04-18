import React from "react";

type SkeletonVariant = "text" | "card" | "avatar" | "image";

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  delay?: number;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: "h-4 rounded-md",
  card: "h-24 rounded-lg",
  avatar: "h-10 w-10 rounded-full",
  image: "h-48 rounded-lg aspect-video",
};

export function Skeleton({
  variant = "text",
  className = "",
  delay = 0,
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-[var(--bg-card)]";
  const variantClass = variantClasses[variant];

  return (
    <div
      className={`${baseClasses} ${variantClass} ${className}`}
      style={{
        animationDelay: `${delay * 50}ms`,
      }}
    />
  );
}

interface SkeletonGroupProps {
  count?: number;
  variant?: SkeletonVariant;
  gap?: string;
  className?: string;
  stagger?: boolean;
}

export function SkeletonGroup({
  count = 3,
  variant = "text",
  gap = "gap-4",
  className = "",
  stagger = false,
}: SkeletonGroupProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          variant={variant}
          delay={stagger ? i : 0}
        />
      ))}
    </div>
  );
}
