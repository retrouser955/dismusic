import Player from '../Core/Player';
import type Playlist from '../Structures/Playlist';
import type Track from '../Structures/Track';
import { Source } from '../types/typedef';

export default class BaseEngine {
  public player?: Player;

  constructor(mainPlayer?: Player) {
    this.player = mainPlayer;
  }

  async testSource(
    query: string,
    source: Source["ResolveSources"],
  ): Promise<boolean> {
    void query, source;
    return true;
  }

  async search(query: string, limit?: number): Promise<{ playlist: undefined | null | Playlist; tracks: Track[] }> {
    void query, limit
    throw new Error('Method not yet implemented');
  }

  async urlHandler(query: string, source: Source['ResolveSources']): Promise<{ playlist: null | undefined | Playlist; tracks: Track[] }> {
    void query
    void source
    throw new Error('Method not yet implemented');
  }
}
