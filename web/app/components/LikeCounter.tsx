"use client";

import React, { useState, useEffect } from "react";

interface LikeCounterProps {
  slug: string;
}

export function LikeCounter({ slug }: LikeCounterProps) {
  const [likes, setLikes] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [animating, setAnimating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check local storage for liked status
    const likedKey = `liked_${slug}`;
    const localLiked = localStorage.getItem(likedKey) === "true";
    setHasLiked(localLiked);

    // 2. Check local storage for cached likes count (Stale-While-Revalidate)
    const cacheKey = `likes_count_${slug}`;
    const cachedLikes = localStorage.getItem(cacheKey);
    if (cachedLikes !== null) {
      setLikes(parseInt(cachedLikes, 10));
      setLoading(false);
    } else {
      setLoading(true);
    }

    // 3. Fetch fresh total likes from API in background
    fetch(`/api/likes?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.likes === "number") {
          setLikes(data.likes);
          localStorage.setItem(cacheKey, data.likes.toString());
        }
      })
      .catch((err) => console.error("Error fetching likes:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLike = async () => {
    if (submitting) return;

    const action = hasLiked ? "unlike" : "like";
    const likedKey = `liked_${slug}`;
    const cacheKey = `likes_count_${slug}`;

    // Optimistic UI updates (near-instantaneous display update)
    const targetLikes = action === "like" ? likes + 1 : Math.max(0, likes - 1);
    setHasLiked(!hasLiked);
    setLikes(targetLikes);
    localStorage.setItem(cacheKey, targetLikes.toString());
    setAnimating(true);
    setSubmitting(true);

    // Trigger pulse animation
    setTimeout(() => setAnimating(false), 300);

    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
         },
        body: JSON.stringify({ slug, action }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync like action");
      }

      const data = await response.json();
      if (typeof data.likes === "number") {
        setLikes(data.likes);
        localStorage.setItem(cacheKey, data.likes.toString());
      }

      // Commit liked status to localStorage
      if (action === "like") {
        localStorage.setItem(likedKey, "true");
      } else {
        localStorage.removeItem(likedKey);
      }
    } catch (error) {
      console.error("Failed to register like:", error);
      // Rollback optimistic updates on error
      setHasLiked(hasLiked);
      setLikes(likes);
      localStorage.setItem(cacheKey, likes.toString());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-4 py-6 my-8 border-y border-stone-gray font-mono">
      <div className="text-xs uppercase font-bold text-steel-gray tracking-tight">
        Was this chapter helpful?
      </div>
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 border transition-all duration-200 cursor-pointer ${
          hasLiked
            ? "border-flame-orange bg-flame-orange/5 text-flame-orange animate-pulse"
            : "border-stone-gray bg-white text-smoke-gray hover:border-midnight-graphite hover:text-midnight-graphite"
        } ${animating ? "scale-95" : "scale-100"} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label={hasLiked ? "Unlike this chapter" : "Like this chapter"}
      >
        {submitting ? (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={hasLiked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            className={`w-4 h-4 transition-transform duration-200 ${
              animating ? "scale-125" : "scale-100"
            }`}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        )}
        <span className="text-xs font-bold leading-none">
          {loading && likes === 0 ? "..." : likes} {likes === 1 ? "LIKE" : "LIKES"}
        </span>
      </button>
    </div>
  );
}

