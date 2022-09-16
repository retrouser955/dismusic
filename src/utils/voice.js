const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource, getVoiceConnection } = require('@discordjs/voice')
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
    playTrack: async (params, extractor) => {
        let stream;
        typeof extractor == 'function' ? stream = await extractor(params) : stream = await play.stream(params.url)
        const connection = getVoiceConnection(params.guild) || undefined
        if(!connection) throw new Error('[ Dismusic Error ] Cannot play a resource without having a connection')
        const resource = createAudioResource(stream)
        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        })
        connection.subscribe(player)
        player.play(resource)
        return {
            player, resource, connection
        }
    }
}

module.exports = voiceFunctions