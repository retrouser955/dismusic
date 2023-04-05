import Queue from '../Core/Queue';
import Track from '../Structures/Track';

export default class TrackManager {
  public queue: Queue;
  public tracks: Track[];

  constructor(q: Queue, initialTracks?: Track[]) {
    this.queue = q;
    this.tracks = initialTracks ?? [];
  }

  get(position: number) {
    if (this.tracks.length - 1 < position) return undefined;

    return this.tracks[position];
  }

  set(track: Track, position?: number): void {
    if (!position) {
      this.tracks.push(track);
      return;
    }

    if (this.tracks.length - 1 < position) return;

    this.tracks.splice(position, 0, track);
  }

  addMultiple(track: Array<Track>) {
    this.tracks = [...this.tracks, ...track]
  }

  delete(position?: number): Track {
    if (!position) {
      const deleteTrack = this.tracks.splice(0, 1)[0];

      return deleteTrack;
    }

    const track = this.tracks.splice(position, 1)[0];

    return track;
  }

  shuffle() {
    let currentIndex: number = this.tracks.length;
    let randomIndex: number;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);

      currentIndex--;

      [this.tracks[currentIndex], this.tracks[randomIndex]] = [this.tracks[randomIndex], this.tracks[currentIndex]];
    }
  }

  addFirst(track: Track) {
    this.tracks.unshift(track);
  }

  get length() {
    return this.tracks.length;
  }
}
