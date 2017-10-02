export default (sequelize, DataTypes) => {
  const Board = sequelize.define("board", {
    name: DataTypes.STRING
  });

  Board.associate = models => {
    Board.hasMany(models.Suggestion, {
      foreignKey: "boardId"
    });
  };

  return Board;
};
