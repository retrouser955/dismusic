import * as ytdl from "ytdl-core"
import Track from "../Structures/Track"
import { Source } from "../types/typedef"
import * as play from "play-dl"
import { createFFmpegTranscoder } from "../Utils/Utils"
import { StreamType } from "@discordjs/voice"

export class YTDLExtractor {
    async extract(track: Track, source: Source['ValidSources']) {
        let stream: NodeJS.ReadableStream
        const filter = "audioonly"

        switch (source) {
            case "Soundcloud":
                stream = (await play.stream(track.url, { discordPlayerCompatibility: true })).stream as NodeJS.ReadableStream
                break;

            case "Youtube":
                stream = ytdl(track.url, { filter })
                break;

            case "Spotify":
                const search = await play.search(`${track.name} by ${track.author} lyrics`, { limit: 1 })
                stream = ytdl(search[0].url, { filter })
                break;

            default: // Deezer
                const deezerSearch = await play.search(`${track.name} by ${track.author} lyrics`, { limit: 1 })
                stream = ytdl(deezerSearch[0].url, { filter })
                break;
        }

        return {
            type: StreamType.Arbitrary,
            stream
        }
    }

    async useFilters(filters: string[], stream: NodeJS.ReadableStream, duration?: number) {
        // prettier-ignore
        const transcoder = await createFFmpegTranscoder(duration, filters)

        transcoder.on("close", () => transcoder.destroy())
        transcoder.on('error', () => transcoder.destroy())

        const ffmpegStream = stream.pipe(transcoder)

        return ffmpegStream
    }
}