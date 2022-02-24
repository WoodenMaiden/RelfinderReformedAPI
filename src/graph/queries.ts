import { QueryOptions }  from "RFR"

abstract class Queries /*implements QueryObject*/ {

    static base(): string {
        return `BASE <http://www.southgreen.fr/agrold/>`
    };

    static prefixes(): string {
        return `PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX obo:<http://purl.obolibrary.org/obo/>PREFIX vocab:<vocabulary/>`
    };

    static getAll(opt: QueryOptions): string {
        if (!opt.excludedClasses) opt.excludedClasses = process.env.EXCLUDED_CLASSES.split(' ');
        if (!opt.includedClasses) opt.includedClasses = process.env.INCLUDED_CLASSES.split(' ');
        if (!opt.graphs) opt.graphs = process.env.INCLUDED_GRAPHS.split(' ');
        if (!opt.excludedNamespaces) opt.excludedNamespaces = process.env.EXCLUDED_NAMESPACES.split(' ')
        if (!opt.includedNamespaces) opt.includedNamespaces = process.env.INCLUDED_NAMESPACES.split(' ')
        if (!opt.offset === undefined || !opt.offset === null || opt.offset < 0 ) opt.offset = 0
        if (!opt.limit === undefined || !opt.limit === null || opt.limit < 0 ) opt.limit = 10000

        return `SELECT distinct ?s ?p ?o ${(opt.graphs[0] === '') ? "" : `FROM <${opt.graphs.join('> FROM <')}>`} {
    ?s ?p ?o.
    ${(opt.excludedClasses[0] === '') ? "" : `FILTER (?s NOT IN (<${opt.excludedClasses.join("> <")}>))`}
    ${(opt.includedClasses[0] === '') ? "" : `FILTER (?s IN (<${opt.includedClasses.join("> <")}>))`}
    ${(opt.excludedNamespaces[0] === '') ? "" : `FILTER (!REGEX(STR(?s), '${this.generateNamespacesRegex(opt.excludedNamespaces)}'))`}
    ${(opt.includedNamespaces[0] === '') ? "" : `FILTER (REGEX(STR(?s), '${this.generateNamespacesRegex(opt.includedNamespaces)}'))`}
} offset ${opt.offset} limit ${opt.limit}`
    };

    static getGraphFromEntity(entity: string): string {
        return `${this.prefixes()}
SELECT DISTINCT ?graph
WHERE {
 GRAPH ?graph {
   <${entity}> ?p ?o.
 }
}`
    }

    private static generateNamespacesRegex(strings: string[]): string {
        const toreturn: string[] = strings
        for (let i: number = 0; i < toreturn.length; ++i)
            toreturn[i] = `(^${toreturn[i]}*)`;
        return toreturn.join('|')
    }

    static getObjectsOf(subject: string/*, opt: QueryOptions*/): string {
        return `SELECT ?s ?p ?o WHERE {
        ?s ?p ?o.
        FILTER (?s = <${subject}>)
}`
    };

    static countTriplesOfGraph(graph: string): string {return `SELECT (count (?s) as ?counter) WHERE { GRAPH <${graph}> {?s ?p ?o.}}`}
}

exports = module.exports = Queries