import { UUID } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'

const generateUUID = (): typeof UUID => uuidv4() as unknown as typeof UUID

export default generateUUID
