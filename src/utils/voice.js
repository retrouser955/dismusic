const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior } = require('@discordjs/voice')
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
    }
}

module.exports = voiceFunctions