import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Leader attributes interface
interface LeaderAttributes {
  id: number;
  v_id: number;
  type: number | null;
  electionyear: number | null;
  dateadded: string | null;
  user_id: number | null;
  status: number | null;
  laynes: number | null;
  is_printed: number;
  is_Received: number;
}

// For creating a new leader with optional ID
interface LeaderCreationAttributes extends Optional<LeaderAttributes, 'id' | 'is_printed' | 'is_Received'> {}

// Leader model class
class Leader extends Model<LeaderAttributes, LeaderCreationAttributes> implements LeaderAttributes {
  public id!: number;
  public v_id!: number;
  public type!: number | null;
  public electionyear!: number | null;
  public dateadded!: string | null;
  public user_id!: number | null;
  public status!: number | null;
  public laynes!: number | null;
  public is_printed!: number;
  public is_Received!: number;
}

// Initialize the model
Leader.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  v_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  type: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  electionyear: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  dateadded: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  laynes: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  is_printed: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  is_Received: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  }
}, {
  tableName: 'leaders',
  sequelize,
  timestamps: false,
});

export default Leader; 