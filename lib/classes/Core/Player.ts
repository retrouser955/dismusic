import { TypedEmitter as EventEmitter } from 'tiny-typed-emitter';
import type { Client, Guild, Snowflake } from 'discord.js';
import QueueManager from '../Managers/QueueManager';
import Queue from './Queue';
import Track from './Track';
import YouTubeSearchEngine from '../SearchEngines/YouTube';
import SoundCloudSearchEngine from '../SearchEngines/SoundCloud';
import { setMain } from '../Managers/PlayerManager';

export interface PlayerEvents {
  trackStart: (track: Track, queue: Queue) => void;
  queueEnd: (queue: Queue) => void;
}

export interface CreateQueueOptions {
  extractor?: any;
  metadata?: any;
}

export interface SearchOptions {
  source: 'Youtube' | 'SoundCloud';
  limit?: number;
}

export default class Player extends EventEmitter<PlayerEvents> {
  client: Client;
  queues = new QueueManager();
  private youtubeEngine = new YouTubeSearchEngine();
  private soundCloudEngine = new SoundCloudSearchEngine();

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

  async search(query: string, options: SearchOptions) {
    if (options.source === 'Youtube') return await this.youtubeEngine.search(query, options.limit);
    if (options.source === 'SoundCloud') return await this.soundCloudEngine.search(query, options.limit);
  }
}
