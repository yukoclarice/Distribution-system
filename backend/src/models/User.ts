import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// User attributes interface
interface UserAttributes {
  user_id: number;
  username: string | null;
  password: string | null;
  fname: string | null;
  mname: string | null;
  lname: string | null;
  contact_no: string | null;
  user_type: string | null;
  status: string | null;
  login_ip: string | null;
  last_login: Date | null;
  v_id: number | null;
  imgname: string | null;
  remember: string | null;
  login_token: string | null;
}

// For creating a new user with optional ID (will be auto-generated)
interface UserCreationAttributes extends Optional<UserAttributes, 'user_id'> {}

// User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public user_id!: number;
  public username!: string | null;
  public password!: string | null;
  public fname!: string | null;
  public mname!: string | null;
  public lname!: string | null;
  public contact_no!: string | null;
  public user_type!: string | null;
  public status!: string | null;
  public login_ip!: string | null;
  public last_login!: Date | null;
  public v_id!: number | null;
  public imgname!: string | null;
  public remember!: string | null;
  public login_token!: string | null;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
User.init({
  user_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  fname: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  mname: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  lname: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  contact_no: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  user_type: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  login_ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  v_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  imgname: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  remember: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  login_token: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
}, {
  tableName: 'userstbl',
  sequelize,
  timestamps: false, // No createdAt/updatedAt fields in the table
});

export default User; 