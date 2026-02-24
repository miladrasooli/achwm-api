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

enum MilestoneTypeEnum {
  SYSTEM = 'System',
  NOTE = 'Note',
}

export class Milestone extends Model<InferAttributes<Milestone>, InferCreationAttributes<Milestone>> {
  declare id: CreationOptional<typeof DataTypes.UUID>
  declare community_id: typeof DataTypes.UUID
  declare project_id: CreationOptional<typeof DataTypes.UUID>
  declare type: MilestoneTypeEnum
  declare message: string
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const milestones = <DBModelStatic<Milestone>>sequelizeClient.define('milestones', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
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
    project_id: {
      type: DataTypes.UUID,
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM({ values: Object.values(MilestoneTypeEnum) }),
      allowNull: false,
      defaultValue: MilestoneTypeEnum.SYSTEM,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  })

  // eslint-disable-next-line no-unused-vars
  milestones.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
    const { communities, projects } = models

    milestones.belongsTo(communities, {
      foreignKey: 'community_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })

    milestones.belongsTo(projects, {
      foreignKey: 'project_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
  }

  return milestones
}
