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

export enum AccessLevelEnum {
  PROFILE = 4,
  FULL = 3,
  PARTIAL = 2,
  LIMITED = 1,
}

enum ActiveStatusEnum {
  ACTIVE = 'Active',
  DEACTIVATED = 'Deactivated',
}

// See docs for using sequelize with Typescript
// https://sequelize.org/docs/v6/other-topics/typescript/
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<typeof DataTypes.UUID> // Can be omitted when creating new instances
  declare email: string
  declare password: string
  declare previous_passwords: Array<string>
  declare access_level: AccessLevelEnum
  declare first_name: string
  declare last_name: string
  declare phone_number: CreationOptional<string>
  declare country: string
  declare area: string
  declare city: string
  declare how_did_you_hear_about_us: CreationOptional<string>
  declare organization_name: string
  declare organization_type: string
  declare organization_title: string
  declare is_subscribed_to_emails: boolean
  declare unsubscribe_token: typeof DataTypes.UUID
  declare is_superadmin: boolean
  declare active_status: ActiveStatusEnum
  declare last_login: Date
  declare isVerified: CreationOptional<boolean>
  declare verifyToken: CreationOptional<string>
  declare verifyExpires: CreationOptional<Date>
  declare resetToken: CreationOptional<string>
  declare resetExpires: CreationOptional<Date>
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const users = <DBModelStatic<User>>sequelizeClient.define('users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    previous_passwords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    access_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: AccessLevelEnum.FULL,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING,
    },
    country: {
      type: DataTypes.ENUM({
        values: ['Canada', 'United States of America', 'Turtle Island', 'Other'],
      }),
      allowNull: false,
    },
    area: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    how_did_you_hear_about_us: {
      type: DataTypes.STRING,
    },
    organization_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    organization_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    organization_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_subscribed_to_emails: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    unsubscribe_token: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
    },
    is_superadmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    active_status: {
      type: DataTypes.ENUM({
        values: Object.values(ActiveStatusEnum),
      }),
      allowNull: false,
      defaultValue: ActiveStatusEnum.ACTIVE,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
    },
    verifyToken: {
      type: DataTypes.STRING,
    },
    verifyExpires: {
      type: DataTypes.DATE,
    },
    resetToken: {
      type: DataTypes.STRING,
    },
    resetExpires: {
      type: DataTypes.DATE,
    },
  })

  // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
  users.associate = function (models): void {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
    const { emails, communities, projects } = models

    users.hasMany(emails, {
      foreignKey: 'user_id',
    })

    users.belongsToMany(communities, {
      through: models['admins-communities'],
      foreignKey: 'user_id',
    })

    users.belongsToMany(projects, {
      through: models['users-projects'],
      foreignKey: 'user_id',
    })
  }

  return users
}
