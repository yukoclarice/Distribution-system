import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// VoterInfo attributes interface
interface VoterInfoAttributes {
  v_id: number;
  barangayId: number | null;
  v_precinct_no: string | null;
  v_lname: string | null;
  v_fname: string | null;
  v_mname: string | null;
  v_birthday: Date | null;
  v_gender: string | null;
  record_type: number | null;
  v_idx: string;
  date_recorded: Date | null;
}

// For creating a new voter with optional ID (will be auto-generated)
interface VoterInfoCreationAttributes extends Optional<VoterInfoAttributes, 'v_id'> {}

// VoterInfo model class
class VoterInfo extends Model<VoterInfoAttributes, VoterInfoCreationAttributes> implements VoterInfoAttributes {
  public v_id!: number;
  public barangayId!: number | null;
  public v_precinct_no!: string | null;
  public v_lname!: string | null;
  public v_fname!: string | null;
  public v_mname!: string | null;
  public v_birthday!: Date | null;
  public v_gender!: string | null;
  public record_type!: number | null;
  public v_idx!: string;
  public date_recorded!: Date | null;
}

// Initialize the model
VoterInfo.init({
  v_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  barangayId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  v_precinct_no: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  v_lname: {
    type: DataTypes.STRING(145),
    allowNull: true,
  },
  v_fname: {
    type: DataTypes.STRING(145),
    allowNull: true,
  },
  v_mname: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  v_birthday: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  v_gender: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  record_type: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  v_idx: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  date_recorded: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'v_info',
  sequelize,
  timestamps: false, // No createdAt/updatedAt fields in the table
});

export default VoterInfo; 