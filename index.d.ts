declare module "dismusic"

export interface SearchResults {
    name: String,
    description: String|null,
    rawData: Object,
    duration: {
        formatted: String,
        raw: Number
    },
    url: String,
    author: {
        name: String,
        thumbnail: String
    }
}

