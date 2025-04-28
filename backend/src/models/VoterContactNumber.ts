import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// VoterContactNumber attributes interface
interface VoterContactNumberAttributes {
  id: number;
  v_id: number | null;
  number: string | null;
  status: string | null;
  date_added: string | null;
}

// For creating a new voter contact number with optional ID
interface VoterContactNumberCreationAttributes extends Optional<VoterContactNumberAttributes, 'id'> {}

// VoterContactNumber model class
class VoterContactNumber extends Model<VoterContactNumberAttributes, VoterContactNumberCreationAttributes> implements VoterContactNumberAttributes {
  public id!: number;
  public v_id!: number | null;
  public number!: string | null;
  public status!: string | null;
  public date_added!: string | null;
}

// Initialize the model
VoterContactNumber.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  v_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  number: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  date_added: {
    type: DataTypes.STRING(45),
    allowNull: true,
  }
}, {
  tableName: 'v_contact_numbers',
  sequelize,
  timestamps: false,
});

export default VoterContactNumber; 