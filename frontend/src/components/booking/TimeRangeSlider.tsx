import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { BookingSlot } from '../../api/types';
import { hasBookingConflict } from '../../utils/availability';
import { formatMinutes } from '../../utils/time';

interface Props {
  workStart: number;
  workEnd: number;
  minStart?: number;
  start: number;
  end: number;
  slots: BookingSlot[];
  onChange: (start: number, end: number) => void;
  step?: number;
}

const THUMB = 18;

export function TimeRangeSlider({
  workStart,
  workEnd,
  minStart,
  start,
  end,
  slots,
  onChange,
  step = 30,
}: Props) {
  const effectiveMinStart = minStart ?? workStart;
  const total = workEnd - workStart;
  const occupied = slots.filter((s) => !s.isOwn);
  const ownSlots = slots.filter((s) => s.isOwn);

  const conflict = useMemo(
    () => hasBookingConflict(start, end, slots),
    [slots, start, end],
  );

  const startSlot = occupied.find((s) => start >= s.startMinutes && start < s.endMinutes);
  const endSlot = occupied.find((s) => end > s.startMinutes && end <= s.endMinutes);

  const frac = (v: number) => (v - workStart) / total;
  const posLeft = (v: number) => `calc(${frac(v)} * (100% - ${THUMB}px) + ${THUMB / 2}px)`;
  const spanWidth = (a: number, b: number) => `calc(${frac(b) - frac(a)} * (100% - ${THUMB}px))`;

  const wrapRef = useRef<HTMLDivElement>(null);
  const startCalloutRef = useRef<HTMLDivElement>(null);
  const endCalloutRef = useRef<HTMLDivElement>(null);
  const [startLeft, setStartLeft] = useState(0);
  const [endLeft, setEndLeft] = useState(0);

  const startBusyKey = startSlot?.id ?? null;
  const endBusyKey = endSlot?.id ?? null;

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const place = (value: number, callout: HTMLDivElement | null): number => {
      if (!callout) return 0;
      const wrapW = wrap.offsetWidth;
      const calloutW = callout.offsetWidth;
      const center = THUMB / 2 + frac(value) * (wrapW - THUMB);
      const left = center - calloutW / 2;
      return Math.max(0, Math.min(left, wrapW - calloutW));
    };

    const recalc = () => {
      setStartLeft(place(start, startCalloutRef.current));
      setEndLeft(place(end, endCalloutRef.current));
    };

    recalc();

    const observer = new ResizeObserver(recalc);
    observer.observe(wrap);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, workStart, total, startBusyKey, endBusyKey]);

  return (
    <div className="time-range-slider">
      <div className={`time-range-track-wrap${conflict ? ' is-conflict' : ''}`} ref={wrapRef}>
        <div
          ref={startCalloutRef}
          className={`time-range-callout ${startSlot ? 'is-busy' : 'is-free'}`}
          style={{ left: startLeft }}
        >
          <span className="time-range-callout-time h2">{formatMinutes(start)}</span>
          {startSlot && (
            <>
              <span className="t1">{startSlot.userDisplayName}</span>
              <span className="t1">{startSlot.userEmail}</span>
            </>
          )}
        </div>

        <div
          ref={endCalloutRef}
          className={`time-range-callout ${endSlot ? 'is-busy' : 'is-free'}`}
          style={{ left: endLeft }}
        >
          <span className="time-range-callout-time h2">{formatMinutes(end)}</span>
          {endSlot && (
            <>
              <span className="t1">{endSlot.userDisplayName}</span>
              <span className="t1">{endSlot.userEmail}</span>
            </>
          )}
        </div>

        {ownSlots.map((slot) => (
          <div
            key={slot.id}
            className="time-range-own"
            title="Ваше бронирование"
            style={{ left: posLeft(slot.startMinutes), width: spanWidth(slot.startMinutes, slot.endMinutes) }}
          />
        ))}

        <div className="time-range-track" />

        {occupied.map((slot) => (
          <div
            key={slot.id}
            className="time-range-busy"
            title={`${slot.userDisplayName} (${slot.userEmail})`}
            style={{ left: posLeft(slot.startMinutes), width: spanWidth(slot.startMinutes, slot.endMinutes) }}
          />
        ))}

        <div
          className={`time-range-selection ${conflict ? 'is-conflict' : ''}`}
          style={{ left: posLeft(start), width: spanWidth(start, end) }}
        />

        <input
          type="range"
          className="time-range-input time-range-input--start"
          min={workStart}
          max={workEnd}
          step={step}
          value={Math.min(Math.max(start, effectiveMinStart), workEnd - step)}
          onChange={(e) => {
            const val = Math.min(Math.max(Number(e.target.value), effectiveMinStart), workEnd - step);
            onChange(val, Math.max(end, val + step));
          }}
        />
        <input
          type="range"
          className="time-range-input time-range-input--end"
          min={workStart}
          max={workEnd}
          step={step}
          value={end}
          onChange={(e) => {
            const val = Math.min(Math.max(Number(e.target.value), effectiveMinStart + step), workEnd);
            onChange(Math.min(start, val - step), val);
          }}
        />
      </div>
    </div>
  );
}
