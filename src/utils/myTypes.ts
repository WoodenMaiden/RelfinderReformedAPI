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

exports = module.exports = {
    QueryOptions,
    GraphResults
}