"use client";

import { motion, useDragControls, type PanInfo } from "framer-motion";
import { useEffect, useState } from "react";

export type SheetState = "resting" | "preview" | "expanded";

const FRACTIONS: Record<SheetState, number> = {
  resting: 0.15,
  preview: 0.45,
  expanded: 0.85,
};

const STATES: SheetState[] = ["resting", "preview", "expanded"];

interface BottomSheetProps {
  state: SheetState;
  onStateChange: (state: SheetState) => void;
  children: React.ReactNode;
}

export function BottomSheet({ state, onStateChange, children }: BottomSheetProps) {
  const dragControls = useDragControls();
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    function update() {
      setViewportHeight(window.innerHeight);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const yFor = (s: SheetState) => viewportHeight * (1 - FRACTIONS[s]);

  function handleDragEnd(_event: unknown, info: PanInfo) {
    const draggedY = yFor(state) + info.offset.y;
    const projectedY = draggedY + info.velocity.y * 0.12;

    let nearest: SheetState = "resting";
    let minDist = Infinity;
    for (const candidate of STATES) {
      const dist = Math.abs(yFor(candidate) - projectedY);
      if (dist < minDist) {
        minDist = dist;
        nearest = candidate;
      }
    }
    onStateChange(nearest);
  }

  if (viewportHeight === 0) return null;

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-30 mx-auto flex max-w-[430px] flex-col rounded-t-3xl bg-surface shadow-[0_-4px_28px_rgba(28,25,23,0.14)]"
      style={{ height: "100dvh" }}
      initial={{ y: yFor(state) }}
      animate={{ y: yFor(state) }}
      transition={{ type: "spring", duration: 0.25, bounce: 0.18 }}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: yFor("expanded"), bottom: yFor("resting") }}
      dragElastic={0.06}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex shrink-0 touch-none flex-col items-center pt-2.5 pb-1.5"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <span className="h-1.5 w-10 rounded-full bg-border" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </motion.div>
  );
}
