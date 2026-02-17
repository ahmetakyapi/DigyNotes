"use client";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onRate?: (value: number) => void;
  size?: number;
}

export default function StarRating({
  rating,
  interactive = false,
  onRate,
  size = 16,
}: StarRatingProps) {
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
                className="absolute left-0 top-0 w-1/2 h-full z-10"
                onClick={() => onRate?.(starNum - 0.5)}
              />
              <span
                className="absolute right-0 top-0 w-1/2 h-full z-10"
                onClick={() => onRate?.(starNum)}
              />
              {starNum <= fullStars ? (
                <FaStar className="text-[#c9a84c]" />
              ) : starNum === fullStars + 1 && hasHalf ? (
                <FaStarHalfAlt className="text-[#c9a84c]" />
              ) : (
                <FaRegStar className="text-[#555555]" />
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
          <FaStar
            key={starNum}
            className="text-[#c9a84c]"
            style={{ fontSize: size }}
          />
        ) : starNum === fullStars + 1 && hasHalf ? (
          <FaStarHalfAlt
            key={starNum}
            className="text-[#c9a84c]"
            style={{ fontSize: size }}
          />
        ) : (
          <FaRegStar
            key={starNum}
            className="text-[#555555]"
            style={{ fontSize: size }}
          />
        );
      })}
    </span>
  );
}
