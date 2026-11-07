import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fade-and-rise once when entering the viewport. Honors prefers-reduced-motion. */
export function RevealSection({
  children,
  className = "",
  as: Tag = "section",
  id,
  "aria-labelledby": ariaLabelledBy,
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
  id?: string;
  "aria-labelledby"?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }

    // Already on screen (or nearly) — show without waiting for a scroll tick.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
    );
    observer.observe(el);

    // Failsafe so content never stays hidden (print, odd viewports, automation).
    const failsafe = window.setTimeout(() => setVisible(true), 1200);
    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <Tag
      ref={(node) => {
        ref.current = node;
      }}
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`reveal-section ${visible ? "reveal-section--visible" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
