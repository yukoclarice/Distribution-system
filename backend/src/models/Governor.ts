import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Governor attributes interface
interface GovernorAttributes {
  id: number;
  FirstName: string | null;
  LastName: string | null;
}

// For creating a new governor record with optional ID
interface GovernorCreationAttributes extends Optional<GovernorAttributes, 'id'> {}

// Governor model class
class Governor extends Model<GovernorAttributes, GovernorCreationAttributes> implements GovernorAttributes {
  public id!: number;
  public FirstName!: string | null;
  public LastName!: string | null;
}

// Initialize the model
Governor.init({
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
  tableName: 'governor',
  sequelize,
  timestamps: false,
});

export default Governor; 