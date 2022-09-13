
import { Table, Column, Model, DataType, PrimaryKey } from "sequelize-typescript";

@Table
class Label extends Model<Label> {
    @PrimaryKey
    @Column({
        type: DataType.CITEXT
    })
    label: string;

    @PrimaryKey
    @Column({
        field: "related_entity",
        type: DataType.CITEXT
    })
    s: string;
}

export default Label;