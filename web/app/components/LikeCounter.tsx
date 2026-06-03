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
    // 1. Check local storage
    const storageKey = `liked_${slug}`;
    const localLiked = localStorage.getItem(storageKey) === "true";
    setHasLiked(localLiked);

    // 2. Fetch total likes from API
    fetch(`/api/likes?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.likes === "number") {
          setLikes(data.likes);
        }
      })
      .catch((err) => console.error("Error fetching likes:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLike = async () => {
    if (submitting) return;

    const action = hasLiked ? "unlike" : "like";
    const storageKey = `liked_${slug}`;

    // Optimistic UI updates
    setHasLiked(!hasLiked);
    setLikes((prev) => (action === "like" ? prev + 1 : Math.max(0, prev - 1)));
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
      }

      // Commit to localStorage
      if (action === "like") {
        localStorage.setItem(storageKey, "true");
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error("Failed to register like:", error);
      // Rollback optimistic updates on error
      setHasLiked(hasLiked);
      setLikes((prev) => (action === "like" ? Math.max(0, prev - 1) : prev + 1));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-stone-gray bg-cloud-white p-6 sm:p-8 my-8 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
      <div className="flex flex-col gap-1 text-center sm:text-left">
        <h4 className="font-sans font-bold text-xs sm:text-sm text-ash-black uppercase tracking-wider">
          Enjoyed this architecture write-up?
        </h4>
        <p className="font-mono text-[10px] sm:text-xs text-smoke-gray leading-normal">
          Show your support or toggle your bookmark by liking this post.
        </p>
      </div>

      <button
        onClick={handleLike}
        disabled={loading}
        className={`group flex items-center justify-center gap-3 border px-5 py-3 transition-all duration-300 cursor-pointer ${
          hasLiked
            ? "border-flame-orange bg-flame-orange text-cloud-white"
            : "border-stone-gray bg-white text-steel-gray hover:border-flame-orange hover:text-flame-orange"
        } ${animating ? "scale-105" : ""} active:scale-95`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={hasLiked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2.5"
          className={`w-4 h-4 transition-transform duration-300 ${
            animating ? "scale-125" : "group-hover:scale-115"
          }`}
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="font-sans font-bold text-xs tracking-tight uppercase">
          {hasLiked ? "Liked" : "Like"}
        </span>
        <span className="h-3.5 w-px bg-current opacity-30"></span>
        <span className="font-mono font-bold text-xs">
          {loading ? "..." : likes}
        </span>
      </button>
    </div>
  );
}
