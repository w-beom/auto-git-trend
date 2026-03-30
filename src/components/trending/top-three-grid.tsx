"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import type { SnapshotHighlight, SnapshotPageItem } from "@/lib/snapshots/queries";

import { TopThreeCarousel } from "@/components/trending/top-three-carousel";

interface TopThreeGridProps {
  highlights: SnapshotHighlight[];
  items: SnapshotPageItem[];
}

export function TopThreeGrid({
  highlights,
  items,
}: TopThreeGridProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [carouselViewportHeight, setCarouselViewportHeight] = useState<number | null>(null);
  const [sectionHeightOffset, setSectionHeightOffset] = useState<number | null>(null);
  const topItems = highlights
    .map((highlight) =>
      items.find((item) => item.fullName === highlight.fullName),
    )
    .filter((item): item is SnapshotPageItem => item !== undefined);
  const hasTopItems = topItems.length > 0;

  function measureSectionHeightOffset(nextViewportHeight = carouselViewportHeight) {
    const section = sectionRef.current;
    const content = contentRef.current;

    if (!section || !content || nextViewportHeight === null) {
      return;
    }

    const sectionStyles = window.getComputedStyle(section);
    const paddingTop = Number.parseFloat(sectionStyles.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(sectionStyles.paddingBottom) || 0;
    const nextHeight = Math.ceil(
      content.getBoundingClientRect().height + paddingTop + paddingBottom - nextViewportHeight,
    );

    if (nextHeight > 0) {
      setSectionHeightOffset((currentOffset) =>
        currentOffset === nextHeight ? currentOffset : nextHeight,
      );
    }
  }

  useLayoutEffect(() => {
    if (sectionHeightOffset === null) {
      measureSectionHeightOffset();
    }
  }, [carouselViewportHeight, sectionHeightOffset, topItems.length]);

  useEffect(() => {
    let frameId = 0;

    function handleResize() {
      frameId = window.requestAnimationFrame(() => {
        measureSectionHeightOffset();
      });
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [carouselViewportHeight]);

  if (!hasTopItems) {
    return null;
  }

  const sectionHeight =
    sectionHeightOffset === null || carouselViewportHeight === null
      ? null
      : sectionHeightOffset + carouselViewportHeight;

  return (
    <section
      ref={sectionRef}
      className="section-block section-block--top-three"
      aria-labelledby="top-three-heading"
      style={
        sectionHeight === null
          ? undefined
          : { "--top-three-section-height": `${sectionHeight}px` } as CSSProperties
      }
    >
      <div
        ref={contentRef}
        className="section-block__content section-block__content--top-three"
      >
        <div className="section-heading">
          <p className="section-kicker">EDITORS PICK</p>
          <h2 id="top-three-heading">오늘의 톱 3</h2>
        </div>
        <TopThreeCarousel
          items={topItems}
          onViewportHeightChange={setCarouselViewportHeight}
        />
      </div>
    </section>
  );
}
