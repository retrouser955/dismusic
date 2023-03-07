const PlayDLExtractor = require("./Extractors/Playdl")
const Track = require("./Track")
const EventEmitter = require("node:events")
const { VoiceChannel, Guild } = require('discord.js')
const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType } = require('@discordjs/voice')

class Queue extends EventEmitter {
    /**
     * Create a new Queue in a guild
     * @param {Guild} guild The guild of the queue 
     * @param {any} Extractor The extractor used for the queue
     * @property {Track[]} tracks The tracks of the queue
     */
    constructor(guild, Extractor) {
        if(!guild instanceof Guild) throw new TypeError("Dismusic Error: A guild must be a valid discord.js guild.")

        this.guild = guild
        this.tracks = []
        this.extractor = Extractor ? Extractor : new PlayDLExtractor()
        this.player = createAudioPlayer()
        this.audioResouce = undefined
        this.paused = true

        this.#initializePlayer()
    }

    async addTrack(track) {
        if(!track instanceof Track) throw new TypeError("Dismusic Error: Cannot add a track to the queue as it is not an instance of the Track class.")

        this.tracks.push(track)
    }

    async play(track) {
        const trackUsable = track instanceof Track

        if(trackUsable) {
            const { stream, type } = await this.#stream(track.url)

            const resouce = createAudioResource(stream, {
                inputType: type || StreamType.Arbitrary,
                inlineVolume: true
            })

            this.player.play(resouce)
        } else {
            if(this.tracks.length < 0) throw new Error('Dismusic Error: Cannot play as there is no resources to play in the queue')

            const { stream, type } = await this.#stream(this.tracks[0].url)

            const resouce = createAudioResource(stream, {
                inputType: type || StreamType.Arbitrary,
                inlineVolume: true
            })

            this.player.play(resouce)
        }
    }

    pause() {
        if(!this.paused) {
            this.player.pause()
            this.paused = true
        }
    }

    resume() {
        if(this.paused) {
            this.player.unpause()
            this.paused = false
        }
    }

    join(voiceChannel) {
        if(!voiceChannel instanceof VoiceChannel) throw new TypeError('Dismusic Error: Cannot join a channel that is not an instance of VoiceChannel')

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            guildId: voiceChannel.guild.id
        })

        return connection
    }

    async #stream(track) {
        const stream = await this.extractor.extract(track, track.source)

        return stream
    }

    async #initializePlayer() {
        this.player.on("stateChange", async (oldState, newState) => {
            const state = newState.status

            if(state === "idle") {
                if(this.tracks.length <= 0) return this.emit("queueEnded")
                
                const oldTrack = this.tracks.slice(0, 1)

                const newTrack = this.tracks[0]

                const { stream, type } = await this.#stream(newTrack)

                const resource = createAudioResource(stream, {
                    inputType: type
                })

                this.player.play(resource)

                this.emit("newTrack", oldTrack, newTrack, this)
            }
        })
    }
}

module.exports = Queue