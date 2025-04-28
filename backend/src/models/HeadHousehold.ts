import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// HeadHousehold attributes interface
interface HeadHouseholdAttributes {
  id: number;
  fh_v_id: number | null;
  date_saved: string | null;
  user_id: number | null;
  leader_v_id: number | null;
  purok_st: string | null;
  verification_status: string | null;
  is_printed: number;
  is_Received: number;
}

// For creating a new head household with optional ID
interface HeadHouseholdCreationAttributes extends Optional<HeadHouseholdAttributes, 'id' | 'is_printed' | 'is_Received'> {}

// HeadHousehold model class
class HeadHousehold extends Model<HeadHouseholdAttributes, HeadHouseholdCreationAttributes> implements HeadHouseholdAttributes {
  public id!: number;
  public fh_v_id!: number | null;
  public date_saved!: string | null;
  public user_id!: number | null;
  public leader_v_id!: number | null;
  public purok_st!: string | null;
  public verification_status!: string | null;
  public is_printed!: number;
  public is_Received!: number;
}

// Initialize the model
HeadHousehold.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fh_v_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  date_saved: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  leader_v_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  purok_st: {
    type: DataTypes.STRING(245),
    allowNull: true,
  },
  verification_status: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  is_printed: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  is_Received: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'head_household',
  sequelize,
  timestamps: false,
});

export default HeadHousehold; 