import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// VoterImage attributes interface
interface VoterImageAttributes {
  id: number;
  v_id: number | null;
  imgname: string | null;
  added: string | null;
}

// For creating a new voter image with optional ID
interface VoterImageCreationAttributes extends Optional<VoterImageAttributes, 'id'> {}

// VoterImage model class
class VoterImage extends Model<VoterImageAttributes, VoterImageCreationAttributes> implements VoterImageAttributes {
  public id!: number;
  public v_id!: number | null;
  public imgname!: string | null;
  public added!: string | null;
}

// Initialize the model
VoterImage.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  v_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  imgname: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  added: {
    type: DataTypes.STRING(45),
    allowNull: true,
  }
}, {
  tableName: 'v_imgtbl',
  sequelize,
  timestamps: false,
});

export default VoterImage; 