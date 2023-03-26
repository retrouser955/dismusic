import Player from '../Core/Player';
import Playlist from '../Structures/Playlist';
import Track from '../Structures/Track';
import BaseEngine from './BaseEngine';
import { getData } from '@mithron/deezer-music-metadata';
import * as Utils from '../Utils/Utils';

export default class DeezerEngine extends BaseEngine {
  constructor(_player: Player) {
    super();
  }

  async testSource(
    _query: string,
    source: 'Youtube' | 'Spotify' | 'Soundcloud' | 'Search' | 'SpotifyPlaylist' | 'Deezer',
  ): Promise<boolean> {
    return source === 'Deezer';
  }

  // most of the code comes from https://github.com/retrouser955/discord-player-deezer/blob/master/src/DeezerExtractor.ts
  async urlHandler(query: string): Promise<{ playlist: Playlist | null | undefined; tracks: Track[] }> {
    const data = await getData(query);

    if (data?.type === 'song') {
      const track = new Track({
        name: data.name as string,
        source: 'Deezer',
        thumbnail: data.thumbnail[0].url,
        raw: data,
        author: {
          thumbnail: data.author[0].image as string,
          name: data.author[0].name,
        },
        url: data.url,
        duration: Utils.timeConverter(data.duration),
        description: '',
      });

      return { playlist: null, tracks: [track] };
    }

    if (data?.type === 'playlist' || data?.type === 'album') {
      let duration = 0;

      const tracks = data.tracks.map((val) => {
        duration += val.duration;

        return new Track({
          name: val.name,
          thumbnail: val.thumbnail[0].url as string,
          source: 'Deezer',
          raw: val,
          author: {
            name: val.author[0].name,
            thumbnail: val.author[0].image as string,
          },
          description: '',
          duration: Utils.timeConverter(val.duration),
          url: val.url,
        });
      });

      const playlist = new Playlist({
        name: data.name,
        tracks,
        duration: Utils.timeConverter(duration),
        author: {
          name: data.artist.name,
          thumbnail: data.artist.image as string,
        },
      });

      return { playlist, tracks };
    }

    return { playlist: null, tracks: [] };
  }
}
