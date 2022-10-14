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
    }
    async create(/**audioPlayer**/) {
        const emit = this
        const queue = {
            guild: this.guild,
            tracks: this.tracks,
            isPlaying: false,
            connection: getVoiceConnection(this.guild.id) || undefined,
            play: async (searchRes) => {
                const searchedURL = searchRes?.url
                if(!searchedURL) throw new Error('[ Dismusic Error ] Search result must be a type of searched track. Got ' + typeof searchRes + " instead")
                const isVoiceConnected = getVoiceConnection(this.guild.id) || null
                if(!isVoiceConnected) throw new Error('[ Dismusic Error ] Player must be connected to voice before playing anything')
                let voicePlayer
                if(searchRes.source === "YouTube" || searchRes.source === "SoundCloud") {
                    voicePlayer = await voice.playTrack(searchRes, this.options.useExtractor, this.guild)
                } else {
                    const searchResults = await search.YouTubeSearch(`${searchRes.name} by ${searchRes.author.name} lyrics`)
                    voicePlayer = await voice.playTrack(searchResults[0], this.options.useExtractor, this.guild)
                }
                const player = voicePlayer.player
                this.player = player
                this.tracks.push(searchRes)
                player.on('stateChange', async (_oldState, newState) => {
                    const status = newState.status
                    if(status === 'idle' && this.tracks.length !== 0) {
                        this.tracks.splice(0, 1)
                        if(this.tracks.length === 0) return this.emit('emitQueueEnded')
                        const latestTrack = this.tracks[0]
                        let audioRes
                        if(latestTrack.source === "YouTube" || latestTrack.source === "SoundCloud") {
                            const stream = await play.stream(latestTrack.url)
                            audioRes = createAudioResource(stream.stream, {
                                inputType: stream.type
                            })
                        } else {
                            const searchResults = await search.YouTubeSearch(`${latestTrack.name} by ${latestTrack.author.name}`)
                            const stream = await play.stream(searchResults[0].url)
                            audioRes = createAudioResource(stream.stream, {
                                inputType: stream.type
                            })
                        }
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
                        inputType: stream.type
                    })
                } else {
                    const searchResults = await search.YouTubeSearch(`${newTrack.name} by ${newTrack.author.name}`)
                    const stream = await play.stream(searchResults[0].url)
                    audioRes = createAudioResource(stream.stream, {
                        inputType: stream.type
                    })
                }
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
            }
        }
        return {
            queue: queue,
            player: this.player
        }
    }
}

module.exports = QueueBuilder