import { QueryOptions }  from "RFR"
import { args } from "../utils/args"

abstract class Queries {

    static prefixes(): string {
        return `PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>`
    };

    static getAll(opt?: QueryOptions): string {
        const parsedOpt = this.parseQueryOptions(opt)

        return `${this.prefixes()} SELECT distinct ?s ?p ?o ${(parsedOpt.graphs) ? `FROM <${parsedOpt.graphs.join('> FROM <')}>`: ""} {
    ?s ?p ?o.
    ${(parsedOpt.excludedClasses) ? `{ ?s rdf:type ?o FILTER (?o NOT IN ${this.generateClassesFilter(parsedOpt.excludedClasses)})}` : ""}
    ${(parsedOpt.includedClasses) ? `{ ?s rdf:type ?o FILTER (?o IN ${this.generateClassesFilter(parsedOpt.includedClasses)})}` : ""}
    ${(parsedOpt.excludedNamespaces) ? `FILTER (!REGEX(STR(?s), '${this.generateNamespacesRegex(parsedOpt.excludedNamespaces)}'))` : ""}
    ${(parsedOpt.includedNamespaces) ? `FILTER (REGEX(STR(?s), '${this.generateNamespacesRegex(parsedOpt.includedNamespaces)}'))` : ""}
} offset ${parsedOpt.offset} limit ${parsedOpt.limit}`
    };

    static getGraphFromEntity(entity: string): string {
        return `${this.prefixes()} SELECT DISTINCT ?graph WHERE { GRAPH ?graph { <${entity}> ?p ?o. }}`
    }

    static getObjectsOf(subject: string, opt?: QueryOptions): string {
        const parsedOpt = this.parseQueryOptions(opt)

        return `SELECT ?s ?p ?o ${(parsedOpt.graphs) ? `FROM <${parsedOpt.graphs.join('> FROM <')}>`: ""} WHERE {
            ?s ?p ?o.
            FILTER(?s IN (<${subject}>))
            ${(parsedOpt.excludedClasses) ? `{ ?s rdf:type ?o FILTER (?o NOT IN ${this.generateClassesFilter(parsedOpt.excludedClasses)})}`: ""}
            ${(parsedOpt.includedClasses) ? `{ ?s rdf:type ?o FILTER (?o IN ${this.generateClassesFilter(parsedOpt.includedClasses)})}` : ""}
            ${(parsedOpt.excludedNamespaces) ? `FILTER (!REGEX(STR(?o), '${this.generateNamespacesRegex(parsedOpt.excludedNamespaces)}'))` : ""}
            ${(parsedOpt.includedNamespaces) ? `FILTER (REGEX(STR(?o), '${this.generateNamespacesRegex(parsedOpt.includedNamespaces)}'))` : ""}
        }`
    };

    static countTriplesOfGraph(graph: string): string {return `SELECT (count (?s) as ?counter) WHERE { GRAPH <${graph}> {?s ?p ?o.}}`}


    private static generateNamespacesRegex(strings: string[]): string {
        const toreturn: string[] = strings
        for (let i: number = 0; i < toreturn.length; ++i)
            toreturn[i] = `(^${toreturn[i]}*)`;
        return toreturn.join('|')
    }

    private static generateClassesFilter(strings: string[]) {
        const toreturn: string[] = strings
        for (let i: number = 0; i < toreturn.length; ++i)
            toreturn[i] = `<${toreturn[i]}>`;
        return '(' + toreturn.join(', ') + ')'
    }


    private static parseQueryOptions(opt: QueryOptions): QueryOptions {

        // will fuse all collections given as arguments into one with unique vamues, if all are undefined returns undefined
        function fuseOrUndefined<T>(...collections: T[][]): T[] | undefined {

            let toReturn: T[] = []
            collections.forEach(subCollection => {
                if (subCollection) {
                    toReturn = [...toReturn, ...subCollection].filter(
                        (elt, index, that) => elt !== undefined && that.lastIndexOf(elt) === index
                    )
                }
            })

            // if both are null they will return this array : [null]
            return (toReturn.length <= 0 || (toReturn.length === 1 && toReturn[0] === null)) ? undefined : toReturn;
        }

        return {
            graphs: fuseOrUndefined(opt?.graphs, args["included-graphs"]),
            excludedClasses: fuseOrUndefined(opt?.excludedClasses, args["excluded-classes"]),
            includedClasses: fuseOrUndefined(opt?.includedClasses, args["included-classes"]),
            excludedNamespaces: fuseOrUndefined(opt?.excludedNamespaces, args["excluded-namespaces"]),
            includedNamespaces: fuseOrUndefined(opt?.includedNamespaces, args["included-namespaces"]),
            offset: (opt?.offset !== undefined && opt?.offset !== null)? opt.offset: 0,
            limit: (opt?.limit !== undefined && opt?.limit !== null)? opt.limit: 10000
        }
    }

    // TODO: improve this, this takes 5 minutes to complete...
    static getLabels(entity: string): string {
        return `${this.prefixes()} SELECT DISTINCT ?s ?label WHERE {
    ?s rdfs:label ?label.
    FILTER (strstarts(STR(?s), '${entity}'))
} limit 100`
    }

    static getByLabel(label: string): string {
        return `${this.prefixes()} SELECT ?s ?label WHERE {
    ?s rdfs:label ?label.
    FILTER (strstarts(STR(?label), '${label}'))
} limit 100`
    }
}

export default Queries