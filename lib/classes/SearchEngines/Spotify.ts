import { default as axios } from 'axios';
import Player from '../Core/Player';
import Playlist from '../Structures/Playlist';
import Track from '../Structures/Track';
import { timeConverter } from '../Utils/Utils';
import BaseEngine from './BaseEngine';

export interface SpotifyAPIResponse {
  clientId: string;
  accessToken: string;
  accessTokenExpirationTimestampMs: number;
  isAnonymous: boolean;
}

export default class SpotifyEngine extends BaseEngine {
  private spotifyInfo = {
    clientId: '',
    token: '',
    expireDate: 0,
  };

  private spotifyAPIURL: string = 'https://api.spotify.com/v1';
  private spotifyTokenURL: string = 'https://open.spotify.com/get_access_token?reason=transport&productType=web_player';

  constructor(_player: Player) {
    super();

    (async () => {
      const data = await axios.get(this.spotifyTokenURL);
      const spotifyAPIResponse = data.data as SpotifyAPIResponse;

      this.spotifyInfo.clientId = spotifyAPIResponse.clientId;
      this.spotifyInfo.expireDate = spotifyAPIResponse.accessTokenExpirationTimestampMs;
      this.spotifyInfo.token = spotifyAPIResponse.accessToken;
    })();
  }

  async testSource(_query: string, source: 'Youtube' | 'Spotify' | 'Soundcloud' | 'Search' | 'SpotifyPlaylist') {
    return source === "SpotifyPlaylist" || source === "Spotify"
  }

  private async refreshSpotifyToken(): Promise<void> {
    if (Date.now() <= this.spotifyInfo.expireDate) return;

    const data = await axios.get('https://open.spotify.com/get_access_token?reason=transport&productType=web_player');
    const spotifyAPIResponse = data.data as SpotifyAPIResponse;

    this.spotifyInfo.clientId = spotifyAPIResponse.clientId;
    this.spotifyInfo.expireDate = spotifyAPIResponse.accessTokenExpirationTimestampMs;
    this.spotifyInfo.token = spotifyAPIResponse.accessToken;
  }

  private getAPIPlaylistURL(query: string) {
    const link = query.split('?')[0];
    const idArray = link.split('/');
    const id = idArray[idArray.length - 1];

    return `${this.spotifyAPIURL}/${query.includes('album') ? 'albums' : 'playlists'}/${id}`;
  }

  private async getSpotifyPlaylist(query: string) {
    const playlistURL = this.getAPIPlaylistURL(query);

    const axiosPlaylistData = (
      await axios.get(playlistURL, { headers: { Authorization: `Bearer ${this.spotifyInfo.token}` } })
    ).data;

    const playlist = new Playlist({
      name: axiosPlaylistData?.name as string,
      duration: '',
      author: {
        name: axiosPlaylistData?.owner?.display_name as string,
        thumbnail: '',
      },
      tracks: [],
    });

    let durationMS = 0;

    const spotifyTracks = axiosPlaylistData.tracks.items.map((t: any) => {
      const track: any = t.track || t;

      durationMS += parseInt(track.duration_ms, 10) as number;

      return new Track({
        name: track.name as string,
        description: '',
        raw: track,
        author: {
          name: track?.artists.map((art: any) => art.name).join(', ') as string,
          thumbnail: '',
        },
        duration: timeConverter(Math.round(parseInt(track.duration_ms, 10) / 1000)),
        source: 'Spotify',
        url: track.external_urls.spotify as string,
        thumbnail: track?.album?.images[0].url,
      });
    });

    playlist.duration = timeConverter(Math.round(durationMS / 1000));
    playlist.tracks = spotifyTracks;

    return { playlist, tracks: spotifyTracks };
  }

  private spotifyTrackAPIURLMaker(track: string) {
    const arr = track.split('?')[0];
    const arr2 = arr.split('/');

    return `${this.spotifyAPIURL}/tracks/${arr2[arr2.length - 1]}`;
  }

  private async spotifyTrackInfoExtractor(apiUrl: string) {
    await this.refreshSpotifyToken();

    const spotifyTrackData = (
      await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${this.spotifyInfo.token}`,
        },
      })
    ).data as any;

    const track = new Track({
      name: spotifyTrackData?.name as string,
      description: '',
      raw: spotifyTrackData,
      duration: timeConverter(Math.floor(parseInt(spotifyTrackData?.duration_ms, 10) / 1000)),
      author: {
        name: spotifyTrackData?.artists[0].name as string,
        thumbnail: '',
      },
      source: 'Spotify',
      url: spotifyTrackData?.external_urls?.spotify as string,
      thumbnail: spotifyTrackData?.album?.images[0]?.url,
    });

    return track;
  }

  async urlHandler(query: string): Promise<{ playlist: Playlist | undefined; tracks: Track[] }> {
    const SPOTIFY_PLAYLIST_REGEX = /(^(https:)\/\/(open.spotify.com)\/(playlist|album)\/)/;

    await this.refreshSpotifyToken();

    if (SPOTIFY_PLAYLIST_REGEX.test(query)) {
      const returnData = await this.getSpotifyPlaylist(query);

      return returnData;
    }

    const apiTrack = this.spotifyTrackAPIURLMaker(query);

    const trackData = await this.spotifyTrackInfoExtractor(apiTrack);

    return { playlist: undefined, tracks: [trackData] };
  }
}
