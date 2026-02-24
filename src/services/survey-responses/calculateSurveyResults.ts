import { Id } from '@feathersjs/feathers'

import { Application } from '../../declarations'
//import { RiskEnum, SurveyResponse, SurveyStatusEnum } from '../../models/survey-responses.model'

enum CategoryEnum {
  EMOTIONAL = 'E',
  MENTAL = 'M',
  PHYSICAL = 'P',
  SPIRITUAL = 'S',
}

enum QuestionType {
  MULTIPLE_CHOICE = 'multipleChoice',
}

enum FlagEnum {
  YELLOW = 'Yellow',
  RED = 'Red',
  SKIPPED = 'Skipped',
}

type Choice = {
  value: number
  text: string
  flag?: FlagEnum
}

// Proportion of survey that needs to be completed in order to calculate certain results
const SURVEY_COMPLETION_THRESHOLD = 0.75

/**
 * This function needs to be kept up to date with calculateSurveyResults() function
 * in app/src/contexts/surveyContext
 *
 * Several of the values calculated in the original calculateSurveyResults() function
 * are for REDCap only, and don't need to be calculated here.
 */
const calculateSurveyResults = async (/*app: Application, surveyResponse: SurveyResponse*/) => {
  // Get survey questions
  /*const surveyQuestions = (await app.service('surveys').get(surveyResponse.survey_id)).form.questions

  // Calculate survey results
  const { data } = surveyResponse
  const { responses, flags } = data

  const newFlags: { [key: string]: any } = {}
  const scoreInformation = {
    [CategoryEnum.EMOTIONAL]: {
      numberOfQuestions: 0,
      numberOfQuestionsAnswered: 0,
      totalPossibleScore: 0,
      score: 0,
      finalScore: null,
    },
    [CategoryEnum.MENTAL]: {
      numberOfQuestions: 0,
      numberOfQuestionsAnswered: 0,
      totalPossibleScore: 0,
      score: 0,
      finalScore: null,
    },
    [CategoryEnum.PHYSICAL]: {
      numberOfQuestions: 0,
      numberOfQuestionsAnswered: 0,
      totalPossibleScore: 0,
      score: 0,
      finalScore: null,
    },
    [CategoryEnum.SPIRITUAL]: {
      numberOfQuestions: 0,
      numberOfQuestionsAnswered: 0,
      totalPossibleScore: 0,
      score: 0,
      finalScore: null,
    },
  }

  for (const question of surveyQuestions) {
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      const scoreInfoObj = scoreInformation[question.category as CategoryEnum]

      // Count questions of each type
      scoreInfoObj.numberOfQuestions++

      // Process skipped questions
      if (responses[question.id] == undefined) {
        // Add skipped flag, if necessary
        if (!flags[question.id]) {
          let hasFlag = false
          for (const choice of question.choices) {
            if (choice.flag) {
              hasFlag = true
              break
            }
          }

          if (hasFlag) {
            newFlags[question.id] = FlagEnum.SKIPPED
          }
        }
      } else {
        // Score unskipped questions
        scoreInfoObj.numberOfQuestionsAnswered++

        scoreInfoObj.totalPossibleScore += Math.max(...question.choices.map((c: Choice) => c.value))

        scoreInfoObj.score += question.choices[responses[question.id]].value
      }
    }
  }

  // Finish calculating scores
  const finalScores: Partial<{ [key in CategoryEnum | 'summary']: number }> = {}

  for (const category of Object.values(CategoryEnum)) {
    const scoreObj = scoreInformation[category]
    const { numberOfQuestions, numberOfQuestionsAnswered, totalPossibleScore, score } = scoreObj

    // Don't calculate score if < 75% of questions in this category were answered
    if (numberOfQuestionsAnswered / numberOfQuestions < SURVEY_COMPLETION_THRESHOLD) {
      continue
    }

    finalScores[category] = Math.round((score / totalPossibleScore) * 100)
  }

  // Calculate summary score
  const finalScoreValues = Object.values(finalScores)
  if (finalScoreValues.length > 0) {
    finalScores.summary = Math.round(finalScoreValues.reduce((acc, curr) => acc + curr, 0) / finalScoreValues.length)
  }

  // Calculate potential risk
  const mergedFlags = { ...flags, ...newFlags }

  let flagScore = 0
  for (const flag of Object.values(mergedFlags)) {
    if ((flag as any as FlagEnum) === FlagEnum.RED) {
      flagScore += 2
    } else if ((flag as any as FlagEnum) === FlagEnum.YELLOW) {
      flagScore += 1
    }

    if (flagScore >= 2) {
      break
    }
  }

  // Get total percentage of skipped questions
  const scoreInformationValues = Object.values(scoreInformation)
  const totalNumberOfAnsweredQuestions = scoreInformationValues.reduce(
    (acc, curr) => acc + curr.numberOfQuestionsAnswered,
    0,
  )
  const totalNumberOfMultipleChoiceQuestions = scoreInformationValues.reduce(
    (acc, curr) => acc + curr.numberOfQuestions,
    0,
  )

  let potentialRisk: RiskEnum
  if (flagScore >= 2) {
    potentialRisk = RiskEnum.YES
  } else {
    // If less than 75% of questions answered, risk is inconclusive
    if (totalNumberOfAnsweredQuestions / totalNumberOfMultipleChoiceQuestions < SURVEY_COMPLETION_THRESHOLD) {
      potentialRisk = RiskEnum.UNKNOWN
    } else {
      potentialRisk = RiskEnum.NO
    }
  }

  // Patch results
  const result = await app.service('survey-responses').patch(surveyResponse.id as any as Id, {
    status: SurveyStatusEnum.COMPLETE,
    scores: finalScores,
    potential_risk: potentialRisk,
    data: {
      responses,
      flags: mergedFlags,
    },
  })

  return result
  */
}

export default calculateSurveyResults
