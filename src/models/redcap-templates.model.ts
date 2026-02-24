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

export class RedcapTemplate extends Model<InferAttributes<RedcapTemplate>, InferCreationAttributes<RedcapTemplate>> {
  declare id: CreationOptional<typeof DataTypes.UUID>
  declare redcap_server_id: typeof DataTypes.UUID
  declare name: string
  declare token: string
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const redcapTemplates = <DBModelStatic<RedcapTemplate>>sequelizeClient.define('redcap-templates', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    redcap_server_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'redcap-servers',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      unique: {
        name: 'server_template',
        msg: 'Template name has already been used',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'server_template',
        msg: 'Template name has already been used',
      },
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  })

  // eslint-disable-next-line no-unused-vars
  redcapTemplates.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/

    redcapTemplates.belongsTo(models['redcap-servers'], {
      foreignKey: 'redcap_server_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
  }

  return redcapTemplates
}
