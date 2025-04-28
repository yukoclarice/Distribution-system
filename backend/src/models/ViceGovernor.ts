import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// ViceGovernor attributes interface
interface ViceGovernorAttributes {
  id: number;
  FirstName: string | null;
  LastName: string | null;
}

// For creating a new vice governor record with optional ID
interface ViceGovernorCreationAttributes extends Optional<ViceGovernorAttributes, 'id'> {}

// ViceGovernor model class
class ViceGovernor extends Model<ViceGovernorAttributes, ViceGovernorCreationAttributes> implements ViceGovernorAttributes {
  public id!: number;
  public FirstName!: string | null;
  public LastName!: string | null;
}

// Initialize the model
ViceGovernor.init({
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
  tableName: 'vice_governor',
  sequelize,
  timestamps: false,
});

export default ViceGovernor; 