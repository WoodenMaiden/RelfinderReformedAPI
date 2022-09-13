import { Sequelize } from "sequelize-typescript";
import { Transaction } from "sequelize/types";
import ParsingClient from "sparql-http-client/ParsingClient";

import Logger from "../utils/logger";
import { LogLevel } from "RFR"
import Label from "./label";
import Queries from '../graph/queries'


async function initSequelize(url: string){
    const sequelize = new Sequelize(url, {
        dialect: "postgres",
        logging: (msg, time) => Logger.debug(`Sequelize: ${msg}${(time)? ` executed in ${time}ms`: ''}`),
        benchmark: true,
        define: {
            freezeTableName: true,
            createdAt: false,
            updatedAt: false
        }
    })

    await sequelize.query('CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;')
    sequelize.addModels([Label])

    return await sequelize.sync()
}

async function fillDB(seq: Sequelize|null, client: ParsingClient) {
    if (!seq) return;
    let transaction: Transaction
    try {
        Logger.log("Filling database...", LogLevel.INFO)
        await seq.authenticate()

        const labels: Label[] = []
        let fetchedTriples = []
        let offset = 0
        let limit = 0

        do {
            const query =
                `${Queries.prefixes()} SELECT ?s ?label WHERE { ?s rdfs:label ?label. } offset ${offset} ${(limit)? `limit ${limit}`: ''}`
            Logger.log(`Sending query '${query}'`, LogLevel.DEBUG)

            fetchedTriples = await client.query.select(query)
            limit = fetchedTriples.length
            offset += limit
            labels.push(...fetchedTriples.map(tpl => Label.build({
                label: tpl.label.value,
                s: tpl.s.value,
                language: (tpl.label.termType === 'Literal')? tpl.label.language : ''
            })))
        } while(fetchedTriples.length > 0)

        transaction = await seq.transaction({
            logging: (msg, timing) => Logger.trace(`Transaction: ${msg}${(timing)? ` executed in ${timing}ms`: ''}`)
        })
        for (const label of labels) {
            await Label.findOrCreate({
                where: {
                    s: label.s,
                    label: label.label,
                    language: label.language
                },
                transaction
            })
        }
        await transaction.commit()

        Logger.info("Database filled!")
    } catch (e: unknown){
        await transaction.rollback()
        Logger.error(`Cannot connect to database for database filling: ${JSON.stringify(e)}`)
    }
}

export { initSequelize, fillDB };