interface QueryOptions {
    excludedClasses: string[],
    includedClasses: string[],
    excludedNamespaces: string[],
    includedNamespaces: string[],
    graphs: string[],
    offset: number,
    limit: number
}

interface GraphResults {
    type: string,
    value: string
}

// TODO fix this
exports = module.exports = {
    QueryOptions,
    GraphResults
}