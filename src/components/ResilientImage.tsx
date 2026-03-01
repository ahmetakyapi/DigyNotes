"use client";

import { useEffect, useState } from "react";
import Image, { ImageProps } from "next/image";
import { customLoader } from "@/lib/image";

interface ResilientImageProps extends Omit<ImageProps, "src" | "loader"> {
  src: string;
  fallbackSrc?: string;
}

export function ResilientImage({
  src,
  fallbackSrc = "/default-post-cover.svg",
  onError,
  ...props
}: ResilientImageProps) {
  const [activeSrc, setActiveSrc] = useState(src);

  useEffect(() => {
    setActiveSrc(src);
  }, [src]);

  return (
    <Image
      {...props}
      loader={customLoader}
      src={activeSrc}
      onError={(event) => {
        if (activeSrc !== fallbackSrc) {
          setActiveSrc(fallbackSrc);
        }
        onError?.(event);
      }}
      unoptimized
    />
  );
}
