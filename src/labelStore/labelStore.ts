import { Sequelize } from "sequelize-typescript";

import Logger from "../utils/logger";
import { LogLevel } from "RFR"
import Label from "./label";

async function initSequelize(url: string){
    const sequelize = new Sequelize(url, {
        dialect: "postgres",
        logging: (msg, time) => Logger.log(`Sequelize: ${msg}${(time)? ` executed in ${time}ms`: ''}`, LogLevel.DEBUG),
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

export default initSequelize;