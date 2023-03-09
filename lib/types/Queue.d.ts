import { Guild, VoiceChannel } from "discord.js"
import EventEmitter from "events"
import Track from "../classes/Track"
import { VoiceConnection } from "@discordjs/voice"
import Player from "../classes/Player"

export interface QueueConstructorOptions {
    extractor?: object
    playerInstance: Player
    metadata?: any
}

export class Queue extends EventEmitter {
    guild: Guild
    tracks: Array<Track>

    constructor(guild: Guild, options: QueueConstructorOptions)

    addTrack(track: Track): void

    play(track: Track|undefined): Promise<void>

    pause(): void

    resume(): void

    join(channel: VoiceChannel): VoiceConnection

    private stream(track: Track): Promise<NodeJS.ReadableStream>

    private initializePlayer(): Promise<void>
}