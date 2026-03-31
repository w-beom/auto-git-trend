"use client";

import { useRouter } from "next/navigation";

interface ArchiveDatePickerProps {
  dates: string[];
  currentDate: string;
}

export function ArchiveDatePicker({
  dates,
  currentDate,
}: ArchiveDatePickerProps) {
  const router = useRouter();

  if (dates.length < 2 || !dates.includes(currentDate)) {
    return null;
  }

  const latestDate = dates[0];

  return (
    <label className="archive-date-picker" htmlFor="archive-date-picker">
      <span className="archive-date-picker__label">아카이브 날짜</span>
      <select
        id="archive-date-picker"
        className="archive-date-picker__control"
        value={currentDate}
        onChange={(event) => {
          const nextDate = event.target.value;
          router.push(nextDate === latestDate ? "/" : `/archive/${nextDate}`);
        }}
      >
        {dates.map((date) => (
          <option key={date} value={date}>
            {date}
          </option>
        ))}
      </select>
    </label>
  );
}
