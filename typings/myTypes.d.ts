declare module "RFR" {
	export interface QueryOptions {
		[key: string]: any //string[] | number

		//offset: number,
	    //limit: number,
		// graphs: string[],
		// excludedClasses: string[],
	    // includedClasses: string[],
	    // excludedNamespaces: string[],
	    // includedNamespaces: string[],
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