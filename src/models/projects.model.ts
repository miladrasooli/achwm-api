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

export enum ProjectStatusEnum {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum ProjectPurposeEnum {
  INDIV_STRENGTH_ASSESSMENT = 'Individal Strength-Based Assessment',
  TRIAGE = 'Triage and Case Management',
  POP_HEALTH_ASSESSMENT = 'Population Health Assessment',
  PROGRAM_EVALUATION = 'Program Evaluation',
  ACADEMIC_RESEARCH = 'Academic or Scientific Research',
  OTHER = 'Other',
}

// See docs for using sequelize with Typescript
// https://sequelize.org/docs/v6/other-topics/typescript/
export class Project extends Model<InferAttributes<Project>, InferCreationAttributes<Project>> {
  declare id: CreationOptional<typeof DataTypes.UUID>
  declare community_id: typeof DataTypes.UUID
  declare name: string
  declare description: string
  declare purpose: ProjectPurposeEnum[]
  declare number_of_participants: string
  declare status: ProjectStatusEnum
  declare redcap_token: CreationOptional<string>
  declare redcap_template_id: typeof DataTypes.UUID
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const projects = <DBModelStatic<Project>>sequelizeClient.define('projects', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    community_id: {
      type: DataTypes.UUID,
      references: {
        model: 'communities',
        key: 'id',
      },
      unique: 'community_name_unique',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'community_name_unique',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    purpose: {
      type: DataTypes.ARRAY(DataTypes.ENUM({ values: Object.values(ProjectPurposeEnum) })),
      allowNull: false,
    },
    number_of_participants: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM({ values: Object.values(ProjectStatusEnum) }),
      allowNull: false,
      defaultValue: ProjectStatusEnum.ACTIVE,
    },
    redcap_token: {
      type: DataTypes.STRING,
    },
    redcap_template_id: {
      type: DataTypes.UUID,
      references: {
        model: 'redcap-templates',
        key: 'id',
      },
    },
  })

  // eslint-disable-next-line no-unused-vars
  projects.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/

    const { communities, datasets, participants, users } = models

    projects.belongsTo(communities, {
      foreignKey: 'community_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })

    projects.belongsTo(models['redcap-templates'], {
      foreignKey: 'redcap_template_id',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })

    projects.belongsToMany(users, {
      through: models['users-projects'],
      foreignKey: 'project_id',
    })

    projects.hasMany(datasets, {
      foreignKey: 'project_id',
    })
  }

  return projects
}
