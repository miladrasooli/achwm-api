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

export class SuperadminTableSetting extends Model<
  InferAttributes<SuperadminTableSetting>,
  InferCreationAttributes<SuperadminTableSetting>
> {
  declare id: CreationOptional<typeof DataTypes.UUID>
  declare user_id: typeof DataTypes.UUID
  declare manage_people: Object
  declare manage_projects: Object
  declare manage_communities: Object
  declare manage_redcap: Object
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const superadminTableSettings = <DBModelStatic<SuperadminTableSetting>>sequelizeClient.define(
    'superadmin-table-settings',
    {
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
      manage_people: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: false,
      },
      manage_projects: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: false,
      },
      manage_communities: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: false,
      },
      manage_redcap: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: false,
      },
    },
  )

  // eslint-disable-next-line no-unused-vars
  superadminTableSettings.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
    const { users } = models

    superadminTableSettings.belongsTo(users, {
      foreignKey: 'user_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
  }

  return superadminTableSettings
}
