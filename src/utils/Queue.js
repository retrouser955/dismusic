const voice = require('./voice.js')
const handleRegexp = require('./handleRegexp')
const { getVoiceConnection, createAudioResource, joinVoiceChannel } = require('@discordjs/voice')
const EventEmiter = require('node:events')
const play = require('play-dl')

class QueueBuilder extends EventEmiter {
    constructor(guild, options) {
        super()
        this.guild = guild
        this.options = options
        this.tracks = []
    }
    async create(/**audioPlayer**/) {
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
                const { player } = await voice.playTrack(searchRes, this.options.useExtractor, this.guild)
                this.player = player
                player.on('stateChange', async (_oldState, newState) => {
                    const status = newState.status
                    if(status === 'idle' && this.tracks.length !== 0) {
                        this.tracks.splice(0, 1)
                        console.log(this.tracks)
                        this.tracks[0].url
                        const audioRes = await handleRegexp(url)
                        this.emit('EmitTrackStart', track)
                        return player.play(audioRes)
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
                const name = track.name
                const author = track.author.name
                const searchString = `${name} by ${author} audio`
                const searchRes = await play.search(searchString, {
                    source: {
                        youtube: 'video',
                    },
                    limit: 1
                })
                const stream = await play.stream(searchRes[0].url)
                const res = createAudioResource(stream.stream)
                this.player.play(res)
            },
            async addTrack(searchRes) {
                this.tracks.push(searchRes)
            }
        }
        return {
            queue: queue,
            player: this.player
        }
    }
}

module.exports = QueueBuilder