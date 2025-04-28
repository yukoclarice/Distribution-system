import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Congressman attributes interface
interface CongressmanAttributes {
  id: number;
  FirstName: string | null;
  LastName: string | null;
}

// For creating a new congressman record with optional ID
interface CongressmanCreationAttributes extends Optional<CongressmanAttributes, 'id'> {}

// Congressman model class
class Congressman extends Model<CongressmanAttributes, CongressmanCreationAttributes> implements CongressmanAttributes {
  public id!: number;
  public FirstName!: string | null;
  public LastName!: string | null;
}

// Initialize the model
Congressman.init({
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
  tableName: 'congressman',
  sequelize,
  timestamps: false,
});

export default Congressman; 