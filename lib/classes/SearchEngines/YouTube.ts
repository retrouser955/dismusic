import * as play from 'play-dl';
import Player from '../Core/Player';
import Playlist from '../Structures/Playlist';
import Track from '../Structures/Track';
import { timeConverter } from '../Utils/Utils';
import BaseEngine from './BaseEngine';
import Debugger from '../Utils/Debugger';
import { Source } from '../types/typedef';

export default class YouTubeSearchEngine extends BaseEngine {
  constructor(_player: Player, youtubeCookie?: string) {
    super(_player);

    if (youtubeCookie) {
      play.setToken({
        youtube: {
          cookie: youtubeCookie,
        },
      });
    }
  }

  async testSource(
    _query: string,
    source: Source["ResolveSources"],
  ) {
    return source === 'Youtube' || source === 'Search' || source === "YoutubePlaylist";
  }

  async search(query: string, limit?: number): Promise<{ playlist: undefined | null | Playlist; tracks: Track[] }> {
    Debugger.log('Executing Youtube search ...')

    const res = await play.search(query, {
      source: {
        youtube: 'video',
      },
      limit: limit ?? 5,
    });

    if(this.player?.debugMode) Debugger.log(`Found ${res.length} videos`)

    const tracks = res.map((track) => {
      if(this.player?.debugMode) {
        const object = Debugger.createObjectLog({ name: track.title, url: track.url }, true)

        Debugger.log(`Mapped track ${object}`)
      }

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

    if(this.player?.debugMode) Debugger.log("Search Completed")

    return { playlist: null, tracks };
  }

  async youtubePlaylistHandler(query: string) {
    if(this.player?.debugMode) Debugger.log("Getting the metadata of Youtube playlist ...")
    const youtubePlaylistData = await play.playlist_info(query);

    if(this.player?.debugMode) Debugger.log(`Playlist info: ${Debugger.createObjectLog({ name: youtubePlaylistData.title, url: youtubePlaylistData.url }, true)}`)

    const allVideos = await youtubePlaylistData.all_videos();

    if(this.player?.debugMode) Debugger.log(`Found all videos. Amout: ${allVideos.length}`)

    let duration = 0;

    const tracks = allVideos.map((val) => {
      duration += val.durationInSec;

      if(this.player?.debugMode) Debugger.log(`Found track ${Debugger.createObjectLog({ name: val.title, url: val.url }, true)}`)

      return new Track({
        name: val.title as string,
        url: val.url,
        duration: val.durationRaw,
        source: 'YouTube',
        raw: val,
        author: {
          name: val.channel?.name as string,
          thumbnail: val.channel?.iconURL() as string,
        },
        description: val.description as string,
        thumbnail: val.thumbnails[0].url,
      });
    });

    if(this.player?.debugMode) Debugger.log(`Calculated playlist duration: ${duration}ms`)

    const playlist = new Playlist({
      name: youtubePlaylistData.title as string,
      duration: timeConverter(duration),
      tracks,
      author: {
        name: youtubePlaylistData.channel?.name as string,
        thumbnail: youtubePlaylistData.channel?.iconURL() as string,
      },
    });

    if(this.player?.debugMode) Debugger.log("Processed Youtube playlist")

    return { playlist, tracks };
  }

  async urlHandler(query: string, source: Source['ResolveSources']): Promise<{ playlist: undefined | Playlist; tracks: Track[] }> {
    if(source === "Youtube") {
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

    return await this.youtubePlaylistHandler(query)
  }
}
