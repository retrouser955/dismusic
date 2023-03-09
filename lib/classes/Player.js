const { Client, Collection } = require("discord.js")
const EventEmitter = require("events")
const Queue = require("./Queue")

class Player extends EventEmitter {
    constructor(client) {
        if(!client instanceof Client) throw new Error("Dismusic Error: Cannot initialize a player without a Discord.js client")

        super()

        this.client = client

        this.queues = new Collection()
    }

    createQueue(guild, options) {
        const queue = new Queue(guild, {
            extractor: options.extractor,
            playerInstance: this
        })

        this.queues.set(guild.id, queue)

        return queue
    }

    getQueue(guildId) {
        if(guildId || typeof guildId != 'string') throw new Error("Dismusic Error: A guild ID must be a string")

        if(!this.queues.has(guildId)) return undefined

        return this.queues.get(guildId)
    }
}

module.exports = Player