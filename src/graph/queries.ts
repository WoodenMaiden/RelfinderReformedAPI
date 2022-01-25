interface QueryObject {
    readonly base: string;
    readonly prefixes: string;
//    readonly [key: string]: string;
    fillQuery (replace: Record<string, string>, query: string): string;
}


exports.default = class Queries implements QueryObject {

    base: `BASE <http://www.southgreen.fr/agrold/>`;

    prefixes : `PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>
    PREFIX obo:<http://purl.obolibrary.org/obo/>
    PREFIX vocab:<vocabulary/>`;

    getAll :` SELECT ?s ?p ?o { ?s ?p ?o. }`;
    getAllObjectOf: `SELECT ?p ?o { !subject! ?p ?o}`;


    fillQuery (replace: Record<string, string>, query: string): string {
        let str: string = query
        for (const [key, value] of Object.entries(replace)) {
            str = str.replace(`!${key}!`, value)
        }
        return str
    };
}