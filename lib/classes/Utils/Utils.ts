export interface ProgressBarOptions {
  type: 'full' | 'compact';
  line?: string;
  indicator?: string;
  length?: number;
}

export const REGEX = {
  soundCloud: /(^(https:)\/\/(soundcloud.com)\/)/,
  spotify: /(^(https:)\/\/(open.spotify.com)\/(track)\/)/,
  youtube:
    /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/,
  spotifyPlaylist: /(^(https:)\/\/(open.spotify.com)\/(playlist)\/)/,
};

export function timeConverter(seconds: number): string {
  if (seconds < 60) return `0:${String(seconds).length === 2 ? `${seconds}` : `0${seconds}`}`;

  const minute: number | string = Math.floor(seconds / 60);

  const newSecond = seconds - minute * 60;

  if (String(newSecond).length === 1 && String(newSecond).endsWith('0')) return `${minute}:${newSecond}0`;
  if (String(newSecond).length === 2) return `${minute}:${newSecond}`;
  return `${minute}:0${newSecond}`;
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

export function sourceResolver(query: string): 'Youtube' | 'Spotify' | 'Soundcloud' | 'Search' | 'SpotifyPlaylist' {
  if (REGEX.youtube.test(query)) return 'Youtube';
  if (REGEX.spotify.test(query)) return 'Spotify';
  if (REGEX.spotifyPlaylist.test(query)) return 'SpotifyPlaylist';
  if (REGEX.soundCloud.test(query)) return 'Soundcloud';
  return 'Search';
}
