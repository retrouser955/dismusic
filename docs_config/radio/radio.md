##### IMPORTANT! READ BEFORE PROCEEDING

Radio Client is not the main module of dismusic thus it will not be getting a lot of future support.
If you want to maintain the radio module, please submit a pull request.

# Getting started with Dismusic Radio Client

First, we can create a Discord.js Bot

```js
const { Client, GatewayIntentBits: Intents } = require('discord.js')
const client = new Client({
    intents: [Intents.Guilds, Intents.GuildVoiceStates, Intents.MessageContent, Intents.GuildMessages]
})

client.login('TOKEN GOES HERE')
```

Then we will be able to add Dismusic's Radio Client to it

```js
const { RadioClient } = require('dismusic')
const { Client, GatewayIntentBits: Intents } = require('discord.js')

const client = new Client({
    intents: [Intents.Guilds, Intents.GuildVoiceStates, Intents.MessageContent, Intents.GuildMessages]
})
const radioClient = new RadioClient(client)

client.on('messageCreate', async (message) => {
    if(!message.content.startsWith('!')) return

    const raw = message.content.replace('!', '')
    const args = raw.split(' ')
    const command = args.splice(0, 1)[0]
    
    if(command === "!start") {
        const connection = radioClient.connectTo(message.member.voice, message.guild)
        const player = radioClient.startPlaying("https://stream.radiofomix.nl/listen/fomix/stream", message.guild)
        // The first argument **MUST** be a audio node that is streaming though https. Does not work with YouTube links
    }
})

client.login('TOKEN GOES HERE')
```