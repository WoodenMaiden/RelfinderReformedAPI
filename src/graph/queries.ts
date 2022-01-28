interface QueryOptions {
    excludedEntities: string[],
    excludedNamespaces : string[],
    graphs: string[],
}

abstract class Queries /*implements QueryObject*/ {

    static base(): string {return `BASE <http://www.southgreen.fr/agrold/>`};

    static prefixes(): string {return `PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX obo:<http://purl.obolibrary.org/obo/>PREFIX vocab:<vocabulary/>`};

    static getAll(opt: QueryOptions = {excludedEntities : [], graphs : [], excludedNamespaces : []}): string {
        return `SELECT ?s ?p ?o ${(opt.graphs.length === 0) ? "" : `FROM <${opt.graphs.join('> FROM <')}>`} {
            ?s ?p ?o. 
            ${(opt.excludedEntities.length === 0)? "": `FILTER (?s NOT IN (<${opt.excludedEntities.join("> <")}>))`} 
            ${(opt.excludedNamespaces.length === 0 ) ? "": `FILTER (!REGEX(STR(?s), '${this.generateRegex(opt.excludedNamespaces)}'))`}
        }`};

    static generateRegex(strings: string[]): string {
        // TODO return a string like this : '(^string1*)|(^string2*)|(^string3*)'
        return ""
    }

    static getAllObjectOf(): string {return `SELECT ?p ?o {!subject! ?p ?o.}`};

    static fillQuery (replace: Record<string, string>, query: string): string {
        let str: string = query
        for (const [key, value] of Object.entries(replace)) {
            str = str.replace(`!${key}!`, value)
        }
        return str
    };
}

exports = module.exports = Queries