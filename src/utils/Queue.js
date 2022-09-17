const voice = require('./voice.js')
const handleRegexp = require('./handleRegexp')
const { getVoiceConnection } = require('@discordjs/voice')
const EventEmiter = require('node:events')
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
                const { player } = await voice.playTrack(searchRes, this.options.useExtractor)
                player.on('stateChange', async (_oldState, newState) => {
                    const status = newState.status
                    if(status === 'idle' && this.tracks.length !== 0) {
                        const track = this.tracks.splice(0, 1)
                        const url = track.url
                        const audioRes = await handleRegexp(url)
                        this.emit('EmitTrackStart', track)
                        return player.play(audioRes)
                    } else {
                        this.emit('emitQueueEnded')
                    }
                })
            },
            async connectTo(channel) {
                const connection = await voice.joinTo(this.guild, channel)
                if(!connection) throw new Error('[ Dismusic Error ] There was an error while trying to connect to a voice channel')
                return connection
            }
        }
        return {
            queue: queue,
            resource: this.resource
        }
    }
}

module.exports = QueueBuilder