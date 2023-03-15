import * as play from 'play-dl';
import Track from '../Core/Track';

export default class YouTubeSearchEngine {
  constructor(youtubeCookie?: string) {
    if (youtubeCookie) {
      play.setToken({
        youtube: {
          cookie: youtubeCookie,
        },
      });
    }
  }

  async search(query: string, limit?: number) {
    const res = await play.search(query, {
      source: {
        youtube: 'video',
      },
      limit: limit ?? 5,
    });

    const tracks = res.map((track) => {
      return new Track({
        name: track.title as string,
        description: track.description as string,
        url: track.url,
        duration: track.durationRaw,
        raw: track,
        author: {
          name: track.channel?.name as string,
          thumbnail: track.channel?.iconURL() as string,
        },
        source: 'YouTube',
        thumbnail: track.thumbnails[0].url,
      });
    });

    return { playlist: null, tracks };
  }
}
