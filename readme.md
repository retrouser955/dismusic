# Dismusic

Dismusic, a performance focused music system made for Discord.js version 14

# Getting started

Install Dismusic

```bash
npm i dismusic@latest
```

Then install ffmpeg-static and @discordjs/opus

```bash
npm i ffmpeg-static @discordjs/opus
```

### Create a discord bot using discord.js

```js
const { Player } = require('dismusic')
const { Client, GatewayIntentBits: Intents } = require('discord.js')
const client = new Client({
    intents: [Intents.Guilds, Intents.GuildVoiceStates, Intents.MessageContent, Intents.GuildMessages]
})
const player = new Player(client)

player.on('trackStart', async function(queue, track) {
    console.log(queue, track)
})

client.on('messageCreate', async (message) => {
    if(!message.content.startsWith('!')) return
    const raw = message.content.replace('!', '')
    const args = raw.split(' ')
    const command = args.splice(0, 1)[0]
    if(command === 'play') {
        const res = await player.search(args.join(' '))
        const existsQueue = await player.existsQueue(message.guild)
        if(existsQueue) {
            const queue = await player.getQueue(message.guild)
            message.reply('<a:host_loading:1022886955266080789> Adding track(s) ' + res[0].name)
            queue.addTrack(res[0])
        } else {
            const queue = await player.createQueue(message.guild, {
                // metadata will stay with the queue until it is destroyed
                metadata: {
                    channel: message.channel
                }
            })
            await queue.connectTo(message.member.voice.channel)
            queue.play(res[0])
            message.reply('<a:host_loading:1022886955266080789> Adding track(s) ' + res[0].name)
        }
    }
    if(command === 'skip') {
        const queue = await player.getQueue(message.guild)
        queue.skip()
    }
})

client.on('ready', () => console.log(`Logged in as ${client.user.tag}`))

client.login('')
```

There are docs for the package [here](https://retrouser955.github.io/dismusic/)

If you encountered any problems or have a question, feel free to join our [discord server](https://discord.gg/uWfMZYju8c)

# Example bot(s)

These bot(s) were created by awesome people in order to help **you** with making your own  
- [Dismusic Test Bot](https://github.com/BonoJansen/Dismusic-Test-Bot) by BonoJansen
