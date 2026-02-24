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

export enum EmailTypeEnum {
  RESET_PASSWORD = 'resetPassword',
  VERIFY_EMAIL = 'verifyEmail',
  INVITE_ADMIN = 'inviteAdmin',
  INVITE_COLLABORATOR = 'inviteCollaborator',
  REQUEST_INVITE = 'requestInvite',
  ENABLE_OFFLINE_MODE = 'enableOfflineMode',
}

// See docs for using sequelize with Typescript
// https://sequelize.org/docs/v6/other-topics/typescript/
export class Email extends Model<InferAttributes<Email>, InferCreationAttributes<Email>> {
  declare id: CreationOptional<string>
  declare user_id: CreationOptional<typeof DataTypes.UUID>
  declare email: string
  declare type: EmailTypeEnum
  declare skipped_sending: CreationOptional<boolean>
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const emails = <DBModelStatic<Email>>sequelizeClient.define('emails', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM({
        values: Object.values(EmailTypeEnum),
      }),
      allowNull: false,
    },
    skipped_sending: {
      type: DataTypes.BOOLEAN,
    },
  })

  // eslint-disable-next-line no-unused-vars
  emails.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
    const { users } = models

    emails.belongsTo(users, {
      foreignKey: 'user_id',
    })
  }

  return emails
}
