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

export enum RoleEnum {
  ADMIN = 3,
  COORDINATOR = 2,
  FACILITATOR = 1,
}

export const ROLE_NAMES = {
  [RoleEnum.ADMIN]: 'Admin',
  [RoleEnum.COORDINATOR]: 'Clinician/Coordinator',
  [RoleEnum.FACILITATOR]: 'Facilitator',
}

export class UserProject extends Model<InferAttributes<UserProject>, InferCreationAttributes<UserProject>> {
  declare id: CreationOptional<typeof DataTypes.UUID>
  declare user_id: typeof DataTypes.UUID
  declare project_id: typeof DataTypes.UUID
  declare project_role: RoleEnum
  declare project_pin: string
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const usersProjects = <DBModelStatic<UserProject>>sequelizeClient.define('users-projects', {
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
      unique: 'users_projects_unique',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      unique: 'users_projects_unique',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    project_role: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    project_pin: {
      type: DataTypes.STRING,
    },
  })

  // eslint-disable-next-line no-unused-vars
  usersProjects.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
    const { users, projects } = models

    usersProjects.belongsTo(users, {
      foreignKey: 'user_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })

    usersProjects.belongsTo(projects, {
      foreignKey: 'project_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
  }

  return usersProjects
}
