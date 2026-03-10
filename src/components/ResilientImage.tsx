"use client";

import { useEffect, useState } from "react";
import Image, { ImageProps } from "next/image";
import { customLoader } from "@/lib/image";
import { DEFAULT_POST_IMAGE_WIDE } from "@/lib/post-image";

interface ResilientImageProps extends Omit<ImageProps, "src" | "loader"> {
  src: string;
  fallbackSrc?: string;
  /**
   * 'wide'  → yatay kart alanlarında yatay placeholder SVG kullanılır (varsayılan)
   * 'tall'  → dikey poster alanlarında dikey placeholder SVG kullanılır
   */
  variant?: "wide" | "tall";
}

export function ResilientImage({
  src,
  fallbackSrc,
  variant = "wide",
  onError,
  alt = "",
  ...props
}: Readonly<ResilientImageProps>) {
  const resolvedFallback =
    fallbackSrc ?? (variant === "tall" ? "/default-post-cover.svg" : DEFAULT_POST_IMAGE_WIDE);

  const [activeSrc, setActiveSrc] = useState(src);

  useEffect(() => {
    setActiveSrc(src);
  }, [src]);

  return (
    <Image
      alt={alt}
      {...props}
      loader={customLoader}
      src={activeSrc}
      onError={(event) => {
        if (activeSrc !== resolvedFallback) {
          setActiveSrc(resolvedFallback);
        }
        onError?.(event);
      }}
      unoptimized
    />
  );
}
