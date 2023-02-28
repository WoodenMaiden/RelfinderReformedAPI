import { Sequelize } from "sequelize-typescript";

import Logger from "../utils/logger";
import Label from "./label";

// implement strategy here


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

export { initSequelize };