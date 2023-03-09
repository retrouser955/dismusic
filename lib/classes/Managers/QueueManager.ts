import Queue from '../Queue';

export default class QueueManager {
  queues: { [key: string]: Queue };

  constructor(initialData: { [key: string]: Queue } = {}) {
    this.queues = initialData;
  }

  set(key: string, value: Queue): void {
    this.queues[key] = value;
  }

  get(key: string): Queue | undefined {
    return this.queues[key];
  }

  delete(key: string): void {
    if (this.queues[key] instanceof Queue) delete this.queues[key];
  }
}
