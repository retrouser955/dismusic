import { Readable } from "stream";
import Player from "../Core/Player";
import Track from "../Structures/Track";
import { Source } from "../types/typedef";

export class BaseExtractor<ExtractorOptions = {}> {
    player: Player
    options?: ExtractorOptions

    constructor(player: Player, options?: ExtractorOptions) {
        this.player = player
        this.options = options
    }

    async extract(track: Track, source: Source['ValidSources']): Promise<Readable|string> {
        throw new Error("Method not implemented yet")
    }

    async useFilters(filters: string[], seek: number): Promise<Readable|string> {
        throw new Error('Method not implemented yet')
    }
}