import { TypedEmitter as EventEmitter } from 'tiny-typed-emitter';
import type { Client, Guild, Snowflake } from 'discord.js';
import QueueManager from '../Managers/QueueManager';
import Queue from './Queue';
import Track from '../Structures/Track';
import YouTubeSearchEngine from '../SearchEngines/YouTube';
import SoundCloudSearchEngine from '../SearchEngines/SoundCloud';
import { setMain } from '../Managers/PlayerManager';
import SpotifyEngine from '../SearchEngines/Spotify';
import * as Util from '../Utils/Utils';
import DeezerEngine from '../SearchEngines/Deezer';
import BaseEngine from '../SearchEngines/BaseEngine';

export interface PlayerEvents {
  trackStart: (track: Track, queue: Queue, lastTrack: Track) => void;
  queueEnd: (queue: Queue) => void;
}

export interface CreateQueueOptions {
  extractor?: any;
  metadata?: any;
}

export interface SearchOptions {
  source?: 'Youtube' | 'SoundCloud';
  limit?: number;
  customEngine: BaseEngine[];
}

export default class Player extends EventEmitter<PlayerEvents> {
  client: Client;
  queues = new QueueManager();
  public youtubeEngine = new YouTubeSearchEngine(this);
  public soundCloudEngine = new SoundCloudSearchEngine(this);
  public spotifyEngine = new SpotifyEngine(this);
  public deezerEngine = new DeezerEngine(this);

  constructor(client: Client) {
    super();

    this.client = client;

    setMain(this);
  }

  createQueue(guild: Guild, options: CreateQueueOptions = {}): Queue {
    const queue = new Queue(guild, {
      ...options,
      playerInstance: this,
    });

    this.queues.set(guild.id, queue);

    setMain(this);

    return queue;
  }

  generateStatusReport() {
    const status = {
      soundcloudEngineStatus: this.soundCloudEngine.isReady ? 'Ready' : 'Not Ready',
    };

    return status;
  }

  getQueue(guildId: string | Snowflake): Queue | undefined {
    const queue = this.queues.get(guildId);

    setMain(this);

    return queue;
  }

  deleteQueue(guildId: string | Snowflake): void {
    if (this.queues.has(guildId)) {
      const queue = this.getQueue(guildId) as Queue;

      queue.kill();

      setMain(this);

      this.queues.delete(guildId);
    }
  }

  async search(query: string, options?: SearchOptions) {
    const resolved = Util.sourceResolver(query);

    if (options?.customEngine) {
      let searchEngine: BaseEngine | undefined;

      for (const engine of options.customEngine) {
        const isAbleToHandle = await engine?.testSource(query, resolved);

        if (!isAbleToHandle) continue;

        searchEngine = engine;
        break;
      }

      if (!searchEngine) return await this.defaultSearch(query, resolved, options?.source, options?.limit);

      if (resolved === 'Search') return await searchEngine.search(query, options.limit);

      return await searchEngine?.urlHandler(query);
    } else {
      return await this.defaultSearch(query, resolved, options?.source, options?.limit);
    }
  }

  private async defaultSearch(
    query: string,
    resolved: 'Youtube' | 'Spotify' | 'Soundcloud' | 'Search' | 'SpotifyPlaylist' | 'Deezer',
    source: SearchOptions['source'],
    limit?: number,
  ) {
    if (resolved === 'Youtube') return await this.youtubeEngine.urlHandler(query);
    if (resolved === 'Spotify' || resolved === 'SpotifyPlaylist') return await this.spotifyEngine.urlHandler(query);
    if (resolved === 'Soundcloud') return await this.soundCloudEngine.urlHandler(query);
    if (resolved === 'Deezer') return await this.deezerEngine.urlHandler(query);

    if (resolved === 'Search') {
      const searchSource: 'Youtube' | 'SoundCloud' = source ?? 'Youtube';

      if (searchSource === 'Youtube') return await this.youtubeEngine.search(query, limit);
      if (searchSource === 'SoundCloud') return await this.soundCloudEngine.search(query, limit);
    }
  }
}
