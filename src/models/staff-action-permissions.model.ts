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

export class StaffActionPermission extends Model<
  InferAttributes<StaffActionPermission>,
  InferCreationAttributes<StaffActionPermission>
> {
  declare id: CreationOptional<typeof DataTypes.UUID>
  declare user_id: typeof DataTypes.UUID
  declare action_id: typeof DataTypes.UUID
  declare granted_by: CreationOptional<typeof DataTypes.UUID>
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const staffActionPermissions = <DBModelStatic<StaffActionPermission>>sequelizeClient.define(
    'staff-action-permissions',
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
        unique: 'staff_action_permissions_unique',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      action_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'staff-actions',
          key: 'id',
        },
        unique: 'staff_action_permissions_unique',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      granted_by: {
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
    },
  )

  // eslint-disable-next-line no-unused-vars
  staffActionPermissions.associate = function (models) {
    const { users } = models

    staffActionPermissions.belongsTo(users, {
      foreignKey: 'user_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })

    staffActionPermissions.belongsTo(models['staff-actions'], {
      foreignKey: 'action_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })

    staffActionPermissions.belongsTo(users, {
      as: 'granter',
      foreignKey: 'granted_by',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
  }

  return staffActionPermissions
}
