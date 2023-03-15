import { StreamType } from '@discordjs/voice';
import * as play from 'play-dl';
import { Readable } from 'stream';
import Track from '../Core/Track';

interface SpotifyOptions {
  client_id: string;
  client_secret: string;
  market?: string;
}

interface Options {
  spotify?: SpotifyOptions;
  searchEngine?: string;
}

interface SearchReturn {
  playlist?: object;
  tracks: Track[];
}

export default class PlayDLExtractor {
  spotify: SpotifyOptions | undefined;
  searchEngine: string | undefined;

  constructor(data: Options = {}) {
    if (data.spotify) this.spotify = data.spotify;

    this.searchEngine = data.searchEngine;
  }

  getHandleableSources() {
    const handleableSources = [
      {
        source: 'YouTube',
        regex:
          /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/,
      },
      {
        source: 'SoundCloud',
        regex: /(^(https:)\/\/(soundcloud.com)\/)/,
      },
      {
        source: 'Spotify',
        regex: /(^(https:)\/\/(open.spotify.com)\/(track)\/)/,
      },
      {
        source: 'SpotifyPlaylist',
        regex: /(^(https:)\/\/(open.spotify.com)\/(playlist)\/)/,
      },
    ];

    return handleableSources;
  }

  async extract(track: Track, source: string): Promise<{ stream: Readable; type: StreamType }> {
    if (['YouTube', 'SoundCloud'].includes(source)) {
      const str = await play.stream(track.url);

      return {
        type: str.type,
        stream: str.stream,
      };
    }

    const search = await play.search(`${track.name} by ${track.author.name} official audio`, {
      source: {
        youtube: 'video',
      },
      limit: 1,
    });

    const ytstream = await play.stream(search[0].url);

    return {
      type: ytstream.type,
      stream: ytstream.stream,
    };
  }
}