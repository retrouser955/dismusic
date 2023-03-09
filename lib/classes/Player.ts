import { TypedEmitter as EventEmitter } from 'tiny-typed-emitter';
import type { Client, Guild, Snowflake } from 'discord.js';
import QueueManager from './Managers/QueueManager';
import Queue from './Queue';
import Track from './Track';

interface PlayerEvents {
  trackStart: (track: Track, queue: Queue) => void;
  queueEnd: (queue: Queue) => void;
}

interface CreateQueueOptions {
  extractor?: any;
  metadata?: any;
}

export default class Player extends EventEmitter<PlayerEvents> {
  client: Client;
  queues: QueueManager;

  constructor(client: Client) {
    super();
    this.client = client;
    this.queues = new QueueManager();
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
}
