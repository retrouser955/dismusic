const voice = require('./voice.js')
const { getVoiceConnection, createAudioResource, joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior } = require('@discordjs/voice')
const EventEmiter = require('node:events')
const search = require('./search.js')
const play = require('play-dl')
const getMinute = require('./time')

class QueueBuilder extends EventEmiter {
    /**
     * Create a new queue
     * @param {Object} guild The guild of the discord server
     * @param {object} options The options for the queue. Automatically configed by Dismusic
     */
    constructor(guild, options) {
        super()
        this.guild = guild
        this.options = options
        this.tracks = []
        this.audioRes = undefined
        this.loopMode = "none"
        this.timestamp = undefined
        this.connection = getVoiceConnection(this.guild.id) || undefined
        this.isPaused = true
        this.volume = 100
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        })
    }
    /**
     * Play something in the voice channel
     * @param {object} searchRes The search Results you got from <player>.search function
     */
    async play(searchRes) {
        const searchedURL = searchRes?.url
        if(!searchedURL) throw new Error('[ Dismusic Error ] Search result must be a type of searched track. Got ' + typeof searchRes + " instead")
        const isVoiceConnected = getVoiceConnection(this.guild.id) || null
        if(!isVoiceConnected) throw new Error('[ Dismusic Error ] Player must be connected to voice before playing anything')
        let voicePlayer
        searchRes.changeableVolume = this.options?.changeableVolume || true
        if(searchRes.source === "YouTube" || searchRes.source === "SoundCloud") {
            voicePlayer = await voice.playTrack(searchRes, this.options.useExtractor, this.guild)
        } else {
            const searchResults = await search.YouTubeSearch(`${searchRes.name} by ${searchRes.author.name} lyrics`)
            voicePlayer = await voice.playTrack(searchResults[0], this.options.useExtractor, this.guild)
        }
        this.isPaused = false
        this.audioRes = voicePlayer.resource
        const player = voicePlayer.player
        this.player = player
        this.tracks.push(searchRes)
        this.timestamp = Date.now()
        player.on('stateChange', async (_oldState, newState) => {
            const loopMode = this.loopMode
            this.isPaused = true
            const status = newState.status
            if(status === 'idle' && this.tracks.length !== 0) {
                const track = this.tracks.splice(0, 1)
                if(loopMode === 'queue') this.tracks.push(track)
                if(loopMode === 'song') {
                    if(track.source === "YouTube" || track.source === "SoundCloud") {
                        const stream = await play.stream(latestTrack.url)
                        audioRes = createAudioResource(stream.stream, {
                            inputType: stream.type,
                            inlineVolume: this.options?.changeableVolume || true
                        })
                    } else {
                        const searchResults = await search.YouTubeSearch(`${latestTrack.name} by ${latestTrack.author.name}`)
                        const stream = await play.stream(searchResults[0].url)
                        audioRes = createAudioResource(stream.stream, {
                            inputType: stream.type,
                            inlineVolume: this.options?.changeableVolume || true
                        })
                    }
                    this.audioRes = audioRes
                    player.play(audioRes)
                    this.emit('EmitTrackStart', track)
                    this.timestamp = Date.now()
                    this.isPaused = false
                    return
                }
                if(this.tracks.length === 0) return this.emit('emitQueueEnded')
                const latestTrack = this.tracks[0]
                let audioRes
                if(latestTrack.source === "YouTube" || latestTrack.source === "SoundCloud") {
                    const stream = await play.stream(latestTrack.url)
                    audioRes = createAudioResource(stream.stream, {
                        inputType: stream.type,
                        inlineVolume: this.options?.changeableVolume || true
                    })
                } else {
                    const searchResults = await search.YouTubeSearch(`${latestTrack.name} by ${latestTrack.author.name}`)
                    const stream = await play.stream(searchResults[0].url)
                    audioRes = createAudioResource(stream.stream, {
                        inputType: stream.type,
                        inlineVolume: this.options?.changeableVolume || true
                    })
                }
                this.audioRes = audioRes
                player.play(audioRes)
                this.emit('EmitTrackStart', latestTrack)
                this.timestamp = Date.now()
            } else if(this.tracks.length === 0 && status !== "playing") {
                this.emit('emitQueueEnded')
            }
            this.isPaused = false
        })
    }
    /**
     * Connect to a voice channel
     * @param {object} channel The discord.js voice channel
     * @returns {object} Returns the discord.js connection object
     */
    async connectTo(channel) {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: this.guild.id,
            adapterCreator: this.guild.voiceAdapterCreator
        })
        this.connection = connection
        return connection
    }
    /**
     * Skip a track in the queue
     * @returns {object} Returns an object that contains the track skipped
     */
    async skip() {
        const track = this.tracks.splice(0, 1)
        if(this.tracks.length === 0) return this.emit('emitQueueEnded')
        const newTrack = this.tracks[0]
        const source = newTrack.source
        let audioRes
        if(source === "YouTube" || source === "SoundCloud") {
            const stream = await play.stream(newTrack.url)
            audioRes = createAudioResource(stream.stream, {
                inputType: stream.type,
                inlineVolume: this.options?.changeableVolume || true
            })
        } else {
            const searchResults = await search.YouTubeSearch(`${newTrack.name} by ${newTrack.author.name}`)
            const stream = await play.stream(searchResults[0].url)
            audioRes = createAudioResource(stream.stream, {
                inputType: stream.type,
                inlineVolume: this.options?.changeableVolume || true
            })
        }
        this.audioRes = audioRes
        this.emit('EmitTrackStart', newTrack)
        this.player.play(audioRes)
        this.timestamp = Date.now()
        return track
    }
    /**
     * Add a track to the queue
     * @param {object} searchRes The results your found
     */
    async addTrack(searchRes) {
        this.tracks.push(searchRes)
    }
    /**
     * Add multiple tracks to the queue
     * @param {Object[]} playlist The results you found. Good for adding playlists
     */
    async addTracks(playlist) {
        const currentTracks = this.tracks
        const newTracks = [...currentTracks, ...playlist]
        this.tracks = newTracks
    }
    /**
     * Pause the player
     */
    async pause() {
        const audioPlayer = emit.player
        audioPlayer.pause()
        this.pausedTimeStamp = Date.now()
        this.isPaused = true
    }
    /**
     * resume the player
     */
    async resume() {
        const audioPlayer = emit.player
        if(this.isPaused) {
            audioPlayer.unpause()
            const pausedTimeStamp = this.pausedTimeStamp - Date.now()
            this.timestamp = this.timestamp - pausedTimeStamp
        }
        this.isPaused = false
    }
    /**
     * Set the volume of the audio player
     * @param {number|string} amount The amount of volume you want to set
     */
    async setVolume(amount) {
        if(!amount) throw new Error('[ Dismusic Error ] Amount must be provided')
        if(!audioResource) throw new Error('[ Dismusic Error ] Could not find audio resources for this guild')
        if(Number(amount < 0) || Number(amount > 100)) throw new Error('[ Dismusic Error ] Could not set the volume to lower than 0 or more than 100')
        const newAmount = Number(amount) / 100
        this.audioRes.volume.setVolume(newAmount)
    }
    /**
     * Set the loop mode of this queue
     * @param {string} mode The mode your want to set. Can be `[ 'queue', 'none', 'song' ]`
     */
    async setLoopMode(mode) {
        const loopModeOptions = [ 'queue', 'none', 'song' ]
        if(!loopModeOptions.includes(mode)) throw new Error('[ Dismusic Error ] Loop mode must be one of ' + loopModeOptions.toString() + " got " + mode + " instead")
        this.loopMode = mode
    }
    /**
     * Get the current track being played
     * @returns {object} The current track being played
     */
    async getCurrentTrack() {
        const obj = this.tracks[0]
        const soFar = Math.floor(Date.now() / 1000) - Math.floor(emit.timestamp / 1000)
        const time = await getMinute(soFar)
        obj.currentTime = time
        return obj
    }
}

module.exports = QueueBuilder