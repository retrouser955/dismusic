const voice = require('./voice.js')
const play = require('play-dl')

class QueueBuilder {
    constructor(guild, options) {
        this.guild = guild
        this.options = options
    }
    async create() {
        const queue = {
            guild: this.guild,
            tracks: [],
            isPlaying: false,
            play: async (searchRes) => {
                const searchedURL = searchRes?.url
                const isThereCustomExtractor = this.options.useExtractor ? true : false

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
                        stream = await play.stream(searchedURL)
                    } catch (error) {
                        throw new Error('[ Dismusic Error ] There has been an error while building your stream. The Error is as follows\n' + error)
                    }
                }
            }
        }
    }
}

module.exports = QueueBuilder