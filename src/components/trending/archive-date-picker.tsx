"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface ArchiveDatePickerProps {
  dates: string[];
  currentDate: string;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function logSnapshotDiagnostic(label: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info(`[snapshot-diag] ${label}`, details);
}

function buildMonthDays(visibleMonth: string) {
  const [year, month] = visibleMonth.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  const leadingBlanks = firstDay.getUTCDay();
  const days: Array<{ iso: string; day: string } | null> = [];

  for (let blank = 0; blank < leadingBlanks; blank += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getUTCDate(); day += 1) {
    days.push({
      iso: `${visibleMonth}-${String(day).padStart(2, "0")}`,
      day: String(day),
    });
  }

  return days;
}

export function ArchiveDatePicker({
  dates,
  currentDate,
}: ArchiveDatePickerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(currentDate.slice(0, 7));
  const availableMonths = useMemo(
    () => Array.from(new Set(dates.map((date) => date.slice(0, 7)))).sort(),
    [dates],
  );
  const storedDates = useMemo(() => new Set(dates), [dates]);
  const monthDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);

  if (dates.length < 2 || !dates.includes(currentDate)) {
    return null;
  }

  const latestDate = dates[0];
  const visibleMonthIndex = availableMonths.indexOf(visibleMonth);
  const canShowPreviousMonth = visibleMonthIndex > 0;
  const canShowNextMonth =
    visibleMonthIndex >= 0 && visibleMonthIndex < availableMonths.length - 1;

  useEffect(() => {
    setVisibleMonth(currentDate.slice(0, 7));
    setIsOpen(false);
  }, [currentDate]);

  function routeToDate(nextDate: string) {
    const targetRoute = nextDate === latestDate ? "/" : `/archive/${nextDate}`;

    setIsOpen(false);
    logSnapshotDiagnostic("navigation", {
      currentDate,
      nextDate,
      targetRoute,
    });
    router.push(targetRoute);
  }

  return (
    <div className="archive-date-picker">
      <button
        type="button"
        className="archive-date-picker__trigger"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`아카이브 날짜 ${currentDate}`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="archive-date-picker__trigger-copy">
          <span className="archive-date-picker__label">아카이브 날짜</span>
          <span className="archive-date-picker__value">{currentDate}</span>
        </span>
        <span className="archive-date-picker__trigger-icon" aria-hidden="true">
          달력
        </span>
      </button>

      {isOpen ? (
        <div
          className="archive-date-picker__popover"
          role="dialog"
          aria-label="아카이브 날짜 선택"
        >
          <div className="archive-date-picker__month-nav">
            <button
              type="button"
              className="archive-date-picker__month-button"
              aria-label="이전 달"
              disabled={!canShowPreviousMonth}
              onClick={() => {
                if (canShowPreviousMonth) {
                  setVisibleMonth(availableMonths[visibleMonthIndex - 1]);
                }
              }}
            >
              이전
            </button>
            <strong className="archive-date-picker__month-label">{visibleMonth}</strong>
            <button
              type="button"
              className="archive-date-picker__month-button"
              aria-label="다음 달"
              disabled={!canShowNextMonth}
              onClick={() => {
                if (canShowNextMonth) {
                  setVisibleMonth(availableMonths[visibleMonthIndex + 1]);
                }
              }}
            >
              다음
            </button>
          </div>

          <div className="archive-date-picker__weekdays" aria-hidden="true">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="archive-date-picker__weekday">
                {label}
              </span>
            ))}
          </div>

          <div className="archive-date-picker__calendar">
            {monthDays.map((entry, index) => {
              if (!entry) {
                return (
                  <span
                    key={`blank-${visibleMonth}-${index}`}
                    className="archive-date-picker__blank"
                    aria-hidden="true"
                  />
                );
              }

              const isStored = storedDates.has(entry.iso);
              const isCurrent = entry.iso === currentDate;

              return (
                <button
                  key={entry.iso}
                  type="button"
                  className="archive-date-picker__day"
                  aria-label={entry.iso}
                  aria-pressed={isCurrent ? "true" : undefined}
                  disabled={!isStored}
                  onClick={() => routeToDate(entry.iso)}
                >
                  {entry.day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
