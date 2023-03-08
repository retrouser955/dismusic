const { Client, Collection } = require("discord.js")
const Queue = require("./Queue")

class Player {
    constructor(client) {
        if(!client instanceof Client) throw new Error("Dismusic Error: Cannot initialize a player without a Discord.js client")

        this.client = client

        this.queues = new Collection()
    }

    createQueue(guild, options) {
        const queue = new Queue(guild, options.extractor)

        this.queues.set(guild.id, queue)

        return queue
    }
}

module.exports = Player