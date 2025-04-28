import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Politics attributes interface
interface PoliticsAttributes {
  id: number;
  v_id: number | null;
  congressman: number | null;
  governor: number | null;
  vicegov: number | null;
  mayor: number | null;
  op: number | null;
  na: number | null;
  status: number | null;
}

// For creating a new politics record with optional ID
interface PoliticsCreationAttributes extends Optional<PoliticsAttributes, 'id'> {}

// Politics model class
class Politics extends Model<PoliticsAttributes, PoliticsCreationAttributes> implements PoliticsAttributes {
  public id!: number;
  public v_id!: number | null;
  public congressman!: number | null;
  public governor!: number | null;
  public vicegov!: number | null;
  public mayor!: number | null;
  public op!: number | null;
  public na!: number | null;
  public status!: number | null;
}

// Initialize the model
Politics.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  v_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  congressman: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  governor: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  vicegov: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  mayor: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  op: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  na: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  tableName: 'politics',
  sequelize,
  timestamps: false,
});

export default Politics; 