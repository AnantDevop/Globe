"use client";

import { useCallback, useMemo, useState } from "react";

export interface GlobeInteractionState {
  hoveredMarketId: string | null;
  selectedMarketId: string | null;
  /** The market whose tooltip/panel should currently be visible. */
  activeMarketId: string | null;
  isLocked: boolean;
  onHover: (marketId: string | null) => void;
  onSelect: (marketId: string) => void;
  onClose: () => void;
}

/**
 * Centralizes hover/click-to-lock state shared between the globe (3D
 * markers) and the tooltip/detail-panel UI, so both can be driven from a
 * keyboard-accessible marker list too, not only pointer events on the canvas.
 */
export function useGlobeInteraction(): GlobeInteractionState {
  const [hoveredMarketId, setHoveredMarketId] = useState<string | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

  const onHover = useCallback((marketId: string | null) => {
    setHoveredMarketId(marketId);
  }, []);

  const onSelect = useCallback((marketId: string) => {
    setSelectedMarketId(marketId);
  }, []);

  const onClose = useCallback(() => {
    setSelectedMarketId(null);
  }, []);

  const activeMarketId = selectedMarketId ?? hoveredMarketId;

  return useMemo(
    () => ({
      hoveredMarketId,
      selectedMarketId,
      activeMarketId,
      isLocked: selectedMarketId !== null,
      onHover,
      onSelect,
      onClose,
    }),
    [hoveredMarketId, selectedMarketId, activeMarketId, onHover, onSelect, onClose],
  );
}
