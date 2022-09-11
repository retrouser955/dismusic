const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource } = require('@discordjs/voice')
const play = require('play-dl')

const voiceFunctions = {
    joinTo: async (guild, voice) => {
        const connection = joinVoiceChannel({
            channelId: voice,
            guildId: guild.id,
            adapterCreator: guild.adapterCreator()
        })
        return connection
    },
    createPlayer: async () => {
        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        })
        return player
    },
    createResource: async (changeableVolume, stream) => {
        const resource = createAudioResource(stream.stream, {
            inlineVolume: changeableVolume,
            inputType: stream.type
        })
        return resource
    },
    getStream: async (resource) => {
        const stream = await play.stream(resource)
        return stream
    }
}

module.exports = voiceFunctions