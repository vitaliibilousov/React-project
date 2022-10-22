import { createRoot } from "react-dom/client";
import type { FC, ReactNode } from "react";
import { useContext, useEffect } from "react";
import { useStore } from "zustand";
import { isNone } from "../utils";
import { scrollContext } from "./context";
import { applyStyle } from "./styles";

// the main logic of calculating the container sizes for the snap points
// points are expected to be sorted
const points2range = (points: number[], align: SnapsProps["align"]) =>
  points.map((p, i) => {
    let start = 0;
    if (i > 0) {
      // we have a points before
      if (align === "start") start = p;
      else if (align === "end") start = points[i - 1];
      // for center we find the midway point between the last and current point
      else start = (p + points[i - 1]) / 2;
    }

    let end = 1;
    if (i < points.length - 1) {
      // we have points after the current
      if (align === "start") end = points[i + 1];
      else if (align === "end") end = p;
      // for center we find the midway point between the next and current point
      else end = (p + points[i + 1]) / 2;
    }
    const height = end - start;
    return { start, height };
  });

export type SnapsProps = {
  /**
   * The points at which the snaps points should occur,
   * the viewport space between the points is linearly filled depending on the `align` property
   * If 'center', the container begins and ends halway between the points
   * If 'start', the empty space is filled from the point until the next point, for 'end' its a backward fill
   */
  points: number[];
  /**
   * Maps to https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-align
   * Also controls how the space between the points is shared
   *
   * Defaults to 'center'
   */
  align?: "center" | "start" | "end";
  /**
   * Controls snap type https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type
   *
   * Defaults to 'mandatory'
   */
  snapType?: "mandatory" | "proximity";
  /**
   * An optional marker, that gets positioned to indicate the scroll snap to the user
   * position is dependent on the `align` property
   */
  marker?: ReactNode;
};

/**
 * Scroll.Snaps enables to define snap points on a scroll pane (via the scroll controler)
 *
 * ScrollSnaps are implemented via the css scrollSnap API https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scroll_Snap
 */
export const Snaps: FC<SnapsProps> = ({ points, snapType = "mandatory", align = "center", marker }) => {
  const store = useContext(scrollContext);
  const layout = useStore(store, s => s.layout);
  // NOTE: for the subscribe feature of `useSyncExternalStore` hook to work, we need to get the state object in itself first
  const clips = useStore(store, s => s.orchestrate);
  const length = useStore(clips, s => s.length);
  useEffect(() => {
    // and mount children to the filled attribute
    if (isNone(layout)) return;

    const { container, scrollPane } = layout;
    // enable scrollSnap on main container
    container.style.scrollSnapType = `y ${snapType}`;

    // normalize the points before applying layout algorithm
    const elements = points2range(points.map(p => p / (length + 1)).sort(), align).map(({ start, height }) => {
      const el = document.createElement("div");

      applyStyle(
        {
          position: "absolute",
          width: "100%",
          top: `${100 * start}%`,
          height: `${100 * height}%`,
          scrollSnapAlign: align,
          display: "flex",
          alignItems: "center"
        },
        el
      );

      scrollPane.appendChild(el);

      if (marker) {
        const root = createRoot(el);
        root.render(marker);
      }

      return el;
    });
    return () => {
      elements.forEach(el => el.remove());
      // also reset container configuration
      container.style.scrollSnapType = "none";
    };
  }, [align, points, length, layout, store, snapType, marker]);

  return null;
};