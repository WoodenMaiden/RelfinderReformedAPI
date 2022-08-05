declare module "RFR" {
	export interface QueryOptions {
		offset?: number,
	    limit?: number,
		graphs?: string[],
		excludedClasses?: string[],
	    includedClasses?: string[],
	    excludedNamespaces?: string[],
	    includedNamespaces?: string[],
	}

	export interface GraphResults {
	    graph: NamedNode
	}

	export interface TripleResult {
		s: NamedNode,
		p: NamedNode,
		o: NamedNode|Literal
	}

	export interface CountResult {
		counter: Literal
	}

	// Types used by sparql client
	export interface Literal {
		value: any,
		datatype: NamedNode,
		language: ''
	}

	export interface NamedNode {
		value: string
	}

	export const enum LogLevel {
		FATAL = 0,
		ERROR = 1,
		WARN = 2,
		INFO = 3,
		DEBUG = 4,
		TRACE = 5
	}
}