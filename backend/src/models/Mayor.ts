import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Mayor attributes interface
interface MayorAttributes {
  id: number;
  FirstName: string | null;
  LastName: string | null;
}

// For creating a new mayor record with optional ID
interface MayorCreationAttributes extends Optional<MayorAttributes, 'id'> {}

// Mayor model class
class Mayor extends Model<MayorAttributes, MayorCreationAttributes> implements MayorAttributes {
  public id!: number;
  public FirstName!: string | null;
  public LastName!: string | null;
}

// Initialize the model
Mayor.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  FirstName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  LastName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  }
}, {
  tableName: 'mayor',
  sequelize,
  timestamps: false,
});

export default Mayor; 