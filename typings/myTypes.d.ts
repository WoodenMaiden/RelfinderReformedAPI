declare module "RFR" {
	export interface QueryOptions {
	    excludedClasses: string[],
	    includedClasses: string[],
	    excludedNamespaces: string[],
	    includedNamespaces: string[],
	    graphs: string[],
	    offset: number,
	    limit: number
	}

	export interface GraphResults {
	    graph: NamedNode
	}

	interface TripleResult {
     s: NamedNode,
     p: NamedNode,
     o: NamedNode|Literal
	}

	interface CountResult {
		counter: Literal
	}

	// Types used by sparql client
	interface Literal {
		value: any,
		datatype: NamedNode,
		language: ''
	}

	interface NamedNode {
		value: string
	}
}