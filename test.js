const { Player } = require('./index.js')
const { Client, GatewayIntentBits: Intents } = require('discord.js')
const client = new Client({
    intents: [Intents.Guilds, Intents.GuildVoiceStates, Intents.MessageContent, Intents.GuildMessages]
})

const player = new Player(client)

client.on('messageCreate', async (message) => {
    if(!message.content.startsWith('!')) return
    const raw = message.content.replace('!', '')
    const args = raw.split(' ')
    const command = args.splice(0, 1)[0]
    if(command === 'play') {
        const res = await player.search(args.join(' '))
        const existsQueue = await player.existsQueue(message.guild)
        console.log(res[0])
        if(existsQueue) {
            const queue = await player.getQueue(message.guild)
            message.reply('Adding tracks')
            queue.addTrack(res[0])
        } else {
            const queue = await player.createQueue(message.guild, {
                metadata: {
                    channel: message.channel
                }
            })
            await queue.connectTo(message.member.voice.channel)
            queue.play(res[0])
            message.reply('added tracks')
        }
    }
})

client.on('ready', () => console.log(`Logged in as ${client.user.tag}`))

client.login('')