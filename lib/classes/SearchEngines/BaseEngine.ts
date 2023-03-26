import Player from "../Core/Player";
import type Playlist from "../Structures/Playlist"
import type Track from "../Structures/Track";

export default class BaseEngine {
    constructor(player?: Player) { void player }
    
    async testSource(query: string, source: 'Youtube' | 'Spotify' | 'Soundcloud' | 'Search' | 'SpotifyPlaylist'): Promise<boolean> {
        void query, source
        return true
    }

    async search(query: string, limit?: number): Promise<{ playlist: undefined | null | Playlist; tracks: Track[] }> {
        void query, limit
        throw new Error("Method not yet implemented")
    }

    async urlHandler(query: string): Promise<{ playlist: null | undefined | Playlist; tracks: Track[] }> {
        void query
        throw new Error("Method not yet implemented")
    }
}