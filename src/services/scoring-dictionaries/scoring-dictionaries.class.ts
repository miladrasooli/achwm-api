import axios from 'axios'

import { Application } from '../../declarations'
import {
  FlagEnum,
  Forms,
  getRedcapCredentials,
  HEADERS,
  OPTION_COMPONENT_DELIMITER,
  OPTION_DELIMITER,
  SCORING_CATEGORIES,
} from '../redcap/redcapUtils'

type AnswersMap = {
  [key: string]: {
    score: number
    flag: FlagEnum | null
  }
}

type ScoreKey = {
  category: (typeof SCORING_CATEGORIES)[number]
  answers: AnswersMap
  max_score: number
  has_flags: boolean
}

type ScoringDictionary = {
  id: string
  [key: string]: ScoreKey | string
}

export class ScoringDictionaries {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async get(project_id: string) {
    const { url, token } = await getRedcapCredentials(project_id, this.app)

    // Get data dictionary
    const dataDictionary = (
      await axios.post(
        url,
        {
          token,
          content: 'metadata',
          format: 'json',
          forms: [Forms.MULTIPLE_CHOICE],
        },
        HEADERS,
      )
    ).data

    const scoringDictionary: ScoringDictionary = { id: project_id }
    for (const question of dataDictionary) {
      const scoreKey: Partial<ScoreKey> = {}
      const { field_name, field_note, select_choices_or_calculations } = question

      // Find scoring category
      for (const category of SCORING_CATEGORIES) {
        if (field_note.includes(category)) {
          scoreKey.category = category
          break
        }
      }

      if (!scoreKey.category) {
        continue
      }

      // Calculate scores for answers
      const answers: AnswersMap = {}
      const options = select_choices_or_calculations.split(OPTION_DELIMITER)

      for (const option of options) {
        let [index, _, score, flag] = option.split(OPTION_COMPONENT_DELIMITER).map((o: string) => o.trim())

        score = Number(score)
        flag = Number(flag)

        if (!scoreKey.max_score || score > scoreKey.max_score) {
          scoreKey.max_score = score
        }

        if (flag) {
          scoreKey.has_flags = true
        }

        answers[index] = {
          score,
          flag,
        }
      }

      scoreKey.answers = answers
      scoringDictionary[field_name] = scoreKey as ScoreKey
    }

    return scoringDictionary
  }
}
