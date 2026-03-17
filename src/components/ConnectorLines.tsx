"use client";

/**
 * SVG connector lines between bracket rounds.
 * Renders vertical merge lines + horizontal connection lines for a bracket column.
 *
 * For each pair of feeder games connecting to a parent game:
 *   - Horizontal line from feeder A midpoint to connector midpoint
 *   - Horizontal line from feeder B midpoint to connector midpoint
 *   - Vertical line connecting the two horizontals
 *   - Horizontal line from midpoint to parent game
 */

interface ConnectorLinesProps {
  /** Number of games in the feeder round (e.g., 8 for R64→R32) */
  feederCount: number;
  /** Height of each card row in px */
  rowHeightPx: number;
  /** Width of the connector column in px */
  width: number;
  /** Which direction: ltr = lines flow right, rtl = lines flow left */
  direction: "ltr" | "rtl";
}

const STROKE = "rgba(255,255,255,0.12)";
const STROKE_WIDTH = 1.5;

export function ConnectorLines({
  feederCount,
  rowHeightPx,
  width,
  direction,
}: ConnectorLinesProps) {
  const parentCount = feederCount / 2;
  const totalHeight = feederCount * rowHeightPx;

  const lines: React.ReactNode[] = [];

  for (let i = 0; i < parentCount; i++) {
    // The two feeder game indices
    const feederA = i * 2;
    const feederB = i * 2 + 1;

    // Y midpoints for each feeder card center
    const yA = feederA * rowHeightPx + rowHeightPx / 2;
    const yB = feederB * rowHeightPx + rowHeightPx / 2;
    const yMid = (yA + yB) / 2;

    // X coordinates depending on direction
    const xStart = direction === "ltr" ? 0 : width;
    const xEnd = direction === "ltr" ? width : 0;
    const xMid = width / 2;

    lines.push(
      <g key={i}>
        {/* Horizontal from feeder A */}
        <line
          x1={xStart}
          y1={yA}
          x2={xMid}
          y2={yA}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
        {/* Horizontal from feeder B */}
        <line
          x1={xStart}
          y1={yB}
          x2={xMid}
          y2={yB}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
        {/* Vertical merge line */}
        <line
          x1={xMid}
          y1={yA}
          x2={xMid}
          y2={yB}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
        {/* Horizontal to parent */}
        <line
          x1={xMid}
          y1={yMid}
          x2={xEnd}
          y2={yMid}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
        />
      </g>
    );
  }

  return (
    <svg
      width={width}
      height={totalHeight}
      viewBox={`0 0 ${width} ${totalHeight}`}
      preserveAspectRatio="none"
      className="shrink-0"
      aria-hidden="true"
    >
      {lines}
    </svg>
  );
}
