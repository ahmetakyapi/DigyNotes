"use client";
import { StarIcon, StarHalfIcon } from "@phosphor-icons/react";

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onRate?: (value: number) => void;
  size?: number;
  /** "onMedia": stars sit on a dark photo/scrim — lavender in both themes
      (the light theme's violet accent vanished on dark covers). */
  tone?: "default" | "onMedia";
}

export default function StarRating({
  rating,
  interactive = false,
  onRate,
  size = 16,
  tone = "default",
}: StarRatingProps) {
  const on = tone === "onMedia" ? "text-[#b9a8ff]" : "text-accent";
  const off = tone === "onMedia" ? "text-white/35" : "text-[var(--text-faint)]";
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  if (interactive) {
    return (
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => {
          const starNum = i + 1;
          return (
            <span
              key={starNum}
              className="relative inline-block cursor-pointer"
              style={{ fontSize: size, lineHeight: 1 }}
            >
              <span
                className="absolute left-0 top-0 z-10 h-full w-1/2"
                onClick={() => onRate?.(starNum - 0.5)}
              />
              <span
                className="absolute right-0 top-0 z-10 h-full w-1/2"
                onClick={() => onRate?.(starNum)}
              />
              {starNum <= fullStars ? (
                <StarIcon size={size} weight="fill" className={on} />
              ) : starNum === fullStars + 1 && hasHalf ? (
                <StarHalfIcon size={size} weight="fill" className={on} />
              ) : (
                <StarIcon size={size} className={off} />
              )}
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const starNum = i + 1;
        return starNum <= fullStars ? (
          <StarIcon key={starNum} size={size} weight="fill" className={on} />
        ) : starNum === fullStars + 1 && hasHalf ? (
          <StarHalfIcon key={starNum} size={size} weight="fill" className={on} />
        ) : (
          <StarIcon key={starNum} size={size} className={off} />
        );
      })}
    </span>
  );
}
