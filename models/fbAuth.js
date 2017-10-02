export default (sequelize, DataTypes) => {
  const FbAuth = sequelize.define('fb_auth', {
    fb_id: DataTypes.STRING,
    display_name: DataTypes.STRING
  });

  FbAuth.associate = models => {
    // 1 to many with board
    FbAuth.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return FbAuth;
};
