import * as play from 'play-dl';
import Player from '../Core/Player';
import Playlist from '../Structures/Playlist';
import Track from '../Structures/Track';
import { timeConverter } from '../Utils/Utils';
import BaseEngine from './BaseEngine';

export default class YouTubeSearchEngine extends BaseEngine {
  constructor(_player: Player, youtubeCookie?: string) {
    super();

    if (youtubeCookie) {
      play.setToken({
        youtube: {
          cookie: youtubeCookie,
        },
      });
    }
  }

  async testSource(_query: string, source: 'Youtube' | 'Spotify' | 'Soundcloud' | 'Search' | 'SpotifyPlaylist') {
    return source === "Youtube" || source === "Search"
  }

  async search(query: string, limit?: number): Promise<{ playlist: undefined | null | Playlist; tracks: Track[] }> {
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

  async youtubePlaylistHandler(query: string) {
    const youtubePlaylistData = await play.playlist_info(query)

    const allVideos = await youtubePlaylistData.all_videos()

    let duration = 0

    const tracks = allVideos.map((val) => {
      duration += val.durationInSec

      return new Track({
        name: val.title as string,
        url: val.url,
        duration: val.durationRaw,
        source: "YouTube",
        raw: val,
        author: {
          name: val.channel?.name as string,
          thumbnail: val.channel?.iconURL() as string
        },
        description: val.description as string,
        thumbnail: val.thumbnails[0].url
      })
    })

    const playlist = new Playlist({
      name: youtubePlaylistData.title as string,
      duration: timeConverter(duration),
      tracks,
      author: {
        name: youtubePlaylistData.channel?.name as string,
        thumbnail: youtubePlaylistData.channel?.iconURL() as string
      }
    })

    return { playlist, tracks }
  }

  async urlHandler(query: string): Promise<{ playlist: undefined | Playlist; tracks: Track[] }> {
    const youtubeData = await play.video_basic_info(query);

    const track = new Track({
      name: youtubeData.video_details.title as string,
      description: youtubeData.video_details.description as string,
      raw: youtubeData.video_details,
      source: 'YouTube',
      author: {
        name: youtubeData.video_details.channel?.name as string,
        thumbnail: youtubeData.video_details.channel?.iconURL() as string,
      },
      url: youtubeData.video_details.url,
      duration: youtubeData.video_details.durationRaw,
      thumbnail: youtubeData.video_details.thumbnails[0].url,
    });

    return { playlist: undefined, tracks: [track] };
  }
}
