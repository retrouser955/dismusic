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

export interface PlayerEvents {
  trackStart: (track: Track, queue: Queue) => void;
  queueEnd: (queue: Queue) => void;
}

export interface CreateQueueOptions {
  extractor?: any;
  metadata?: any;
}

export interface SearchOptions {
  source?: 'Youtube' | 'SoundCloud';
  limit?: number;
}

export default class Player extends EventEmitter<PlayerEvents> {
  client: Client;
  queues = new QueueManager();
  private youtubeEngine = new YouTubeSearchEngine();
  public soundCloudEngine = new SoundCloudSearchEngine();
  private spotifyEngine = new SpotifyEngine();

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

    if (resolved === 'Youtube') return await this.youtubeEngine.urlHandler(query);
    if (resolved === 'Spotify' || resolved === 'SpotifyPlaylist') return await this.spotifyEngine.urlHandler(query);
    if (resolved === 'Soundcloud') return await this.soundCloudEngine.urlHandler(query);

    if (resolved === 'Search') {
      const source: 'Youtube' | 'SoundCloud' = options?.source ?? 'Youtube';

      if (source === 'Youtube') return await this.youtubeEngine.search(query, options?.limit);
      if (source === 'SoundCloud') return await this.soundCloudEngine.search(query, options?.limit);
    }
  }
}
