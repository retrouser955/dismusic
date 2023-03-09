const play = require('play-dl')
const Track = require('../Track.jsts')

class PlayDLExtractor {
    constructor(data) {
        if (!data.spotify) console.log("[ Warning ] Initialized the play-dl extractor without a spotify API Key")
        else this.spotify = data.spotify

        this.searchEngine = data.searchEngine
    }

    getHandleableSources() {
        const handleableSources = 
        [
            {
                source: "YouTube",
                regex: /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/
            },
            {
                source: "SoundCloud",
                regex: /(^(https:)\/\/(soundcloud.com)\/)/
            },
            {
                source: "Spotify",
                regex: /(^(https:)\/\/(open.spotify.com)\/(track)\/)/
            },
            {
                source: "SpotifyPlaylist",
                regex: /(^(https:)\/\/(open.spotify.com)\/(playlist)\/)/
            }
        ]

        return handleableSources
    }

    async search(query, source) {
        if(!source) {
            const searchRes = await play.search(query, { source: { youtube: "video" }})

            const tracks = searchRes.map((track) => {
                return new Track({
                    name: track.title,
                    description: track.description,
                    raw: track,
                    duration: track.durationRaw,
                    author: {
                        name: track.channel.name,
                        thumbnail: track.channel.iconURL()
                    },
                    source: "YouTube",
                    url: track.url
                })
            })

            return {
                playlist: undefined,
                tracks: tracks
            }
        }
    }

    async extract(track, source) {
        if(["YouTube", "SoundCloud"].includes(source)) {
            const stream = await play.stream(track.url)
            
            return {
                type: stream.type,
                stream: stream.stream
            }
        }

        const search = await play.search(`${track.name} by ${track.author.name} official audio`, {
            source: {
                youtube: "video"
            },
            limit: 1
        })

        const stream = await play.stream(search[0].url)

        return {
            type: stream.type,
            stream: stream.stream
        }
    }
}

module.exports = PlayDLExtractor