export function timeConverter(seconds: number): string {
  if (seconds < 60) return seconds.toString();

  const minutes = Math.floor(seconds / 60);

  const sec = seconds - minutes * 60;

  return `${minutes}:${sec}`;
}
