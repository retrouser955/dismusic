import PlayDLExtractor from "./Extractors/Playdl"
import Track from "./Track"
import { QueueConstructorOptions } from "../types/Queue"
import { Guild } from "discord.js";
import Player from "./Player";
import { AudioPlayer, AudioPlayerState, createAudioPlayer, createAudioResource, NoSubscriberBehavior, StreamType } from "@discordjs/voice";
import { Readable } from "stream";

interface StreamReturnData {
    stream: Readable|string,
    type: StreamType
}

class Queue {

    guild: Guild
    extractor: any
    playerInstance: Player
    tracks: Array<Track>
    player: AudioPlayer
    metadata: any

    constructor(guild: Guild, options: QueueConstructorOptions) {
        this.guild = guild
        this.extractor = options.extractor ?? new PlayDLExtractor()
        this.tracks = []
        this.playerInstance = options.playerInstance
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        })
    }

    addTrack(track: Track): void {
        this.tracks.push(track)
    }

    async play(track: Track | undefined): Promise<void> {
        const isTrackUsable = track instanceof Track

        if (isTrackUsable) {
            const { stream, type } = await this.stream(track)

            const resource = createAudioResource(stream, {
                inputType: type
            })

            this.tracks.unshift(track)

            this.player.play(resource)
        }
    }

    private async stream(track: Track): Promise<StreamReturnData> {
        const stream = await this.extractor?.stream(track, track.source)

        return stream
    }

    private async initializePlayer(): Promise<void> {
        this.player.on("stateChange", (_oldState: AudioPlayerState, newState: AudioPlayerState) => {
            const status: string = newState.status

            if(status === "idle") {
                if(this.tracks.length <= 0) {
                    this.playerInstance.emit("queueEnd", this)

                    const playerInstance = this.playerInstance

                    playerInstance.queues.delete(this.guild.id)
                }
            }
        })
    }
}

export default Queue