const voice = require('./voice.js')
const { getVoiceConnection } = require('@discordjs/voice')
const EventEmiter = require('node:events')
class QueueBuilder extends EventEmiter {
    constructor(guild, options) {
        super()
        this.guild = guild
        this.options = options
    }
    async create(audioPlayer) {
        const queue = {
            guild: this.guild,
            tracks: [],
            isPlaying: false,
            connection: getVoiceConnection(this.guild.id) || undefined,
            play: async (searchRes) => {
                const searchedURL = searchRes?.url
                if(!searchedURL) throw new Error('[ Dismusic Error ] Search result must be a type of searched track. Got ' + typeof searchRes + " instead")
                const isThereCustomExtractor = this.options.useExtractor ? true : false
                const isVoiceConnected = getVoiceConnection(this.guild.id) || null
                if(!isVoiceConnected) throw new Error('[ Dismusic Error ] Player must be connected to voice before playing anything')
                let stream, resource
                
                if(isThereCustomExtractor) {
                    stream = await this.options.useExtractor(searchRes)

                    if(!stream) throw new Error('[ Dismusic Error ] There has been an error while building your stream with a custom extractor. Make sure you are returning a valid stream')

                    try {
                        resource = await voice.createResource(options?.changeableVolume || true, stream)
                    } catch (error) {
                        throw new Error('[ Dismusic Error ] There has been an error while building your stream with a custom extractor. Make sure you are returning a valid stream')
                    }
                } else {
                    try {
                        stream = (await voice.getStream(searchedURL)).stream
                    } catch (error) {
                        throw new Error('[ Dismusic Error ] There has been an error while building your stream. The Error is as follows\n' + error)
                    }
                }
                isVoiceConnected.subscribe(audioPlayer)
                if(resource) audioPlayer.play(resource)
                this.emit('EmitTrackStart', true, searchRes)
                this.resource = resource
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