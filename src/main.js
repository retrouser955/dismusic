const EventEmiter = require('node:events')
const regexpConstants = require('./constants/regex')
const search = require('./utils/search')
const play = require('play-dl')
// const getMinute = require('./utils/time')
const QueueBuilder = require('./utils/Queue.js')
const { getVoiceConnection } = require('@discordjs/voice')

class Player extends EventEmiter {
    constructor(client, authCodes, options) {
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
        options?.volumeSetter ? this.changeableVolume = true : this.changeableVolume = false
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
    async getQueue(guild) {
        const queue = this.queues[guild.id]
        console.log(this.queues[guild.id])
        return queue
    }
    async existsQueue(guild) {
        const queue = this?.queues[guild.id]
        return queue ? true : false
    }
    async createQueue(guild, options) {
        const queueFunctions = new QueueBuilder(guild, options)
        queueFunctions.on('EmitTrackStart', async (track) => {
            const queue = await this.getQueue(guild)
            this.emit('trackStart', queue, track)
        })
        queueFunctions.on('emitQueueEnded', async () => {
            const queue = await this.getQueue(guild)
            const connection = getVoiceConnection(guild.id) || undefined
            connection.destroy()
            this.emit('queueEnded', queue)
            delete this.queues.players[guild.id]
            delete this.queues[guild.id]
        })
        const { queue, player } = await queueFunctions.create()
        this.queues[guild.id] = queue
        this.queues.players[guild.id] = player
        this.queues[guild.id].metadata = options.metadata
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
        }
        return this.queues[guild.id]
    }
}

module.exports = Player