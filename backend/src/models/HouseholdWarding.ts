import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// HouseholdWarding attributes interface
interface HouseholdWardingAttributes {
  id: number;
  fh_v_id: number | null;
  mem_v_id: number | null;
  date_saved: string | null;
  user_id: number | null;
}

// For creating a new household warding with optional ID
interface HouseholdWardingCreationAttributes extends Optional<HouseholdWardingAttributes, 'id'> {}

// HouseholdWarding model class
class HouseholdWarding extends Model<HouseholdWardingAttributes, HouseholdWardingCreationAttributes> implements HouseholdWardingAttributes {
  public id!: number;
  public fh_v_id!: number | null;
  public mem_v_id!: number | null;
  public date_saved!: string | null;
  public user_id!: number | null;
}

// Initialize the model
HouseholdWarding.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fh_v_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  mem_v_id: {
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
  }
}, {
  tableName: 'household_warding',
  sequelize,
  timestamps: false,
});

export default HouseholdWarding; 