import { StreamType } from '@discordjs/voice';
import * as play from 'play-dl';
import { Readable } from 'stream';
import Track from '../Structures/Track';

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

  async useFilters(_filters: string[]|string, _seekTo: number) {
    throw new Error("Error: As Play-dl extractor trades filter support for performance, filters are unable to be used")
  }

  async extract(track: Track, source: string): Promise<{ stream: Readable; type: StreamType }> {
    if (['YouTube', 'Soundcloud'].includes(source)) {
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
