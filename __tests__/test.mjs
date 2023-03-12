import { Player } from "../dist/index"
import { Client, EmbedBuilder, GatewayIntentBits } from "discord.js"

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
})

client.on("messageCreate", async ( message ) => {
    if(! message.content.startsWith('!') ) return 
        
    const args = message.content.split(" ")

    const command = args.splice(0, 1)[0].toLowerCase().replace("!", "")

    if(command === "play") {
        const query = args.join(" ")

        const queue = player.createQueue(message.guild, {
            metadata: {
                channel: message.channel
            },
        })

        const res = await player.search(query, {
            source: "Youtube",
            limit: 5
        })
    }
})

const player = new Player(client)

player.on("trackStart", async (track, queue) => {
    const channel = queue.metadata.channel

    channel.send({
        embeds: [
            new EmbedBuilder()
            .setTitle("A new track is starting")
            .setDescription(`name: ${track.name}`)
        ]
    })
})

client.login("My token")