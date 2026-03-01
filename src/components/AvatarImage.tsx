"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { customLoader } from "@/lib/image";

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  name: string;
  size: number;
  className?: string;
  textClassName?: string;
}

export function AvatarImage({
  src,
  alt,
  name,
  size,
  className = "",
  textClassName = "",
}: AvatarImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <span className={textClassName}>
        {name.trim().charAt(0).toUpperCase() || "?"}
      </span>
    );
  }

  return (
    <Image
      loader={customLoader}
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}
