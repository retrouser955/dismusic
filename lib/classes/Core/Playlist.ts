import Track from './Track';

interface PlaylistOptions {
  name: string;
  duration: string;
  tracks: Track[];
  thumbnail?: string;
  id?: string;
  metadata?: any;
  author: {
    name: string;
    thumbnail: string;
  };
}

export default class Playlist {
  name: string;
  duration: string;
  tracks: Track[];
  thumbnail?: string;
  id?: string;
  metadata?: any;
  author: {
    name: string;
    thumbnail: string;
  };

  constructor(options: PlaylistOptions) {
    this.name = options.name;
    this.duration = options.duration;
    this.tracks = options.tracks;
    this.thumbnail = options.thumbnail;
    this.id = options.id;
    this.metadata = options.metadata;
    this.author = options.author;
  }

  injectMetadata(metadata: any) {
    this.metadata = metadata;
  }
}
