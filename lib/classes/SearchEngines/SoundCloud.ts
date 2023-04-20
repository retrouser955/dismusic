import * as play from 'play-dl';
import Player from '../Core/Player';
import Playlist from '../Structures/Playlist';
import Track from '../Structures/Track';
import { timeConverter } from '../Utils/Utils';
import BaseEngine from './BaseEngine';
import { Source } from '../types/typedef';

export default class SoundCloudSearchEngine extends BaseEngine {
  public isReady: boolean;

  constructor(_player: Player, clientId?: string) {
    super(_player);

    this.isReady = false;

    (async () => {
      if (clientId) {
        await play.setToken({
          soundcloud: {
            client_id: clientId,
          },
        });

        this.isReady = true;
      } else {
        const id = await play.getFreeClientID();
        await play.setToken({
          soundcloud: {
            client_id: id,
          },
        });

        this.isReady = true;
      }
    })();
  }

  async testSource(
    _query: string,
    source: Source['ResolveSources'],
  ) {
    return source === 'Soundcloud' || source === 'Search';
  }

  async search(query: string, limit?: number): Promise<{ playlist: undefined | null | Playlist; tracks: Track[] }> {
    if (!this.isReady) throw new Error('Error: Soundcloud search engine is not ready yet');

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
        source: "Soundcloud",
        url: track.permalink,
        thumbnail: track.thumbnail,
      });
    });

    return { playlist: null, tracks };
  }

  async urlHandler(query: string): Promise<{ playlist: null | undefined | Playlist; tracks: Track[] }> {
    if (!this.isReady) throw new Error('Error: Soundcloud engine is not ready yet!');

    const soundcloudMetadata = await play.soundcloud(query);

    if (soundcloudMetadata.type === 'track') {
      const soundCloudTrack = soundcloudMetadata as play.SoundCloudTrack;

      return {
        playlist: null,
        tracks: [
          new Track({
            name: soundCloudTrack.name,
            description: '',
            raw: soundCloudTrack,
            duration: timeConverter(soundCloudTrack.durationInSec),
            author: {
              name: soundCloudTrack.user.full_name,
              thumbnail: soundCloudTrack.user.thumbnail,
            },
            source: "Soundcloud",
            url: soundCloudTrack.permalink,
            thumbnail: soundCloudTrack.thumbnail,
          }),
        ],
      };
    }

    if (soundcloudMetadata.type === 'user') return { playlist: undefined, tracks: [] };

    const playlistData = soundcloudMetadata as play.SoundCloudPlaylist;

    const tracks = (await playlistData.all_tracks()).map((track: play.SoundCloudTrack) => {
      return new Track({
        name: track.name,
        description: '',
        duration: timeConverter(track.durationInSec),
        raw: track,
        author: {
          name: track.user.full_name,
          thumbnail: track.user.thumbnail,
        },
        source: "Soundcloud",
        url: track.url,
        thumbnail: track.thumbnail,
      });
    });

    const playlist = new Playlist({
      name: playlistData.name,
      duration: timeConverter(playlistData.durationInSec),
      tracks,
      id: playlistData.id.toString(),
      author: {
        name: playlistData.user.full_name,
        thumbnail: playlistData.user.thumbnail,
      },
    });

    return {
      playlist,
      tracks,
    };
  }
}
