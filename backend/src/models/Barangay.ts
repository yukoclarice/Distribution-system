import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Barangay attributes interface
interface BarangayAttributes {
  id: number;
  barangay: string | null;
  municipality: string | null;
  district: number | null;
  households: number | null;
}

// For creating a new barangay with optional ID
interface BarangayCreationAttributes extends Optional<BarangayAttributes, 'id'> {}

// Barangay model class
class Barangay extends Model<BarangayAttributes, BarangayCreationAttributes> implements BarangayAttributes {
  public id!: number;
  public barangay!: string | null;
  public municipality!: string | null;
  public district!: number | null;
  public households!: number | null;
}

// Initialize the model
Barangay.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  barangay: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  municipality: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  district: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  households: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  tableName: 'barangays',
  sequelize,
  timestamps: false,
});

export default Barangay; 