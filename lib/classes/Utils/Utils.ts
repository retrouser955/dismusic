import * as prism from "prism-media";
import * as play from "play-dl"
import Track from "../Structures/Track";
import ytdl = require("ytdl-core");

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
  deezer: /(^https:)\/\/(www\.)?deezer.com\/([a-zA-Z]+\/)?track\/[0-9]+/,
  deezerPlaylist: /(^https:)\/\/(www\.)?deezer.com\/[a-zA-Z]+\/(playlist|album)\/[0-9]+(\?)?(.*)/,
  deezerShare: /(^https:)\/\/deezer\.page\.link\/[A-Za-z0-9]+/,
};

export async function createFFmpegTranscoder(seek?: number, audioFilters?: Array<string>) {
  const args = [
    '-analyzeduration', '0',
    '-loglevel', '0',
    '-f', 'mp3',
    '-ar', '48000',
    '-ac', '2',
  ]

  if(seek)
    args.unshift("-ss", seek.toString())

  if(Array.isArray(audioFilters))
    args.unshift('-af', audioFilters.join(","))

  const transcoder = new prism.FFmpeg({
    shell: false,
    args
  })

  return transcoder
}

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

export function sourceResolver(
  query: string,
): 'Youtube' | 'Spotify' | 'Soundcloud' | 'Search' | 'SpotifyPlaylist' | 'Deezer' {
  if (REGEX.youtube.test(query)) return 'Youtube';
  if (REGEX.spotify.test(query)) return 'Spotify';
  if (REGEX.spotifyPlaylist.test(query)) return 'SpotifyPlaylist';
  if (REGEX.soundCloud.test(query)) return 'Soundcloud';
  if (REGEX.deezer.test(query) || REGEX.deezerPlaylist.test(query) || REGEX.deezerShare.test(query)) return 'Deezer';
  return 'Search';
}

export async function spotifyBridge(track: Track, isYtdl: boolean) {
  const bridgeSearch = await play.search(`${track.name} by ${track.author.name} audio`, {
    source: {
      youtube: "video"
    }
  })

  if(isYtdl) return ytdl(bridgeSearch[0].url, { filter: "audioonly" })

  return await play.stream(bridgeSearch[0].url)
}