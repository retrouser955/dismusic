const voice = require('./voice.js')
const { getVoiceConnection, createAudioResource, joinVoiceChannel } = require('@discordjs/voice')
const EventEmiter = require('node:events')
const search = require('./search.js')
const play = require('play-dl')

class QueueBuilder extends EventEmiter {
    constructor(guild, options) {
        super()
        this.guild = guild
        this.options = options
        this.tracks = []
        this.audioRes = undefined
        this.loopMode = "none"
    }
    async create(/**audioPlayer**/) {
        const emit = this
        const queue = {
            guild: this.guild,
            tracks: this.tracks,
            connection: getVoiceConnection(this.guild.id) || undefined,
            play: async (searchRes) => {
                const searchedURL = searchRes?.url
                if(!searchedURL) throw new Error('[ Dismusic Error ] Search result must be a type of searched track. Got ' + typeof searchRes + " instead")
                const isVoiceConnected = getVoiceConnection(this.guild.id) || null
                if(!isVoiceConnected) throw new Error('[ Dismusic Error ] Player must be connected to voice before playing anything')
                let voicePlayer
                searchRes.changeableVolume = this.options?.changeableVolume || true
                if(searchRes.source === "YouTube" || searchRes.source === "SoundCloud") {
                    voicePlayer = await voice.playTrack(searchRes, this.options.useExtractor, this.guild)
                } else {
                    const searchResults = await search.YouTubeSearch(`${searchRes.name} by ${searchRes.author.name} lyrics`)
                    voicePlayer = await voice.playTrack(searchResults[0], this.options.useExtractor, this.guild)
                }
                emit.audioRes = voicePlayer.resource
                const player = voicePlayer.player
                this.player = player
                this.tracks.push(searchRes)
                player.on('stateChange', async (_oldState, newState) => {
                    const status = newState.status
                    if(status === 'idle' && this.tracks.length !== 0) {
                        const track = this.tracks.splice(0, 1)
                        if(loopMode === 'queue') this.tracks.push(track)
                        if(loopMode === 'song') {
                            if(track.source === "YouTube" || track.source === "SoundCloud") {
                                const stream = await play.stream(latestTrack.url)
                                audioRes = createAudioResource(stream.stream, {
                                    inputType: stream.type,
                                    inlineVolume: emit.options?.changeableVolume || true
                                })
                            } else {
                                const searchResults = await search.YouTubeSearch(`${latestTrack.name} by ${latestTrack.author.name}`)
                                const stream = await play.stream(searchResults[0].url)
                                audioRes = createAudioResource(stream.stream, {
                                    inputType: stream.type,
                                    inlineVolume: emit.options?.changeableVolume || true
                                })
                            }
                            emit.audioRes = audioRes
                            player.play(audioRes)
                            this.emit('EmitTrackStart', track)
                            return
                        }
                        if(this.tracks.length === 0) return this.emit('emitQueueEnded')
                        const latestTrack = this.tracks[0]
                        let audioRes
                        if(latestTrack.source === "YouTube" || latestTrack.source === "SoundCloud") {
                            const stream = await play.stream(latestTrack.url)
                            audioRes = createAudioResource(stream.stream, {
                                inputType: stream.type,
                                inlineVolume: emit.options?.changeableVolume || true
                            })
                        } else {
                            const searchResults = await search.YouTubeSearch(`${latestTrack.name} by ${latestTrack.author.name}`)
                            const stream = await play.stream(searchResults[0].url)
                            audioRes = createAudioResource(stream.stream, {
                                inputType: stream.type,
                                inlineVolume: emit.options?.changeableVolume || true
                            })
                        }
                        emit.audioRes = audioRes
                        player.play(audioRes)
                        this.emit('EmitTrackStart', latestTrack)
                    } else if(this.tracks.length === 0 && status !== "playing") {
                        this.emit('emitQueueEnded')
                    }
                })
            },
            async connectTo(channel) {
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: this.guild.id,
                    adapterCreator: this.guild.voiceAdapterCreator
                })
                return connection
            },
            async skip() {
                const track = this.tracks.splice(0, 1)
                if(this.tracks.length === 0) return this.emit('emitQueueEnded')
                const newTrack = this.tracks[0]
                const source = newTrack.source
                let audioRes
                if(source === "YouTube" || source === "SoundCloud") {
                    const stream = await play.stream(newTrack.url)
                    audioRes = createAudioResource(stream.stream, {
                        inputType: stream.type,
                        inlineVolume: emit.options?.changeableVolume || true
                    })
                } else {
                    const searchResults = await search.YouTubeSearch(`${newTrack.name} by ${newTrack.author.name}`)
                    const stream = await play.stream(searchResults[0].url)
                    audioRes = createAudioResource(stream.stream, {
                        inputType: stream.type,
                        inlineVolume: emit.options?.changeableVolume || true
                    })
                }
                emit.audioRes = audioRes
                emit.emit('EmitTrackStart', newTrack)
                emit.player.play(audioRes)
                return track
            },
            async addTrack(searchRes) {
                this.tracks.push(searchRes)
            },
            async addTracks(playlist) {
                const currentTracks = this.tracks
                const newTracks = [...currentTracks, ...playlist]
                this.tracks = newTracks
            },
            isPaused: true,
            async pause() {
                const audioPlayer = emit.player
                audioPlayer.pause()
                this.isPaused = true
            },
            async resume() {
                const audioPlayer = emit.player
                audioPlayer.unpause()
                this.isPaused = false
            },
            volume: 100,
            async setVolume(amount) {
                if(!amount) throw new Error('Dismusic Error: Amount must be provided')
                if(!audioResource) throw new Error('Dismusic Error: Could not find audio resources for this guild')
                if(Number(amount < 0) || Number(amount > 100)) throw new Error('Dismusic Error: Could not set the volume to lower than 0 or more than 100')
                const newAmount = Number(amount) / 100
                emit.audioRes.volume.setVolume(newAmount)
            },
            async setLoopMode(mode) {
                const loopModeOptions = [ 'queue', 'none', 'song' ]
                if(!loopModeOptions.includes(mode)) throw new Error('[ Dismusic Error ] Loop mode must be one of ' + loopModeOptions.toString() + " got " + mode + " instead")
                emit.loopMode = mode
            },
            loopMode: emit.loopMode
        }
        return {
            queue: queue,
            player: this.player
        }
    }
}

module.exports = QueueBuilder