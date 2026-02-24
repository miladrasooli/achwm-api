import axios from 'axios'
import { get } from 'lodash'

import { Application } from '../../declarations'
import {
  FIELD_NOTE_DELIMITER,
  Forms,
  getRedcapCredentials,
  HEADERS,
  OPTION_COMPONENT_DELIMITER,
  OPTION_DELIMITER,
  QUESTION_REGEX,
  Settings,
  VERSION_DELIMITER,
} from '../redcap/redcapUtils'

const TEXT_VERSION_ANNOTATION = /@p1000lang{(.*)}/
const CHOICES_VERSION_ANNOTATION = /@p1000answers{(.*)}/

type Question = {
  id: string
  text: string
  type: 'multipleChoice' | 'shortAnswer'
  choices?: {
    [key: string]: string
  }
}

export class Surveys {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  /**
   * Returns a list of the available survey option configurations. Eg:
   * [
   *   {
   *     param_1: option_1,
   *     param_2: option_2,
   *     param_3: option_3
   *   },
   *   ...
   * ]
   */
  async find(params: { query: { project_id: string; options?: boolean } }) {
    const { project_id, options } = params.query
    const { url, token } = await getRedcapCredentials(project_id, this.app)

    const settings = (
      await axios.post(
        url,
        {
          token,
          content: 'metadata',
          format: 'json',
          forms: [Forms.SETTINGS],
        },
        HEADERS,
      )
    ).data

    const surveyOptions = await this._findOptions(settings)

    if (options) {
      return surveyOptions
    }

    return await this._findAll(url, token, surveyOptions)
  }

  async _findOptions(settings: { field_name: string; select_choices_or_calculations: string; field_label: string }[]) {
    let surveyIdentifiers: string[]
    let surveyVersions
    for (const setting of settings) {
      const { field_name, select_choices_or_calculations, field_label } = setting

      if (field_name === Settings.ORDER) {
        surveyIdentifiers = field_label.split(FIELD_NOTE_DELIMITER).map((f: string) => f.trim())
      } else if (field_name === Settings.VERSION) {
        surveyVersions = select_choices_or_calculations.split(OPTION_DELIMITER).map((option: string) => {
          const [_, optionName] = option.split(OPTION_COMPONENT_DELIMITER).map((o: string) => o.trim())
          return optionName
        })
      }
    }

    const surveyOptions = (surveyVersions as any).map((surveyVersion: string) => {
      const surveyVersionComponents = surveyVersion.split(VERSION_DELIMITER).map((s: string) => s.trim())
      const optionObject = {} as any
      for (const [index, component] of surveyVersionComponents.entries()) {
        optionObject[surveyIdentifiers[index]] = component
      }
      return optionObject
    })

    return surveyOptions
  }

  async _findAll(url: string, token: string, surveyOptions: { [key: string]: any }[]) {
    const dataDictionary = (
      await axios.post(
        url,
        {
          token,
          content: 'metadata',
          format: 'json',
          forms: [Forms.MULTIPLE_CHOICE, Forms.DESCRIPTIVE_ANSWERS],
        },
        HEADERS,
      )
    ).data

    for (const surveyOption of surveyOptions) {
      const version = Object.values(surveyOption).join(VERSION_DELIMITER)
      surveyOption.form = this._generateSurveyForm(dataDictionary, version)
    }

    return surveyOptions
  }

  // Returns the form for a specific survey
  async get(version: string, params: { query: { project_id: string } }) {
    const projectId = get(params, 'query.project_id')
    const { url, token } = await getRedcapCredentials(projectId, this.app)

    version = decodeURIComponent(version)

    const dataDictionary = (
      await axios.post(
        url,
        {
          token,
          content: 'metadata',
          format: 'json',
          forms: [Forms.MULTIPLE_CHOICE, Forms.DESCRIPTIVE_ANSWERS],
        },
        HEADERS,
      )
    ).data

    return this._generateSurveyForm(dataDictionary, version)
  }

  _generateSurveyForm(dataDictionary: any, version?: string) {
    const surveyForm = []
    for (const question of dataDictionary) {
      const { field_name, form_name, field_label, select_choices_or_calculations, field_annotation } = question

      // Only process questions that have field names that look like q000
      if (!QUESTION_REGEX.test(field_name)) {
        continue
      }

      const questionObject: Partial<Question> = {
        id: field_name,
      } as any

      // Find question type
      const isMultipleChoice = form_name === Forms.MULTIPLE_CHOICE
      if (isMultipleChoice) {
        questionObject.type = 'multipleChoice'
      } else {
        questionObject.type = 'shortAnswer'
      }

      if (version) {
        try {
          const textVersionsMatch = field_annotation.match(TEXT_VERSION_ANNOTATION)
          if (textVersionsMatch) {
            const textVersions = JSON.parse(`{${textVersionsMatch[1]}}`)
            questionObject.text = textVersions[version]
          }
        } catch {
          // Execute fallback
        }

        if (isMultipleChoice) {
          try {
            const choicesVersionsMatch = field_annotation.match(CHOICES_VERSION_ANNOTATION)
            if (choicesVersionsMatch) {
              const choiceVersions = JSON.parse(`{${choicesVersionsMatch[1]}}`)
              questionObject.choices = choiceVersions[version]
            }
          } catch {
            // Execute fallback
          }
        }
      }

      // Fallback for question text and choices
      if (!questionObject.text) {
        questionObject.text = field_label
      }

      if (isMultipleChoice && !questionObject.choices) {
        questionObject.choices = select_choices_or_calculations.split(OPTION_DELIMITER).map((option: string) => {
          const optionComponents = option.split(OPTION_COMPONENT_DELIMITER)
          return optionComponents[1].trim()
        })
      }

      surveyForm.push(questionObject)
    }

    return surveyForm
  }
}
