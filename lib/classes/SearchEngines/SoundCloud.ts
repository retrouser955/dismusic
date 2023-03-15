import * as play from 'play-dl';
import Playlist from '../Core/Playlist';
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
        thumbnail: track.thumbnail,
      });
    });

    return { playlist: null, tracks };
  }

  async urlHandler(query: string) {
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
            source: 'SoundCloud',
            url: soundCloudTrack.url,
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
        source: 'SoundCloud',
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
