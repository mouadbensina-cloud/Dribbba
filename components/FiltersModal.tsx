"use client";

import { X } from "lucide-react";

interface FiltersModalProps {
  open: boolean;
  onClose: () => void;
}

export function FiltersModal({ open, onClose }: FiltersModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-[430px] rounded-t-3xl bg-surface p-6 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Filtres</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-surface-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="pb-8 text-sm text-muted-foreground">
          Les filtres (budget, ambiance, distance) arrivent bientôt. Pour l&apos;instant,
          explorez tous les quartiers sur la carte.
        </p>
      </div>
    </div>
  );
}
