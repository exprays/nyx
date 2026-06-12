"use client";

import React, { useEffect, useState } from "react";

interface LikesDisplayProps {
  slug: string;
}

export function LikesDisplay({ slug }: LikesDisplayProps) {
  const [likes, setLikes] = useState<number | null>(null);

  useEffect(() => {
    // 1. Check local storage for cached count
    const cacheKey = `likes_count_${slug}`;
    const cachedLikes = localStorage.getItem(cacheKey);
    if (cachedLikes !== null) {
      setLikes(parseInt(cachedLikes, 10));
    }

    // 2. Fetch fresh count in the background
    fetch(`/api/likes?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.likes === "number") {
          setLikes(data.likes);
          localStorage.setItem(cacheKey, data.likes.toString());
        } else if (cachedLikes === null) {
          setLikes(0);
        }
      })
      .catch((err) => {
        console.error("Error loading likes count:", err);
        if (cachedLikes === null) {
          setLikes(0);
        }
      });
  }, [slug]);

  if (likes === null) {
    return <span className="font-mono text-smoke-gray uppercase tracking-wider">... Likes</span>;
  }

  return (
    <span className="font-mono text-smoke-gray uppercase tracking-wider">
      {likes} {likes === 1 ? "Like" : "Likes"}
    </span>
  );
}
