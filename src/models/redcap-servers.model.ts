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

export class RedcapServer extends Model<InferAttributes<RedcapServer>, InferCreationAttributes<RedcapServer>> {
  declare id: CreationOptional<typeof DataTypes.UUID>
  declare name: string
  declare server_url: string
  declare supertoken: string
  declare is_default: boolean
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const redcapServers = <DBModelStatic<RedcapServer>>sequelizeClient.define('redcap-servers', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'name',
        msg: 'This server name has already been used.',
      },
    },
    server_url: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'server_url',
        msg: 'This server URL has already been used.',
      },
    },
    supertoken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  })

  // eslint-disable-next-line no-unused-vars
  redcapServers.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
    const redcapServers = models['redcap-servers']
    const { communities } = models

    redcapServers.hasMany(communities, {
      foreignKey: 'redcap_server_id',
    })

    redcapServers.hasMany(models['redcap-templates'], {
      foreignKey: 'redcap_server_id',
    })
  }

  return redcapServers
}
