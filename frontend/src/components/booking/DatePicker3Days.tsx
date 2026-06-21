import DatePicker from "react-datepicker";
import { ru } from "date-fns/locale";
import {
  DEFAULT_WORK_DAY_END_MINUTES,
  DEFAULT_WORK_DAY_START_MINUTES,
  formatDateLabel,
  formatWeekday,
  getNextBookableDate,
  isDateUnavailableForBooking,
  toDateOnlyString,
} from "../../utils/time";

interface Props {
  startDate: Date;
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onCalendarChange: (date: Date) => void;
  workDayStartMinutes?: number;
  workDayEndMinutes?: number;
  dayCount?: number;
}

export function DatePicker3Days({
  startDate,
  selectedDate,
  onSelect,
  onCalendarChange,
  workDayStartMinutes = DEFAULT_WORK_DAY_START_MINUTES,
  workDayEndMinutes = DEFAULT_WORK_DAY_END_MINUTES,
  dayCount = 3,
}: Props) {
  const minBookableDate = getNextBookableDate(
    workDayStartMinutes,
    workDayEndMinutes
  );
  const days = Array.from({ length: dayCount }, (_, offset) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + offset);
    return d;
  });

  const isDisabled = (day: Date) =>
    isDateUnavailableForBooking(day, workDayStartMinutes, workDayEndMinutes);

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap justify-content-between date-picker-row">
      <div className="d-flex gap-2 date-picker-days">
        {days.map((day) => {
          const active =
            toDateOnlyString(day) === toDateOnlyString(selectedDate);
          const disabled = isDisabled(day);
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={
                active ? "btn-date-picker-active h2" : "btn-date-picker h2"
              }
              style={{ height: 40, padding: "0 20px" }}
              disabled={disabled}
              onClick={() => onSelect(day)}
            >
              {formatWeekday(day)}{" "}
              <span className="b2">{formatDateLabel(day)}</span>
            </button>
          );
        })}
      </div>

      <DatePicker
        selected={startDate}
        minDate={minBookableDate}
        onChange={(date: Date | null) => date && onCalendarChange(date)}
        locale={ru}
        customInput={
          <button
            type="button"
            className="btn-date-picker"
            style={{ width: 40, height: 40, padding: 0 }}
          >
            <img src="/assets/icons/icon-calendar.svg" />
          </button>
        }
      />
    </div>
  );
}
