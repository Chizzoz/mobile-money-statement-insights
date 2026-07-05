"use client";

import type { HeatmapPoint } from "@/lib/types/transaction";
import { DAY_LABELS } from "@/utils/formatters";

interface TransactionHeatmapProps {
  data: HeatmapPoint[];
}

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}

function heatmapColor(intensity: number): string {
  const alpha = 0.15 + intensity * 0.85;
  return `rgba(var(--heatmap-fill), ${alpha})`;
}

export function TransactionHeatmap({ data }: TransactionHeatmapProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getCount = (day: number, hour: number) =>
    data.find((d) => d.day === day && d.hour === hour)?.count ?? 0;

  const activeHours = [...new Set(data.map((d) => d.hour))].sort((a, b) => a - b);
  const displayHours =
    activeHours.length > 0
      ? activeHours
      : Array.from({ length: 24 }, (_, i) => i).filter((h) => h >= 6 && h <= 22);

  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No activity data available
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        <div className="mb-2 grid grid-cols-[40px_repeat(7,1fr)] gap-1 text-center text-xs text-muted-foreground">
          <div />
          {DAY_LABELS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        {displayHours.map((hour) => (
          <div
            key={hour}
            className="mb-1 grid grid-cols-[40px_repeat(7,1fr)] gap-1"
          >
            <div className="flex items-center justify-end pr-2 text-xs text-muted-foreground">
              {formatHour(hour)}
            </div>
            {DAY_LABELS.map((_, dayIndex) => {
              const count = getCount(dayIndex, hour);
              const intensity = count / maxCount;
              return (
                <div
                  key={`${dayIndex}-${hour}`}
                  title={`${DAY_LABELS[dayIndex]} ${formatHour(hour)}: ${count} transaction${count !== 1 ? "s" : ""}`}
                  className="aspect-square rounded-sm transition-transform hover:scale-110"
                  style={{
                    background:
                      count === 0
                        ? "var(--heatmap-empty)"
                        : heatmapColor(intensity),
                  }}
                />
              );
            })}
          </div>
        ))}
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          {[0.1, 0.3, 0.5, 0.7, 1].map((v) => (
            <div
              key={v}
              className="h-3 w-3 rounded-sm"
              style={{ background: heatmapColor(v) }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
