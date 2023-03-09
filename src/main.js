/**
 * @typedef {Object} SpotifyAuth The auth codes for spotify
 * @property {string} clientId The client ID of your spotify application
 * @property {string} clientSecret The client secret of your spotify application
 * @property {string} refresh_token the refresh token for your spotify application
 * @property {string|undefined} market the market to search on spotify
 */
/**
 * @typedef {Object} AuthCodes The auth codes for the client
 * @property {SpotifyAuth} spotify The Spotify Auth codes
 */

const EventEmiter = require('node:events')
const regexpConstants = require('./constants/regex')
const search = require('./utils/search')
const play = require('play-dl')
const QueueBuilder = require('./utils/Queue.js')
const { getVoiceConnection } = require('@discordjs/voice')

class Player extends EventEmiter {
    /**
     * Create a new Dismusic Player
     * @param {Object} client The discord.js Client you want to use
     * @param {AuthCodes|undefined} authCodes The auth code for spotify
     */
    constructor(client, authCodes) {
        if(!client) throw new Error('[ Dismusic Error ] A valid discord client is required to create a player')
        super()
        this.client = client
        this.queues = {}
        this.queues.players = {}
        if(authCodes?.spotify) {
            play.getFreeClientID().then(async (id) => {
                play.setToken({
                    soundcloud: {
                        client_id: id
                    },
                    spotify: {
                        client_id: authCodes.clientId,
                        client_secret: authCodes.clientSecret,
                        refresh_token: authCodes.refresh_token,
                        market: authCodes?.market || 'US'
                    }
                })
                this.hasSpotifyToken = true
            })
        } else {
            console.log('[ Dismusic Warning ] Spotify data was not provided! This is required to fall back to play-dl when spotify-url-info returns undefined')
        }
    }
    /**
     * Search a track
     * @param {String} query The query you want to search
     * @param {String} engine The place where you want to search. Can be 'YouTube' or 'SoundCloud'
     */
    async search(query, engine) {
        if(!query) throw new Error('[ Dismusic Error ] A valid query must be provided')
        if(typeof query != 'string') throw new Error(`[ Dismusic Error ] Query must be a type of String. Got ${typeof query}`)
        // validate the string
        const isYTUrl = String(query).match(regexpConstants.youtube)
        const isSpotifyUrl = String(query).match(regexpConstants.spotify)
        const isSoundCloudUrl = String(query).match(regexpConstants.soundCloud)
        const isSpotifyPlaylistUrl = String(query).match(regexpConstants.spotifyPlaylist)
        if(isYTUrl) {
            const searchResults = await search.YouTube(query)
            return searchResults
        }
        if(isSpotifyUrl) {
            const searchResults = await search.Spotify(query)
            return searchResults
        }
        if(isSoundCloudUrl) {
            const searchResults = await search.SoundCloud(query)
            return searchResults
        }
        if(isSpotifyPlaylistUrl) {
            const spotifyPlaylistData = await search.SpotifyPlaylist(query)
            return spotifyPlaylistData
        }
        if(!engine || engine === 'YouTube') {
            const searchResults = await search.YouTubeSearch(query)
            return searchResults
        }
        if(engine === 'SoundCloud') {
            const searchResults = await search.SoundCloudSearch(query)
            return searchResults
        }
    }
    /**
     * Get the existing Queue of a guild
     * @param {object} guild The guild of the queue you want to get
     * @returns {QueueBuilder} The queue of guild
     */
    async getQueue(guild) {
        const queue = this.queues[guild.id]
        return queue
    }
    /**
     * Check if the queue exists in a guild
     * @param {object} guild the guild you want to validate
     * @returns {boolean} true if the guild exists in the queue, false otherwise
     */
    existsQueue(guild) {
        const queue = this?.queues[guild.id]
        return queue ? true : false
    }
    /**
     * Create a new queue
     * @param {object} guild the guild you want to create a queue for
     * @param {object} options The options for creating a queue
     * @returns {QueueBuilder} The queue you just created
     */
    async createQueue(guild, options) {
        let queueFunctions = new QueueBuilder(guild, options)
        queueFunctions.on('EmitTrackStart', async (track) => {
            const queue = await this.getQueue(guild)
            this.emit('trackStart', queue, track)
        })

        queueFunctions.on('emitQueueEnded', async () => {
            const queue = await this.getQueue(guild)
            const connection = getVoiceConnection(guild.id) || undefined
            try {
                connection.destroy()
            } catch (error) {
                // no?
            }
            this.emit('queueEnded', queue)

            try {
                queueFunctions.removeAllListeners()
            } catch {
                try {
                    this.queues[guild.id].removeAllListeners()
                } catch (error) {
                    // no?
                }
            }

            delete this.queues.players[guild.id]
            delete this.queues[guild.id]
        })
        const queue = queueFunctions
        const player = queueFunctions.player
        this.queues[guild.id] = queue
        this.queues.players[guild.id] = player
        this.queues[guild.id].metadata = options?.metadata || undefined
        this.queues.players[guild.id] 
        this.queues[guild.id].kill = async () => {
            const connection = getVoiceConnection(guild.id) || undefined
            const status = this.queues.players[guild.id].state
            if(connection && status !== 'idle') {
                this.queues.players[guild.id].stop()
                connection.destroy()
            } else if(status === 'idle') {
                connection.destroy()
            } else if(connection) {
                connection.destroy()
            }

            delete this.queues[guild.id]
            delete this.queues.players[guild.id]
            queueFunctions = undefined
        }
        return this.queues[guild.id]
    }

    /**
     * Inject custom data to your tracks
     * @param {object} param target: "the target you want to inject", key: "the key that will be injected into the target", value: "the value that will be injected into the target"
     * @returns {any} injected target
     */
    injectCustomData({ target, key, value }) {
        if(!target || !key || !value) throw new Error("[ Dismusic Error ] Target, key or value cannot be undefined")
        target[key] = value
        return target
    }
}

module.exports = Player