export interface ProgressBarOptions {
  type: 'full' | 'compact';
  line?: string;
  indicator?: string;
  length?: number;
}

export function timeConverter(seconds: number): string {
  if (seconds < 60) return seconds.toString();

  const minutes = Math.floor(seconds / 60);

  const sec = seconds - minutes * 60;

  return `${minutes}:${sec}`;
}

// Full credit to: https://github.com/BonoJansen/Dismusic-Test-Bot/blob/Test-Bot/src/functions/createProgressBar.js
export function createProgressBar(current: string, duration: string, options: ProgressBarOptions) {
  const [currentMinute, currentSeconds] = current.split(':').map((v) => parseInt(v, 10));
  const [fullMinute, fullSeconds] = duration.split(':').map((v) => parseInt(v, 10));

  const soFarSeconds = currentMinute * 60 + currentSeconds;
  const durationSeconds = fullMinute * 60 + fullSeconds;

  const indicator = options.indicator || '🔘';
  const line = options.line || '▬';
  const length = options.length || 15;
  const index = Math.floor((soFarSeconds / durationSeconds) * length);

  if (index >= 1 && index <= length) {
    const bar = line.repeat(length - 1).split('');
    bar.splice(index, 0, indicator);

    return options.type === 'full' ? `${current} ┃ ${bar.join('')} ┃ ${duration}` : bar.join('');
  }

  return options.type === 'full'
    ? `${current} ┃ ${indicator}${line.repeat(length - 1)} ┃ ${duration}`
    : `${indicator}${line.repeat(length - 1)}`;
}
