// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  ModelStatic,
  Sequelize,
} from 'sequelize'

import { Application, DBModelStatic } from '../declarations'

export class AdminCommunity extends Model<InferAttributes<AdminCommunity>, InferCreationAttributes<AdminCommunity>> {
  declare id: CreationOptional<typeof DataTypes.UUID>
  declare user_id: typeof DataTypes.UUID
  declare community_id: typeof DataTypes.UUID
  declare is_first_login: boolean
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const adminsCommunities = <DBModelStatic<AdminCommunity>>sequelizeClient.define('admins-communities', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      unique: true,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    community_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'communities',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    is_first_login: {
      type: DataTypes.BOOLEAN,
    },
  })

  // eslint-disable-next-line no-unused-vars
  adminsCommunities.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
    const { users, communities } = models

    adminsCommunities.belongsTo(users, {
      foreignKey: 'user_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })

    adminsCommunities.belongsTo(communities, {
      foreignKey: 'community_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
  }

  return adminsCommunities
}
