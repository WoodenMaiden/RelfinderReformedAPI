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
	    type: string,
	    value: string
	}

	interface TripleResult {
     s: NamedNode,
     p: NamedNode,
     o: NamedNode
	}

	interface CountResult {
		counter: Literal
	}

	// Types used by sparql client
	interface Literal {
		value: number,
		datatype: NamedNode,
		language: ''
	}

	interface NamedNode {
		value: string
	}
}