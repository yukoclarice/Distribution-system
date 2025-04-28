import User from './User';
import VoterInfo from './VoterInfo';
import Barangay from './Barangay';
import Politics from './Politics';
import Leader from './Leader';
import HeadHousehold from './HeadHousehold';
import HouseholdWarding from './HouseholdWarding';
import VoterImage from './VoterImage';
import VoterContactNumber from './VoterContactNumber';
import Congressman from './Congressman';
import Governor from './Governor';
import Mayor from './Mayor';
import ViceGovernor from './ViceGovernor';

// Export all models
export {
  User,
  VoterInfo,
  Barangay,
  Politics,
  Leader,
  HeadHousehold,
  HouseholdWarding,
  VoterImage,
  VoterContactNumber,
  Congressman,
  Governor,
  Mayor,
  ViceGovernor
};

// Export model associations
export const setupAssociations = () => {
  // Define associations between models here if needed
  // These associations will be implemented in the future
  
  // Example associations:
  // VoterInfo.belongsTo(Barangay, { foreignKey: 'barangayId' });
  // Barangay.hasMany(VoterInfo, { foreignKey: 'barangayId' });
  
  // HeadHousehold.belongsTo(VoterInfo, { foreignKey: 'fh_v_id', as: 'HeadVoter' });
  // VoterInfo.hasOne(HeadHousehold, { foreignKey: 'fh_v_id', as: 'HouseholdHead' });
  
  // HouseholdWarding.belongsTo(HeadHousehold, { foreignKey: 'fh_v_id' });
  // HeadHousehold.hasMany(HouseholdWarding, { foreignKey: 'fh_v_id', as: 'HouseholdMembers' });
  
  // HouseholdWarding.belongsTo(VoterInfo, { foreignKey: 'mem_v_id', as: 'MemberVoter' });
  // VoterInfo.hasMany(HouseholdWarding, { foreignKey: 'mem_v_id', as: 'MemberOf' });
  
  // Leader.belongsTo(VoterInfo, { foreignKey: 'v_id' });
  // VoterInfo.hasMany(Leader, { foreignKey: 'v_id' });
  
  // Politics.belongsTo(VoterInfo, { foreignKey: 'v_id' });
  // VoterInfo.hasOne(Politics, { foreignKey: 'v_id' });
  
  // VoterImage.belongsTo(VoterInfo, { foreignKey: 'v_id' });
  // VoterInfo.hasMany(VoterImage, { foreignKey: 'v_id' });
  
  // VoterContactNumber.belongsTo(VoterInfo, { foreignKey: 'v_id' });
  // VoterInfo.hasMany(VoterContactNumber, { foreignKey: 'v_id' });
  
  // New associations for the political position models
  // Politics.belongsTo(Congressman, { foreignKey: 'congressman' });
  // Congressman.hasMany(Politics, { foreignKey: 'congressman' });
  
  // Politics.belongsTo(Governor, { foreignKey: 'governor' });
  // Governor.hasMany(Politics, { foreignKey: 'governor' });
  
  // Politics.belongsTo(Mayor, { foreignKey: 'mayor' });
  // Mayor.hasMany(Politics, { foreignKey: 'mayor' });
  
  // Politics.belongsTo(ViceGovernor, { foreignKey: 'vicegov' });
  // ViceGovernor.hasMany(Politics, { foreignKey: 'vicegov' });
}; 