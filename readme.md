# Dismusic

A fast and easy music library for Discord.js Version 14 made with play-dl and @discordjs/voice

# Installation

```bash
npm i dismusic
# or yarn
yarn add dismusic
```

# Using the package

First you must intstall ffmpeg-static (or just ffmpeg) and @discordjs/opus. (Python might be required for @discordjs/opus)

```bash
npm i ffmpeg-static @discordjs/opus
```

Next, we can create a discord js client

```js
const {
    Client,
    GatewayIntentBits: Intents,
    Partials
} = require('discord.js')
const client = new Client(
    {
        intents: [Intents.Guilds, Intents.GuildVoiceStates, Intents.MessageContent, Intents.GuildMessages],
        partials: [Partials.Message]
    }
)
```

Guild Voice State is required for this package

Then we can add dismusic to it

```js
const {
    Client,
    GatewayIntentBits: Intents,
    Partials
} = require('discord.js')
const client = new Client(
    {
        intents: [Intents.Guilds, Intents.GuildVoiceStates, Intents.MessageContent, Intents.GuildMessages],
        partials: [Partials.Message]
    }
)
const { Player } = require('dismusic')
client.player = new Player(client, {
        spotify: {
        client_id: 'spotify Client ID',
        client_secret: 'spotify Client Secret',
        token: "Spotify Request Token",
        market: 'US' // market do not touch if you dont know
    }
})
```
To get the spotify client id, client secret and request token, visit the play-dl docs [here](https://github.com/play-dl/play-dl/tree/main/instructions#spotify)

We can then add listeners

```js
const {
    Client,
    GatewayIntentBits: Intents,
    Partials
} = require('discord.js')
const client = new Client(
    {
        intents: [Intents.Guilds, Intents.GuildVoiceStates, Intents.MessageContent, Intents.GuildMessages],
        partials: [Partials.Message]
    }
)
const { Player } = require('dismusic')
client.player = new Player(client, {
        spotify: {
        client_id: 'spotify Client ID',
        client_secret: 'spotify Client Secret',
        token: "Spotify Request Token",
        market: 'US' // market do not touch if you dont know
    }
})
client.player.on('trackStart', async (song, queueData) => {
    queueData.metaChannel.send(`Started playing track ${song.title}\n\nDuration: \`${song.duration}\`\nURL: ${song.url}\nrequestedBy: ${song.metadata.requestedBy.tag}`)
})
.on('queueEnded', (queueData) => {
    queueData.metaChannel.send(`There are no more songs in the queue. Leaving 👋`)
})
client.on('messageCreate', async (message) => {
    if(!message.content.startsWith('!')) return
    if(message.content.startsWith('!play ')) {
        if(!message.member.voice.channelId) return message.channel.send('Please join a voice channel')
        if(message.guild.me.voice.channel && message.member.voice.channelId !== message.guild.me.voice.channelId) return message.channel.send('Please join my voice channel')
        const args = message.content.replace('!play ', '')
        const existQueue = await client.player.existQueue(message.guildId)
        if(existQueue) {
            const existingQueue = await client.player.getQueue(message.guildId)
            message.channel.send(`🔍 | Searching for ${args}`).then(async msg => {
                const song = await existingQueue.addSong(args, {
                    metadata: {
                        requestedBy: message.author
                    }
                })
                msg.edit(`Added ${song.title} to the queue\n\nDuration: \`${song.duration}\`\nURL: ${song.url}`)
            })
            return
        }
        const queue = await client.player.createQueue(message.guildId, {
            queueData: {
                metaChannel: message.channel
            }
        })
        try {
            queue.connect(message.member.voice.channel)
        } catch {
            return message.channel.send('there was an error while connecting to your voice channel')
        }
        const song = await queue.playSong(args, {
            metadata: {
                requestedBy: message.author
            }
        })
        message.channel.send(`Joined <#${message.member.voice.channelId}> and started playing ${song.title}\n\nDuration: \`${song.duration}\`\nURL: ${song.url}`)
    } else if (message.content === '!stop') {
        if(!message.member.voice.channelId) return message.channel.send('Please join a voice channel')
        if(message.guild.me.voice.channel && message.member.voice.channelId !== message.guild.me.voice.channelId) return message.channel.send('Please join my voice channel')
        const queue = await client.player.getQueue(message.guildId)
        queue.stop()
    } else if (message.content === '!queue') {
        if(!message.member.voice.channelId) return message.channel.send('Please join a voice channel')
        if(message.guild.me.voice.channel && message.member.voice.channelId !== message.guild.me.voice.channelId) return message.channel.send('Please join my voice channel')
        const queue = await client.player.getQueue(message.guildId)
        const queueSongs = []
        for(const songs of queue.songs) {
            queueSongs.push(`${songs.title} ([link](${songs.url}))`)
        }
        message.channel.send({
            embeds: [{
                title: 'Queue',
                description: queueSongs.join('\n')
            }]
        })
    } else if (message.content === '!pause') {
        if(!message.member.voice.channelId) return message.channel.send('Please join a voice channel')
        if(message.guild.me.voice.channel && message.member.voice.channelId !== message.guild.me.voice.channelId) return message.channel.send('Please join my voice channel')
        const queue = await client.player.getQueue(message.guildId)
        queue.pause()
    } else if (message.content === '!resume') {
        if(!message.member.voice.channelId) return message.channel.send('Please join a voice channel')
        if(message.guild.me.voice.channel && message.member.voice.channelId !== message.guild.me.voice.channelId) return message.channel.send('Please join my voice channel')
        const queue = await client.player.getQueue(message.guildId)
        queue.resume()
    } else if (message.content === '!skip') {
        if(!message.member.voice.channelId) return message.channel.send('Please join a voice channel')
        if(message.guild.me.voice.channel && message.member.voice.channelId !== message.guild.me.voice.channelId) return message.channel.send('Please join my voice channel')
        const queue = await client.player.getQueue(message.guildId)
        message.channel.send(`Skipping ${queue.songs[0].title}`)
        queue.skip()
    }
})
client.login('your bot token')
```

⚠ This package is still in development. If you encountered a bug, open an issue at our github page

There are docs for the package [here](https://retrouser955.github.io/dismusic/)

If you encountered any problems or have a question, feel free to join our [discord server](https://discord.gg/uWfMZYju8c)