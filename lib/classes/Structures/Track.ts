export interface TrackOptions {
  name: string;
  description: string;
  raw: any;
  duration: string;
  author: {
    name: string;
    thumbnail: string;
  };
  source: 'YouTube' | 'SoundCloud' | 'Spotify' | 'Custom' | 'Deezer';
  url: string;
  thumbnail: string;
}

class Track {
  name: string;
  description: string;
  raw: any;
  duration: string;
  author: {
    name: string;
    thumbnail: string;
  };
  source: 'YouTube' | 'SoundCloud' | 'Spotify' | 'Custom' | 'Deezer';
  url: string;
  metadata: any;

  constructor(options: TrackOptions) {
    (this.name = options.name), (this.description = options.description);
    this.raw = options.raw;
    (this.duration = options.duration), (this.author = options.author);
    this.source = options.source;
    this.url = options.url;
  }

  injectMetadata(data: any) {
    this.metadata = data;
  }
}

export default Track;
