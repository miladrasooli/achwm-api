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

export class OfflineSession extends Model<InferAttributes<OfflineSession>, InferCreationAttributes<OfflineSession>> {
  declare id: CreationOptional<string>
  declare project_id: string
  declare end_date: Date
  declare collaborators: Object
  declare number_completed_surveys: number
  declare last_sync_date: CreationOptional<Date>
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const offlineSessions = <DBModelStatic<OfflineSession>>sequelizeClient.define('offline-sessions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    collaborators: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    number_completed_surveys: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    last_sync_date: {
      type: DataTypes.DATE,
    },
  })

  // eslint-disable-next-line no-unused-vars
  offlineSessions.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/

    const { projects } = models

    offlineSessions.belongsTo(projects, {
      foreignKey: 'project_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
  }

  return offlineSessions
}
