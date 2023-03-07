class Track {
    constructor({
        name,
        description,
        raw,
        duration,
        author,
        source,
        url
    }) {
        this.name = name,
        this.description = description
        this.raw = raw
        this.duration = duration,
        this.author = author
        this.source = source
        this.url = url
    }

    injectMetadata(data) {
        this.metadata = data
    }
}

module.exports = Track