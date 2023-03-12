import { TypedEmitter as EventEmitter } from 'tiny-typed-emitter';
import type { Client, Guild, Snowflake } from 'discord.js';
import QueueManager from '../Managers/QueueManager';
import Queue from './Queue';
import Track from './Track';
import YouTubeSearchEngine from '../SearchEngines/YouTube';
import SoundCloudSearchEngine from '../SearchEngines/SoundCloud';

interface PlayerEvents {
  trackStart: (track: Track, queue: Queue) => void;
  queueEnd: (queue: Queue) => void;
}

interface CreateQueueOptions {
  extractor?: any;
  metadata?: any;
}

interface SearchOptions {
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
  }

  createQueue(guild: Guild, options: CreateQueueOptions = {}): Queue {
    const queue = new Queue(guild, {
      ...options,
      playerInstance: this,
    });

    this.queues.set(guild.id, queue);

    return queue;
  }

  getQueue(guildId: string | Snowflake): Queue | undefined {
    const queue = this.queues.get(guildId);

    return queue;
  }

  deleteQueue(guildId: string | Snowflake): void {
    if (this.queues.has(guildId)) {
      const queue = this.getQueue(guildId) as Queue;

      queue.kill();

      this.queues.delete(guildId);
    }
  }

  async search(query: string, options: SearchOptions) {
    if (options.source === 'Youtube') return await this.youtubeEngine.search(query, options.limit);
    if (options.source === 'SoundCloud') return await this.soundCloudEngine.search(query, options.limit);
  }
}
