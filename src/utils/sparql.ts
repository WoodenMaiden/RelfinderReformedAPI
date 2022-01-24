const SparqlGenerator = require('sparqljs').Generator;
const fs = require('fs/promises');
import QueriesObject from './queriesObject'

const generator = (obj: JSON): string =>  {
    return new SparqlGenerator(obj).stringify(obj);
}

fs.readdir('../../queries', {encoding: 'utf8', withFileTypes: false}).then((files: string[] ) => {
    const promises: Promise<string>[] = new Array(files.length)

    files.forEach((v: string , i: number) => {
        promises[i] = fs.readFile(`../../queries/${v}`, {encoding: 'utf8', flag: 'r'})
    })

    const obj: QueriesObject = {generate: generator};

    Promise.all(promises).then((queries: string[]) => {
        for (let i: number = 0; i < queries.length; ++i) {
            obj[`${files[i].split('.')[0]}`] = JSON.parse(queries[i])
        }

        Object.freeze(obj)
        Object.seal(obj)

        /**
         * @author Yann POMIE yann.pomie{at}ird.fr
         * @type Object
         * @name queries
         * @description An object that keep the contents of "queries" directory as json for further modifications
         * @function queries.generator calls SparqlParser.parse
         */
        exports.queries = obj
    })
})