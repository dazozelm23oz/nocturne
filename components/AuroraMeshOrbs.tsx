import React from "react";
import FluidAuroraMesh from "@/components/FluidAuroraMesh";
import { PaletteColors } from "@/lib/paletteExtractor";

interface AuroraMeshOrbsProps {
  palette?: PaletteColors | null;
  isPlaying: boolean;
  isLightMode?: boolean;
}

/**
 * AuroraMeshOrbs - High-Performance 3D Fluid Canvas Wave behind lyrics
 * Replaces old heavy CSS blur-90px divs with silky 60fps canvas wave harmonics.
 */
export default function AuroraMeshOrbs({
  palette,
  isPlaying,
  isLightMode = false,
}: AuroraMeshOrbsProps) {
  return (
    <FluidAuroraMesh
      palette={palette}
      isPlaying={isPlaying}
      isLightMode={isLightMode}
    />
  );
}
