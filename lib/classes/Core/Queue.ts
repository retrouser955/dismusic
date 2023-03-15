import PlayDLExtractor from '../Extractors/Playdl';
import Track from './Track';
import { Guild, VoiceChannel } from 'discord.js';
import Player from './Player';
import {
  AudioPlayer,
  AudioPlayerState,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnection,
  AudioPlayerStatus,
} from '@discordjs/voice';
import { Readable } from 'stream';

export interface StreamReturnData {
  stream: Readable | string;
  type: StreamType;
}

export interface QueueConstructorOptions {
  extractor?: object;
  metadata?: any;
  playerInstance: Player;
}

class Queue {
  guild: Guild;
  extractor: any;
  playerInstance: Player;
  tracks: Track[];
  player: AudioPlayer;
  metadata: any;
  private isFirstPlay: boolean = true;
  connection: VoiceConnection | undefined;

  constructor(guild: Guild, options: QueueConstructorOptions) {
    this.guild = guild;
    this.extractor = options.extractor ?? new PlayDLExtractor();
    this.tracks = [];
    this.playerInstance = options.playerInstance;
    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });
  }

  addTrack(track: Track): void {
    this.tracks.push(track);
  }

  connect(voiceChannel: VoiceChannel): VoiceConnection {
    const connection = joinVoiceChannel({
      guildId: voiceChannel.guildId,
      channelId: voiceChannel.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    this.connection = connection;

    return connection;
  }

  async play(track: Track | undefined): Promise<void> {
    const isTrackUsable = track instanceof Track;

    if (this.isFirstPlay) {
      this.initializePlayer();
      this.isFirstPlay = false;
    }

    if (isTrackUsable) {
      const { stream, type } = await this.stream(track);

      const resource = createAudioResource(stream, {
        inputType: type,
      });

      this.tracks.unshift(track);

      this.player.play(resource);
    }
  }

  private async stream(track: Track): Promise<StreamReturnData> {
    const stream = await this.extractor?.stream(track, track.source);

    return stream;
  }

  private async initializePlayer(): Promise<void> {
    this.player.on('stateChange', this.playerStateChangeHandler);
  }

  private playerStateChangeHandler(_oldState: AudioPlayerState, newState: AudioPlayerState): void {
    const status: string = newState.status;

    if (status === 'idle') {
      if (this.tracks.length <= 0) {
        this.playerInstance.emit('queueEnd', this);

        const playerInstance = this.playerInstance;

        playerInstance.queues.delete(this.guild.id);
      }
    }
  }

  kill(): void {
    this.removeAllListeners();

    if (this.player.state.status !== AudioPlayerStatus.Idle) {
      try {
        this.player.stop(true);
      } catch {
        process.emitWarning('AudioPlayer Warning', {
          code: 'Stopping audio player',
          detail: 'Could not forcefully stop the audio player',
        });
      }
    }
  }

  private removeAllListeners() {
    this.player.off('stateChange', this.playerStateChangeHandler);
  }
}

export default Queue;
