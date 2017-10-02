export default (sequelize, DataTypes) => {
  const LocalAuth = sequelize.define('local_auth', {
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    password: {
      type: DataTypes.STRING
    }
  });

  LocalAuth.associate = models => {
    // 1 to many with board
    LocalAuth.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return LocalAuth;
};
