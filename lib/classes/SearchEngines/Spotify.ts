import { default as axios } from 'axios';
import Playlist from '../Core/Playlist';
import Track from '../Core/Track';
import { timeConverter } from '../Utils/Utils';

export interface SpotifyAPIResponse {
  clientId: string;
  accessToken: string;
  accessTokenExpirationTimestampMs: number;
  isAnonymous: boolean;
}

export default class SpotifyEngine {
  private spotifyInfo = {
    clientId: '',
    token: '',
    expireDate: 0,
  };

  private spotifyAPIURL: string = 'https://api.spotify.com/v1';

  constructor() {
    (async () => {
      const data = await axios.get('https://open.spotify.com/get_access_token?reason=transport&productType=web_player');
      const spotifyAPIResponse = data.data as SpotifyAPIResponse;

      this.spotifyInfo.clientId = spotifyAPIResponse.clientId;
      this.spotifyInfo.expireDate = spotifyAPIResponse.accessTokenExpirationTimestampMs;
      this.spotifyInfo.token = spotifyAPIResponse.accessToken;
    })();
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

    return `${this.spotifyAPIURL}/playlists/${id}`;
  }

  private async getSpotifyPlaylist(query: string) {
    const playlistURL = this.getAPIPlaylistURL(query);

    const axiosPlaylistData = (
      await axios.get(playlistURL, { headers: { Authorization: `Bearer ${this.spotifyInfo.token}` } })
    ).data;

    const playlist = new Playlist({
      name: axiosPlaylistData?.name as string,
      duration: '0:00',
      author: {
        name: axiosPlaylistData?.owner?.display_name as string,
        thumbnail: '',
      },
      tracks: [],
    });

    const spotifyTracks = axiosPlaylistData.tracks.items.map((t: any) => {
      const track: any = t.track;

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

    playlist.tracks = spotifyTracks;

    return { playlist, tracks: spotifyTracks };
  }

  async urlHandler(query: string) {
    await this.refreshSpotifyToken();

    const returnData = await this.getSpotifyPlaylist(query);

    return returnData;
  }
}
