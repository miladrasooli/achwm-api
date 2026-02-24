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
import { RoleEnum } from './users-projects.model'

export class Invitation extends Model<InferAttributes<Invitation>, InferCreationAttributes<Invitation>> {
  declare id: CreationOptional<typeof DataTypes.UUID>
  declare project_role: RoleEnum
  declare email: string
  declare invited_user_id: CreationOptional<typeof DataTypes.UUID>
  declare invited_by: typeof DataTypes.UUID
  declare project_id: typeof DataTypes.UUID
  declare community_id: typeof DataTypes.UUID
  declare accepted_at: CreationOptional<Date>
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const invitations = <DBModelStatic<Invitation>>sequelizeClient.define('invitations', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    project_role: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    invited_user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    invited_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      allowNull: false,
    },
    project_id: {
      type: DataTypes.UUID,
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      allowNull: false,
    },
    community_id: {
      type: DataTypes.UUID,
      references: {
        model: 'communities',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      allowNull: false,
    },
    accepted_at: {
      type: DataTypes.DATE,
    },
  })

  // eslint-disable-next-line no-unused-vars
  invitations.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/

    const { users, projects, communities } = models

    invitations.belongsTo(users, {
      foreignKey: 'invited_user_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })

    invitations.belongsTo(users, {
      foreignKey: 'invited_by',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })

    invitations.belongsTo(projects, {
      foreignKey: 'project_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })

    invitations.belongsTo(communities, {
      foreignKey: 'community_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
  }

  return invitations
}
