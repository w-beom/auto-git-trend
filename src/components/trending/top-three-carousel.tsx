"use client";

import {
  useEffect,
  useLayoutEffect,
  startTransition,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  type CSSProperties,
  type UIEvent,
} from "react";

import type { SnapshotPageItem } from "@/lib/snapshots/queries";
import { RepositoryCard } from "@/components/trending/repository-card";

interface TopThreeCarouselProps {
  items: SnapshotPageItem[];
  onViewportHeightChange?: Dispatch<SetStateAction<number | null>> | ((height: number | null) => void);
}

function clampIndex(value: number, length: number) {
  if (length <= 0) {
    return 0;
  }

  return Math.min(Math.max(value, 0), length - 1);
}

export function TopThreeCarousel({
  items,
  onViewportHeightChange,
}: TopThreeCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const activeIndexRef = useRef(0);

  function updateViewportHeight(nextIndex: number) {
    const slide = slideRefs.current[nextIndex];

    if (!slide) {
      return;
    }

    const nextHeight = Math.ceil(slide.getBoundingClientRect().height);

    if (nextHeight > 0) {
      setViewportHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    }
  }

  function updateActiveIndex(nextIndex: number) {
    const clampedIndex = clampIndex(nextIndex, items.length);

    activeIndexRef.current = clampedIndex;
    updateViewportHeight(clampedIndex);
    startTransition(() => {
      setActiveIndex(clampedIndex);
    });
  }

  function syncActiveIndex(track: HTMLDivElement) {
    const nextIndex = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));

    if (nextIndex !== activeIndexRef.current) {
      updateActiveIndex(nextIndex);
    }
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    syncActiveIndex(event.currentTarget);
  }

  function scrollToIndex(index: number) {
    const clampedIndex = clampIndex(index, items.length);
    const track = trackRef.current;

    if (track instanceof HTMLElement) {
      track.scrollTo({
        behavior: "smooth",
        left: track.clientWidth * clampedIndex,
        top: 0,
      });
    } else {
      const slide = trackRef.current?.children.item(clampedIndex);

      if (slide instanceof HTMLElement) {
        slide.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start",
        });
      }
    }

    updateActiveIndex(clampedIndex);
  }

  function handlePagerClick(index: number) {
    scrollToIndex(index);
  }

  function handlePreviousClick() {
    scrollToIndex(activeIndexRef.current - 1);
  }

  function handleNextClick() {
    scrollToIndex(activeIndexRef.current + 1);
  }

  useLayoutEffect(() => {
    updateViewportHeight(activeIndexRef.current);
  }, [items.length]);

  useEffect(() => {
    function handleResize() {
      updateViewportHeight(activeIndexRef.current);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      updateViewportHeight(activeIndexRef.current);
    });

    slideRefs.current.forEach((slide) => {
      if (slide) {
        resizeObserver.observe(slide);
      }
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [items.length]);

  useEffect(() => {
    onViewportHeightChange?.(viewportHeight);
  }, [onViewportHeightChange, viewportHeight]);

  return (
    <div
      className="top-three-grid top-three-carousel"
      role="group"
      aria-label="오늘의 톱 3 카드 뷰어"
    >
      <div className="top-three-carousel__frame">
        <button
          type="button"
          className="top-three-carousel__nav top-three-carousel__nav--prev"
          aria-label="이전 톱3 카드"
          disabled={activeIndex === 0}
          onClick={handlePreviousClick}
        >
          <span aria-hidden="true">‹</span>
        </button>

        <div
          className="top-three-carousel__viewport"
          style={
            viewportHeight === null
              ? undefined
              : { "--top-three-carousel-height": `${viewportHeight}px` } as CSSProperties
          }
        >
          <div
            ref={trackRef}
            className="top-three-carousel__track"
            onScroll={handleScroll}
          >
            {items.map((item, index) => (
              <div
                key={`top-carousel-${item.fullName}`}
                className="top-three-carousel__slide"
                ref={(element) => {
                  slideRefs.current[index] = element;
                }}
              >
                <RepositoryCard item={item} variant="feature" />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="top-three-carousel__nav top-three-carousel__nav--next"
          aria-label="다음 톱3 카드"
          disabled={activeIndex === items.length - 1}
          onClick={handleNextClick}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div
        className="top-three-carousel__pager"
        role="group"
        aria-label="오늘의 톱 3 페이지 선택"
      >
        {items.map((item, index) => (
          <button
            key={`top-carousel-dot-${item.fullName}`}
            type="button"
            className="top-three-carousel__dot"
            aria-label={`TOP ${item.rank} 카드 보기`}
            aria-current={activeIndex === index ? "true" : undefined}
            onClick={() => handlePagerClick(index)}
          />
        ))}
      </div>
    </div>
  );
}
