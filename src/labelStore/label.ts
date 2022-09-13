
import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey
} from "sequelize-typescript";
import { FindOptions } from "sequelize/types/model";
import { NodeLabel } from "RFR";


@Table({
  tableName: 'labels',
  freezeTableName: true,
})
class Label extends Model<Label> {
    @PrimaryKey
    @Column({
        type: DataType.CITEXT,
        allowNull: false
    })
    label: string;

    @PrimaryKey
    @Column({
        field: "related_entity",
        type: DataType.CITEXT,
        allowNull: false
    })
    s: string;

    @PrimaryKey
    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    language: string;

    public static async findAllAndMap(options?: FindOptions<Label>): Promise<NodeLabel[]> {
        const results = await Label.findAll({
            ...options
        })

        return results.map(lab => {
            return  {
                s : { value: lab.s },
                label: {
                    value: lab.label,
                    language: lab.language
                }
            }
        })
    }
}

export default Label;