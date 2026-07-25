import { useState } from "react";
import type { ViewKind, WawNode } from "../types";
import { CRAYON } from "../lib/theme";

interface Props {
  title: string;
  view: ViewKind;
  onView: (v: ViewKind) => void;
  day: string;
  availableDays: string[];
  onDay: (d: string) => void;
  isToday: boolean;
  /** Counts for the day being shown, so "what did I finish?" is answerable at a glance. */
  dayDone: number;
  dayDoing: number;
  connected: boolean;
  donePct: number;
  nextNode: WawNode | null;
  hiddenNodes: WawNode[];
  theme: "dark" | "light";
  onToggleTheme: () => void;
  cardScale: number;
  onCardScale: (delta: number) => void;
  snap: boolean;
  onToggleSnap: () => void;
  linearFlow: boolean;
  onToggleFlow: () => void;
  presetSlots: string[];
  filledSlots: string[];
  armSlot: boolean;
  onArmSlot: (v: boolean) => void;
  onSavePreset: (slot: string) => void;
  onRecallPreset: (slot: string) => void;
  onFit: () => void;
  onLatest: () => void;
  onAutoArrange: () => void;
  onJumpToNext: () => void;
  onUnhide: (id: string) => void;
}

export function TopBar({
  title,
  view,
  onView,
  day,
  availableDays,
  onDay,
  isToday,
  dayDone,
  dayDoing,
  connected,
  donePct,
  nextNode,
  hiddenNodes,
  theme,
  onToggleTheme,
  cardScale,
  onCardScale,
  snap,
  onToggleSnap,
  linearFlow,
  onToggleFlow,
  presetSlots,
  filledSlots,
  armSlot,
  onArmSlot,
  onSavePreset,
  onRecallPreset,
  onFit,
  onLatest,
  onAutoArrange,
  onJumpToNext,
  onUnhide,
}: Props) {
  const [showHidden, setShowHidden] = useState(false);
  const idx = availableDays.indexOf(day);
  const prevDay = idx > 0 ? availableDays[idx - 1] : null;
  const nextDay = idx >= 0 && idx < availableDays.length - 1 ? availableDays[idx + 1] : null;

  const ringR = 10;
  const ringC = 2 * Math.PI * ringR;

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">✳</span>
          <span className="brand-name">{title}</span>
          <span
            className={`live-dot ${connected ? "on" : "off"}`}
            title={connected ? "Live — watching for AI edits" : "Reconnecting…"}
          />
        </div>

        <div className="progress-wrap" title={`${donePct}% done`}>
          <svg width="26" height="26" viewBox="0 0 26 26">
            <circle cx="13" cy="13" r={ringR} fill="none" strokeWidth="2.5" opacity="0.15" style={{ stroke: CRAYON.chalkWhite }} />
            <circle
              cx="13"
              cy="13"
              r={ringR}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(ringC * donePct) / 100} ${ringC}`}
              transform="rotate(-90 13 13)"
              style={{ stroke: donePct === 100 ? CRAYON.green : CRAYON.gold }}
            />
          </svg>
          <span className="progress-num">{donePct}%</span>
        </div>

        <div className="view-toggle">
          <button className={view === "project" ? "active" : ""} onClick={() => onView("project")}>
            Project
          </button>
          <button className={view === "daily" ? "active" : ""} onClick={() => onView("daily")}>
            Daily
          </button>
        </div>

        {view === "daily" && (
          <div className="day-nav">
            <button disabled={!prevDay} onClick={() => prevDay && onDay(prevDay)} title="Previous day">
              ‹
            </button>
            <span className="day-label">
              {day || "—"}
              {!isToday && day ? " (past day)" : isToday ? " (today)" : ""}
            </span>
            <button disabled={!nextDay} onClick={() => nextDay && onDay(nextDay)} title="Next day">
              ›
            </button>
            <span className="day-digest">
              {dayDone === 0 && dayDoing === 0 ? (
                "nothing logged"
              ) : (
                <>
                  <b>{dayDone}</b> done
                  {dayDoing > 0 && <> · {dayDoing} in progress</>}
                </>
              )}
            </span>
          </div>
        )}

        <div className="cam-tools">
          <button onClick={onFit} title="Zoom out until the whole board fits on screen">
            Fit
          </button>
          <button onClick={onLatest} title="Jump to the card that changed most recently">
            Latest
          </button>
          {view === "project" && (
            <button
              className={linearFlow ? "active" : ""}
              onClick={onToggleFlow}
              title={
                linearFlow
                  ? "Showing one step after another. Click to see everything each card unlocks."
                  : "Showing everything each card unlocks. Click for a simple step-by-step order."
              }
            >
              Flow
            </button>
          )}
          <button
            className={snap ? "active" : ""}
            onClick={onToggleSnap}
            title={snap
                ? "Cards line up with each other as you drag them. Click to turn off."
                : "Cards move wherever you drop them. Click to make them line up."}
          >
            Align
          </button>
          <span className="presets">
            <button
              className={armSlot ? "active" : ""}
              onClick={() => onArmSlot(!armSlot)}
              title={
                armSlot
                  ? "Now pick a number to save this arrangement into it."
                  : "Save this arrangement: click Set, then a number."
              }
            >
              Set
            </button>
            {presetSlots.map((slot) => {
              const filled = filledSlots.includes(slot);
              return (
                <button
                  key={slot}
                  className={`preset-slot${filled ? " filled" : ""}`}
                  disabled={!armSlot && !filled}
                  onClick={() => (armSlot ? onSavePreset(slot) : onRecallPreset(slot))}
                  title={
                    armSlot
                      ? `Save this arrangement to slot ${slot}`
                      : filled
                        ? `Go back to the arrangement saved in slot ${slot}`
                        : `Slot ${slot} is empty. Click Set, then ${slot}, to save one.`
                  }
                >
                  {slot}
                </button>
              );
            })}
          </span>
          <span className="card-scale" title={`Card size ${Math.round(cardScale * 100)}%`}>
            <button disabled={cardScale <= 0.8} onClick={() => onCardScale(-0.1)} aria-label="Smaller cards">
              A－
            </button>
            <button disabled={cardScale >= 1.6} onClick={() => onCardScale(0.1)} aria-label="Bigger cards">
              A＋
            </button>
          </span>
          {view === "project" && (
            <button onClick={onAutoArrange} title="Tidy the board back to its automatic layout. Anything you moved by hand goes back.">
              Auto-arrange
            </button>
          )}
          {hiddenNodes.length > 0 && (
            <button
              className={showHidden ? "active" : ""}
              onClick={() => setShowHidden((v) => !v)}
              title="Cards you erased. They are hidden, not deleted."
            >
              Hidden ({hiddenNodes.length})
            </button>
          )}
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </div>

      {nextNode && (
        <button className="next-banner" onClick={onJumpToNext} title="Jump to this card">
          <span className="next-banner-label">Do this next</span>
          <span className="next-banner-title">{nextNode.title}</span>
          <span className="next-banner-arrow">→</span>
        </button>
      )}

      {showHidden && hiddenNodes.length > 0 && (
        <div className="hidden-flyout">
          <div className="hidden-flyout-title">Hidden cards</div>
          {hiddenNodes.map((n) => (
            <div key={n.id} className="hidden-row">
              <span className="hidden-name">{n.title}</span>
              <button onClick={() => onUnhide(n.id)}>Unhide</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
