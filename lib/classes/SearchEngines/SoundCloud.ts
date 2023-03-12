import * as play from 'play-dl';
import Track from '../Core/Track';
import { timeConverter } from '../Utils/Utils';

export default class SoundCloudSearchEngine {
  constructor(clientId?: string) {
    if (clientId) play.setToken({ soundcloud: { client_id: clientId } });
    else play.getFreeClientID().then((id) => play.setToken({ soundcloud: { client_id: id } }));
  }

  async search(query: string, limit?: number) {
    const res = await play.search(query, {
      limit,
      source: {
        soundcloud: 'tracks',
      },
    });

    const tracks = res.map((track) => {
      return new Track({
        name: track.name,
        description: '',
        raw: track,
        duration: timeConverter(track.durationInSec),
        author: {
          name: track.user.full_name,
          thumbnail: track.user.thumbnail,
        },
        source: 'SoundCloud',
        url: track.url,
      });
    });

    return { playlist: null, tracks };
  }
}
