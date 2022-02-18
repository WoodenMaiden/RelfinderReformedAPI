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

	interface EntityResult {
     type: string,
     value: string|number|null
	}

	interface TripleResult {
     s: EntityResult,
     p: EntityResult,
     o: EntityResult
	}

	interface CountResult {
		value: number
	}

}