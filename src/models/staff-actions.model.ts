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
import { STAFF_ACTIONS, StaffActionKey } from '../staff-actions'

export class StaffAction extends Model<InferAttributes<StaffAction>, InferCreationAttributes<StaffAction>> {
  declare id: CreationOptional<typeof DataTypes.UUID>
  declare key: StaffActionKey
  declare group: string
  declare label: string
  declare description: CreationOptional<string>
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const staffActions = <DBModelStatic<StaffAction>>sequelizeClient.define('staff-actions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    key: {
      type: DataTypes.ENUM({
        values: Object.values(StaffActionKey),
      }),
      allowNull: false,
      unique: true,
    },
    group: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
  })

  staffActions.afterSync(async () => {
    for (const action of STAFF_ACTIONS) {
      await staffActions.upsert(action)
    }
  })

  // eslint-disable-next-line no-unused-vars
  staffActions.associate = function (models) {
    const { users } = models

    staffActions.belongsToMany(users, {
      through: models['staff-action-permissions'],
      foreignKey: 'action_id',
    })
  }

  return staffActions
}
