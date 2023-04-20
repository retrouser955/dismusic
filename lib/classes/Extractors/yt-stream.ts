import { Readable } from "stream";
import Player from "../Core/Player";
import Track from "../Structures/Track";
import { BaseExtractor } from "./BaseExtractor";
import { stream, downloadOptions, search } from "yt-stream";
import { stream as soundcloudStream } from "play-dl";
import Debugger from "../Utils/Debugger";

interface YTStreamExtractorOptions {
    useSourceURL?: boolean;
    ytStreamOptions?: downloadOptions;
}

export class YTStreamExtractor extends BaseExtractor<YTStreamExtractorOptions> {
    ytStreamOptions: downloadOptions;

    constructor(player: Player, options?: YTStreamExtractorOptions) {
        super(player, options)

        if(options?.ytStreamOptions) {
            this.ytStreamOptions = options.ytStreamOptions
        } else {
            this.ytStreamOptions = {
                quality: 'high',
                type: 'audio',
                highWaterMark: 1048576 * 32
            }
        }
    }

    public async extract(track: Track, source: "Youtube" | "Spotify" | "Soundcloud" | "Deezer" | "Custom"): Promise<string | Readable> {
        if(source === "Youtube") {
            return this.options?.useSourceURL ? (await stream(track.url, this.ytStreamOptions)).url : (await stream(track.url, this.ytStreamOptions)).stream
        }

        if(source === "Soundcloud") {
            if(this.player.debugMode) Debugger.log("Extracting for Soundcloud. Unable to find stream url ... going with readable")

            return (await soundcloudStream(track.url, { discordPlayerCompatibility: true })).stream
        }

        const res = await search(`${track.name} by ${track.author} audio`)

        const ytStream = await stream(res[0].url, this.ytStreamOptions)

        return this.options?.useSourceURL ? ytStream.url : ytStream.stream
    }
}