const clockFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function formatClock(date: Date) {
  return clockFormatter.format(date);
}

export function formatDateTime(date: Date) {
  return dateTimeFormatter.format(date);
}

export function getLocalTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
