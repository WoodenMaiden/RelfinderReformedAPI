import { LabelResult } from "RFR";
import { StoringStrategy } from "./StoringStrategy";

enum StoringPrefixes {
    POSTGRES = "postgres",
    // MYSQL = "mysql",
    // SQLITE = "sqlite",
    HTTP = "http",
    HTTPS = "https",
    // MONGO = "mongo",
    // MONGOSRV = "mongo+srv" // https://www.mongodb.com/docs/manual/reference/connection-string/
}


export class LabelStore {
    private strategy: StoringStrategy;

    constructor(connectionURL: string) {
        switch (/^.[^\:\/]+/.exec(connectionURL)[0]) {
            case StoringPrefixes.POSTGRES:
                break;

            case StoringPrefixes.HTTP:
            case StoringPrefixes.HTTPS:
                break;
            
            default:
                throw new Error(`Unknown connection prefix: ${connectionURL}`);
        }
    }

    public async getByLabel(label: string): Promise<LabelResult> {
        return await this.strategy.getByLabel(label);
    }

    public async getByUri(uri: string): Promise<LabelResult> {
        return await this.strategy.getByUri(uri);
    }

    public async ping(): Promise<number> {
        return await this.strategy.ping();
    }

    public async connect(): Promise<void> {
        return await this.strategy.connect();
    }

    public async closeConnection(): Promise<void> {
        return await this.strategy.closeConnection();
    }
}


// async function initSequelize(url: string){
//     const sequelize = new Sequelize(url, {
//         dialect: "postgres",
//         logging: (msg, time) => Logger.debug(`Sequelize: ${msg}${(time)? ` executed in ${time}ms`: ''}`),
//         benchmark: true,
//         define: {
//             freezeTableName: true,
//             createdAt: false,
//             updatedAt: false
//         }
//     })

//     await sequelize.query('CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;')
//     sequelize.addModels([Label])

//     return await sequelize.sync()
// }

// export { initSequelize };