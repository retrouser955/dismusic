/**
 * IMPORTANT! READ BEFORE PROCEEDING
 * 
 * Radio Client is not the main module of dismusic thus it will not be getting a lot of future support.
 * If you want to maintain the radio module, please submit a pull request.
 * 
 */

const {
    joinVoiceChannel,
    createAudioResource,
    getVoiceConnection,
    createAudioPlayer,
    NoSubscriberBehavior,
    StreamType,
    AudioPlayer,
    VoiceConnection
} = require('@discordjs/voice')
class RadioClient {
    /**
     * Create a new radio Client
     * @param {object} client The discord.js client
     */
    constructor(client) {
        if(!client) throw new Error('[ Dismusic Error ] A valid discord client is required to create a player')
        this.client = client
    }
    /**
     * Join a voice channel
     * @param {object} voice The member's voice state <member>.voice
     * @param {object} guild The discord.js guild
     * @returns {VoiceConnection}
     */
    async connectTo(voice, guild) {
        const connection = joinVoiceChannel({
            channelId: voice.channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator
        })
        return connection
    }
    /**
     * Start playing a station in your voice channel
     * @param {string} resource The MP3 link of your radio channel.
     * @param {object} guild the guild
     * @returns {AudioPlayer}
     */
    async startPlaying(resource, guild) {
        const connection = getVoiceConnection(guild.id)
        const res = createAudioResource(resource, {
            inputType: StreamType.Arbitrary
        })
        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        })
        connection.subscribe(player)
        player.play(res)
        player.on('stateChange', (_oldState, newState) => {
            const state = newState.status
            if(state === "idle") {
                const res = createAudioResource(resource, {
                    inputType: StreamType.Arbitrary
                })
                player.play(res)
            }
        })
        return player
    }
}

module.exports = RadioClient