abstract class Queries /*implements QueryObject*/ {

    static base(): string {return `BASE <http://www.southgreen.fr/agrold/>`};

    static prefixes(): string {return `PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX obo:<http://purl.obolibrary.org/obo/>PREFIX vocab:<vocabulary/>`};

    static getAll(): string {return`SELECT ?s ?p ?o {?s ?p ?o.}`};
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