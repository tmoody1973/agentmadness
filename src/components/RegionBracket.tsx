"use client";

import type { Game, Team } from "../lib/types";
import { MatchupCard } from "./MatchupCard";
import { ConnectorLines } from "./ConnectorLines";
import { cn } from "../lib/utils";

interface RegionBracketProps {
  games: Game[];
  teams: Team[];
  regionName: string;
  direction: "ltr" | "rtl";
  onSelectGame: (gameId: string) => void;
  onTeamClick?: (team: Team) => void;
  selectedGameId?: string;
}

export const REGION_COLORS: Record<string, string> = {
  East: "#3b82f6",
  South: "#22c55e",
  West: "#f97316",
  Midwest: "#a855f7",
  "Fort Worth 1": "#3b82f6",
  "Sacramento 4": "#22c55e",
  "Fort Worth 3": "#f97316",
  "Sacramento 2": "#a855f7",
};

// Layout constants
const ROW_HEIGHT = 56; // px per R64 game row
const CARD_WIDTH = 160; // px for each matchup card
const CONNECTOR_WIDTH = 28; // px for connector SVG columns

function getRegionGamesByRound(games: Game[], region: string, round: string): Game[] {
  return games
    .filter((g) => g.region === region && g.round === round)
    .sort((a, b) => a.gameOrder - b.gameOrder);
}

/**
 * Renders a column of matchup cards for a given round.
 * Cards are vertically positioned using CSS Grid row spans so each card
 * is naturally centered between its two feeder games.
 *
 * The grid has 8 rows (one per R64 slot).
 * R64: 1 row each (8 cards)
 * R32: 2 rows each (4 cards)
 * S16: 4 rows each (2 cards)
 * E8:  8 rows (1 card)
 */
function RoundCards({
  roundGames,
  teams,
  rowSpan,
  onSelectGame,
  onTeamClick,
  selectedGameId,
}: {
  roundGames: Game[];
  teams: Team[];
  rowSpan: number;
  onSelectGame: (gameId: string) => void;
  onTeamClick?: (team: Team) => void;
  selectedGameId?: string;
}) {
  return (
    <>
      {roundGames.map((game, idx) => (
        <div
          key={game._id}
          className="flex items-center justify-center"
          style={{
            gridRow: `${idx * rowSpan + 1} / span ${rowSpan}`,
            gridColumn: 1,
            height: rowSpan * ROW_HEIGHT,
          }}
        >
          <MatchupCard
            game={game}
            teams={teams}
            onSelect={onSelectGame}
            onTeamClick={onTeamClick}
            isSelected={selectedGameId === game._id}
          />
        </div>
      ))}
    </>
  );
}

export function RegionBracket({
  games,
  teams,
  regionName,
  direction,
  onSelectGame,
  onTeamClick,
  selectedGameId,
}: RegionBracketProps) {
  const accentColor = REGION_COLORS[regionName] ?? "#6b7280";

  const r64 = getRegionGamesByRound(games, regionName, "R64");
  const r32 = getRegionGamesByRound(games, regionName, "R32");
  const s16 = getRegionGamesByRound(games, regionName, "S16");
  const e8 = getRegionGamesByRound(games, regionName, "E8");

  const totalRows = 8;
  const totalHeight = totalRows * ROW_HEIGHT;

  // Build column order: for LTR = [R64, conn, R32/S16, conn, E8]
  // For RTL we reverse: [E8, conn, S16/R32, conn, R64]
  const ltrColumns = (
    <>
      {/* R64 column */}
      <div
        className="relative"
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${totalRows}, ${ROW_HEIGHT}px)`,
          width: CARD_WIDTH,
        }}
      >
        <RoundCards
          roundGames={r64}
          teams={teams}
          rowSpan={1}
          onSelectGame={onSelectGame}
          onTeamClick={onTeamClick}
          selectedGameId={selectedGameId}
        />
      </div>

      {/* Connector R64→R32 */}
      <ConnectorLines
        feederCount={8}
        rowHeightPx={ROW_HEIGHT}
        width={CONNECTOR_WIDTH}
        direction="ltr"
      />

      {/* R32 + S16 stacked column */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${totalRows}, ${ROW_HEIGHT}px)`,
          width: CARD_WIDTH,
        }}
      >
        <RoundCards
          roundGames={r32}
          teams={teams}
          rowSpan={2}
          onSelectGame={onSelectGame}
          onTeamClick={onTeamClick}
          selectedGameId={selectedGameId}
        />
      </div>

      {/* Connector R32→S16 */}
      <ConnectorLines
        feederCount={4}
        rowHeightPx={ROW_HEIGHT * 2}
        width={CONNECTOR_WIDTH}
        direction="ltr"
      />

      {/* S16 column */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${totalRows}, ${ROW_HEIGHT}px)`,
          width: CARD_WIDTH,
        }}
      >
        <RoundCards
          roundGames={s16}
          teams={teams}
          rowSpan={4}
          onSelectGame={onSelectGame}
          onTeamClick={onTeamClick}
          selectedGameId={selectedGameId}
        />
      </div>

      {/* Connector S16→E8 */}
      <ConnectorLines
        feederCount={2}
        rowHeightPx={ROW_HEIGHT * 4}
        width={CONNECTOR_WIDTH}
        direction="ltr"
      />

      {/* E8 column */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${totalRows}, ${ROW_HEIGHT}px)`,
          width: CARD_WIDTH,
        }}
      >
        <RoundCards
          roundGames={e8}
          teams={teams}
          rowSpan={8}
          onSelectGame={onSelectGame}
          onTeamClick={onTeamClick}
          selectedGameId={selectedGameId}
        />
      </div>
    </>
  );

  const rtlColumns = (
    <>
      {/* E8 column (leftmost in RTL) */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${totalRows}, ${ROW_HEIGHT}px)`,
          width: CARD_WIDTH,
        }}
      >
        <RoundCards
          roundGames={e8}
          teams={teams}
          rowSpan={8}
          onSelectGame={onSelectGame}
          onTeamClick={onTeamClick}
          selectedGameId={selectedGameId}
        />
      </div>

      {/* Connector E8←S16 */}
      <ConnectorLines
        feederCount={2}
        rowHeightPx={ROW_HEIGHT * 4}
        width={CONNECTOR_WIDTH}
        direction="rtl"
      />

      {/* S16 column */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${totalRows}, ${ROW_HEIGHT}px)`,
          width: CARD_WIDTH,
        }}
      >
        <RoundCards
          roundGames={s16}
          teams={teams}
          rowSpan={4}
          onSelectGame={onSelectGame}
          onTeamClick={onTeamClick}
          selectedGameId={selectedGameId}
        />
      </div>

      {/* Connector S16←R32 */}
      <ConnectorLines
        feederCount={4}
        rowHeightPx={ROW_HEIGHT * 2}
        width={CONNECTOR_WIDTH}
        direction="rtl"
      />

      {/* R32 column */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${totalRows}, ${ROW_HEIGHT}px)`,
          width: CARD_WIDTH,
        }}
      >
        <RoundCards
          roundGames={r32}
          teams={teams}
          rowSpan={2}
          onSelectGame={onSelectGame}
          onTeamClick={onTeamClick}
          selectedGameId={selectedGameId}
        />
      </div>

      {/* Connector R32←R64 */}
      <ConnectorLines
        feederCount={8}
        rowHeightPx={ROW_HEIGHT}
        width={CONNECTOR_WIDTH}
        direction="rtl"
      />

      {/* R64 column (rightmost in RTL) */}
      <div
        className="relative"
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${totalRows}, ${ROW_HEIGHT}px)`,
          width: CARD_WIDTH,
        }}
      >
        <RoundCards
          roundGames={r64}
          teams={teams}
          rowSpan={1}
          onSelectGame={onSelectGame}
          onTeamClick={onTeamClick}
          selectedGameId={selectedGameId}
        />
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Region header */}
      <div
        className={cn(
          "flex items-center gap-2 px-1",
          direction === "rtl" && "justify-end"
        )}
      >
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: accentColor }}
        />
        <span
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: accentColor }}
        >
          {regionName}
        </span>
      </div>

      {/* Bracket columns */}
      <div
        className="flex items-start"
        style={{ height: totalHeight }}
      >
        {direction === "ltr" ? ltrColumns : rtlColumns}
      </div>
    </div>
  );
}
