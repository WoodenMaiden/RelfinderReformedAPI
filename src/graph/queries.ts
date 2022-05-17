import { QueryOptions }  from "RFR"

abstract class Queries /*implements QueryObject*/ {

    static base(): string {
        return `BASE <http://www.southgreen.fr/agrold/>`
    };

    static prefixes(): string {
        return `PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX obo:<http://purl.obolibrary.org/obo/>PREFIX vocab:<vocabulary/>`
    };

    static getAll(opt: QueryOptions): string {
        const ExclClss: string[] = (!opt.excludedClasses)? process.env.EXCLUDED_CLASSES.split(' '): opt.excludedClasses;
        const InclClss: string[] = (!opt.includedClasses)? process.env.INCLUDED_CLASSES.split(' '): opt.includedClasses;
        const grph: string[] = (!opt.graphs)? process.env.INCLUDED_GRAPHS.split(' '): opt.graphs;
        const ExclNS: string[] = (!opt.excludedNamespaces)? process.env.EXCLUDED_NAMESPACES.split(' '): opt.excludedNamespaces;
        const InclNS: string[] = (!opt.includedNamespaces)? process.env.INCLUDED_NAMESPACES.split(' '): opt.includedNamespaces;
        const offset: number = (!opt.offset === undefined || !opt.offset === null || opt.offset < 0 )? 0: opt.offset;
        const limit: number = (!opt.limit === undefined || !opt.limit === null || opt.limit < 0 )? 10000: opt.limit;

        return `SELECT distinct ?s ?p ?o ${(grph[0] === '') ? "" : `FROM <${grph.join('> FROM <')}>`} {
    ?s ?p ?o.
    ${(ExclClss[0] === '') ? "" : `FILTER (?s NOT IN (<${ExclClss.join("> <")}>))`}
    ${(InclClss[0] === '') ? "" : `FILTER (?s IN (<${InclClss.join("> <")}>))`}
    ${(ExclNS[0] === '') ? "" : `FILTER (!REGEX(STR(?s), '${this.generateNamespacesRegex(ExclNS)}'))`}
    ${(InclNS[0] === '') ? "" : `FILTER (REGEX(STR(?s), '${this.generateNamespacesRegex(InclNS)}'))`}
} offset ${offset} limit ${limit}`
    };

    static getGraphFromEntity(entity: string): string {
        return `${this.prefixes()} SELECT DISTINCT ?graph WHERE { GRAPH ?graph { <${entity}> ?p ?o. }}`
    }

    private static generateNamespacesRegex(strings: string[]): string {
        const toreturn: string[] = strings
        for (let i: number = 0; i < toreturn.length; ++i)
            toreturn[i] = `(^${toreturn[i]}*)`;
        return toreturn.join('|')
    }

    static getObjectsOf(subject: string/*, opt: QueryOptions*/): string {
        return `SELECT ?s ?p ?o WHERE { ?s ?p ?o. FILTER (STR(?s) = "${subject}")}`
    };

    static countTriplesOfGraph(graph: string): string {return `SELECT (count (?s) as ?counter) WHERE { GRAPH <${graph}> {?s ?p ?o.}}`}
}

export default Queries