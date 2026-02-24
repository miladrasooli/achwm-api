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

export enum CommunityStatusEnum {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
}

// See docs for using sequelize with Typescript
// https://sequelize.org/docs/v6/other-topics/typescript/
export class Community extends Model<InferAttributes<Community>, InferCreationAttributes<Community>> {
  declare id: CreationOptional<typeof DataTypes.UUID>
  declare name: string
  declare area: string
  declare license_expiry: CreationOptional<Date>
  declare type: CreationOptional<string>
  declare status: CommunityStatusEnum
  declare share_name: boolean
  declare contact_id: CreationOptional<typeof DataTypes.UUID>
  declare platform_license_document_link: CreationOptional<string>
  declare data_stewardship_document_link: CreationOptional<string>
  declare redcap_server_id: CreationOptional<typeof DataTypes.UUID>
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const communities = <DBModelStatic<Community>>sequelizeClient.define('communities', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    area: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    license_expiry: {
      type: DataTypes.DATEONLY,
    },
    type: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM({ values: Object.values(CommunityStatusEnum) }),
      defaultValue: CommunityStatusEnum.PENDING,
      allowNull: false,
    },
    share_name: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    contact_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    platform_license_document_link: {
      type: DataTypes.STRING,
    },
    data_stewardship_document_link: {
      type: DataTypes.STRING,
    },
    redcap_server_id: {
      type: DataTypes.UUID,
      references: {
        model: 'redcap-servers',
        key: 'id',
      },
    },
  })

  // eslint-disable-next-line no-unused-vars
  communities.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/

    const { users } = models
    const redcapServers = models['redcap-servers']

    communities.belongsToMany(users, {
      through: models['admins-communities'],
      foreignKey: 'community_id',
    })

    communities.belongsTo(users, {
      foreignKey: 'contact_id',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })

    communities.belongsTo(redcapServers, {
      foreignKey: 'redcap_server_id',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
  }

  return communities
}
