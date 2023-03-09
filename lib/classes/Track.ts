interface TrackOptions {
    name: string;
    description: string;
    raw: any;
    duration: string;
    author: {
        name: string;
        thumbnail: string;
    };
    source: string;
    url: string
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
    source: string;
    url: string

    constructor(options: TrackOptions) {
        this.name = options.name,
        this.description = options.description
        this.raw = options.raw
        this.duration = options.duration,
        this.author = options.author
        this.source = options.source
        this.url = options.url
    }

    injectMetadata(data: any) {
        // @ts-expect-error
        this.metadata = data
    }
}

export default Track