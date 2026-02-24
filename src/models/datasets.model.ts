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

enum DatasetStatusEnum {
  ACTIVE = 'Active',
  ARCHIVED = 'Archived',
}

// See docs for using sequelize with Typescript
// https://sequelize.org/docs/v6/other-topics/typescript/
export class Dataset extends Model<InferAttributes<Dataset>, InferCreationAttributes<Dataset>> {
  declare id: CreationOptional<typeof DataTypes.UUID>
  declare name: string
  declare project_id: typeof DataTypes.UUID
  declare status: DatasetStatusEnum
}

export default function (app: Application): ModelStatic<Model> {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const datasets = <DBModelStatic<Dataset>>sequelizeClient.define('datasets', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'name_project_id',
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: 'name_project_id',
      references: {
        model: 'projects',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM({ values: Object.values(DatasetStatusEnum) }),
      defaultValue: DatasetStatusEnum.ACTIVE,
      allowNull: false,
    },
  })

  // eslint-disable-next-line no-unused-vars
  datasets.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/

    const { projects } = models

    datasets.belongsTo(projects, {
      foreignKey: 'project_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
  }

  return datasets
}
