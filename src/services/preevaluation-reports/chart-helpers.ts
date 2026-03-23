import { capitalize, countBy, compact, get, startCase } from 'lodash'
import { max, min, sum } from 'simple-statistics'

import createTable from './charts/table'

import { PronounsEnum } from '../participants/participants.class'
import { Forms, OPTION_COMPONENT_DELIMITER, OPTION_DELIMITER, Outcome } from '../redcap/redcapUtils'
import createPieChart from './charts/pie-chart'
import createBalancePieChart from './charts/balance-pie-chart'
import createHistogram from './charts/histogram'
import createBoxPlot from './charts/box-plot'

export const COLORS = ['#ADADAD', '#869B74', '#D08D63', '#5DA0B3', '#9D7DAE', '#E0B24A']
export const STROKE_COLORS = ['#5B5B5B', '#485639', '#6f4A32', '#2D5968', '#543F61']
const YOUNG_OLD_THRESHOLD = 14
const MAX_TABLE_ROWS_ON_PAGE = 23
export const FONT_SIZE = 15

export const createParticipantCharacteristicsTable = (uniqueParticipants: { age: number; pronouns: string }[]) => {
  // Calculate participant data
  let totalAge = 0
  let youngCount = 0
  let oldCount = 0
  let boyCount = 0
  let girlCount = 0
  let otherCount = 0
  for (const participant of uniqueParticipants) {
    const { age, pronouns } = participant
    totalAge += age
    if (age < YOUNG_OLD_THRESHOLD) {
      youngCount++
    } else {
      oldCount++
    }

    if (pronouns === PronounsEnum.HE_HIM) {
      boyCount++
    } else if (pronouns === PronounsEnum.SHE_HER) {
      girlCount++
    } else {
      otherCount++
    }
  }

  // Calculate table contents
  const tableContents = [
    ['Number of Participants', uniqueParticipants.length],
    ['Average participant age', Math.round((totalAge / uniqueParticipants.length) * 100) / 100],
    [`Number of young participants (≤ ${YOUNG_OLD_THRESHOLD - 1})`, youngCount],
    [`Number of older participants (≥ ${YOUNG_OLD_THRESHOLD})`, oldCount],
    ['Number of boys', boyCount],
    ['Number of girls', girlCount],
    ['Gender unspecified', otherCount],
  ]

  return createTable(tableContents)
}

export const createParticipantCharacteristicsHistogram = async (uniqueParticipants: { age: number }[]) => {
  const ages = uniqueParticipants.map((p) => Math.floor(p.age))
  const minAge = min(ages)
  const maxAge = max(ages)
  const ageCount = countBy(ages)

  const histogramData = []
  let ageIndex = minAge
  while (ageIndex <= maxAge) {
    histogramData.push({
      'Age Distribution of Participants': String(ageIndex),
      Quantity: ageCount[ageIndex] || 0,
    })
    ageIndex++
  }

  return await createHistogram(histogramData, COLORS[3], false)
}

export const createLocationsTable = (locationCount: { [key: string]: number }) => {
  const total = sum(Object.values(locationCount))

  // Calculate table contents
  const locations = Object.keys(locationCount)
  const tableContents: (string | number)[][] = [['Location', '#', '%']]

  for (const location of locations) {
    tableContents.push([
      startCase(location),
      locationCount[location],
      Math.round((locationCount[location] / total) * 100),
    ])
  }

  tableContents.push(['Total', total, 100])

  return createTable(tableContents, { header: true, footer: true })
}

export const createLocationsPieChart = async (locationCount: { [key: string]: number }) => {
  let colorIndex = 0
  const locations = Object.keys(locationCount)
  const locationObjs = []

  for (const location of locations) {
    locationObjs.push({
      category: location,
      value: locationCount[location],
      color: COLORS[colorIndex],
    })
    colorIndex++
  }

  const pieChart = await createPieChart(locationObjs)
  return pieChart
}

export const createGlobalHealthRatingsTable = (globalHealthRatingsCount: { [key: string]: number }) => {
  // Calculate table contents
  const total = sum(Object.values(globalHealthRatingsCount))

  const tableContents: (string | number)[][] = [['GHR', '#', '%']]
  for (const option of Object.keys(globalHealthRatingsCount)) {
    tableContents.push([
      option,
      globalHealthRatingsCount[option] || 0,
      Math.round((globalHealthRatingsCount[option] / total) * 100) || 0,
    ])
  }
  tableContents.push(['Total', total, 100])

  return createTable(tableContents, { header: true, footer: true })
}

export const createGlobalHealthRatingsPieChart = async (globalHealthRatingsCount: { [key: string]: number }) => {
  const pieChartData = []

  let index = 0
  for (const option of Object.keys(globalHealthRatingsCount)) {
    pieChartData.push({
      category: option,
      value: globalHealthRatingsCount[option] || 0,
      color: COLORS[index],
    })
    index++
  }

  return await createPieChart(pieChartData)
}

export const createScoresByQuadrantTable = (summaryOfScoresByQuadrant: {
  [key: string]: { mean: number; sd: number }
}) => {
  const tableContents: (string | number)[][] = [['Quadrant', 'avg', 'sd']]

  for (const [scoreCategory, scoreObj] of Object.entries(summaryOfScoresByQuadrant)) {
    tableContents.push([startCase(scoreCategory), scoreObj.mean as number, scoreObj.sd as number])
  }

  return createTable(tableContents, { header: true })
}

export const createScoresByQuadrantBoxPlot = async (summaryOfScoresByQuadrant: {
  [key: string]: { mean: number; sd: number; q1: number; med: number; q3: number; max: number; min: number }
}) => {
  let colorIndex = 0
  const boxPlotData = Object.entries(summaryOfScoresByQuadrant).map(([key, values]) => {
    const label = startCase(key.split('_')[0])
    return {
      label,
      category: label,
      ...values,
      color: COLORS[colorIndex],
      strokeColor: STROKE_COLORS[colorIndex++],
    }
  })

  return await createBoxPlot(boxPlotData)
}

export const createSpiritualHistogram = async (scoresByQuadrant: { [key: string]: number[] }) => {
  return await createScoreHistogramHelper(
    scoresByQuadrant[Outcome.SPIRITUAL_SCORE],
    startCase(Outcome.SPIRITUAL_SCORE),
    COLORS[1],
  )
}
export const createEmotionalHistogram = async (scoresByQuadrant: { [key: string]: number[] }) => {
  return await createScoreHistogramHelper(
    scoresByQuadrant[Outcome.EMOTIONAL_SCORE],
    startCase(Outcome.EMOTIONAL_SCORE),
    COLORS[2],
  )
}
export const createPhysicalHistogram = async (scoresByQuadrant: { [key: string]: number[] }) => {
  return await createScoreHistogramHelper(
    scoresByQuadrant[Outcome.PHYSICAL_SCORE],
    startCase(Outcome.PHYSICAL_SCORE),
    COLORS[3],
  )
}
export const createMentalHistogram = async (scoresByQuadrant: { [key: string]: number[] }) => {
  return await createScoreHistogramHelper(
    scoresByQuadrant[Outcome.MENTAL_SCORE],
    startCase(Outcome.MENTAL_SCORE),
    COLORS[4],
  )
}
export const createSummaryHistogram = async (scoresByQuadrant: { [key: string]: number[] }) => {
  return await createScoreHistogramHelper(
    scoresByQuadrant[Outcome.SUMMARY_SCORE],
    startCase(Outcome.SUMMARY_SCORE),
    COLORS[0],
  )
}

const createScoreHistogramHelper = async (scores: number[], title: string, color: string) => {
  const binCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  for (const score of scores) {
    let binIndex = Math.floor(score / 10)
    if (binIndex === 10) {
      binIndex = 9
    }
    binCount[binIndex]++
  }

  const histogramData = []
  for (const [index, count] of Object.entries(binCount)) {
    histogramData.push({
      [title]: `${Number(index) * 10} - ${(Number(index) + 1) * 10}`,
      Quantity: count,
    })
  }

  return await createHistogram(histogramData, color, true)
}

export const createClinicianAssessmentsPieChart = async (chartData: any) => {
  const { dataDictionary, surveyResponses } = chartData

  // Get all follow up options in right order
  let followUpRecommendationOptions
  for (const entry of dataDictionary) {
    const { field_name, select_choices_or_calculations } = entry

    if (field_name === Outcome.CLINICIAN_ASSESSMENT_RESULT) {
      const optionList = select_choices_or_calculations.split(OPTION_DELIMITER).map((s: string) => s.trim())
      followUpRecommendationOptions = optionList.map((option: string) =>
        option.split(OPTION_COMPONENT_DELIMITER)[1].trim(),
      )
      break
    }
  }

  const recommendationCount: { [key: string]: number } = {}
  for (const option of followUpRecommendationOptions) {
    recommendationCount[option] = 0
  }

  for (const response of surveyResponses) {
    if (response[Outcome.CLINICIAN_ASSESSMENT_RESULT]) {
      recommendationCount[response[Outcome.CLINICIAN_ASSESSMENT_RESULT]]++
    }
  }

  const pieChartData = Object.entries(recommendationCount).map(([option, count], index) => ({
    category: option,
    value: count,
    color: COLORS[index],
  }))

  return await createPieChart(pieChartData)
}

export const createBalanceChart = async (balanceChartData: { [key: string]: { mean: number } }) => {
  let index = 0
  let balancePieChartData = compact(
    Object.entries(balanceChartData).map(([category, obj]) => {
      if (category === Outcome.SUMMARY_SCORE) {
        return null
      }

      return {
        category,
        value: obj.mean,
        index: index,
        color: COLORS[++index],
      }
    }),
  )

  return await createBalancePieChart(balancePieChartData)
}

const POSITIVE = 'positive'
const NEGATIVE = 'negative'
const POSITIVE_THRESHOLD = 4
const NEGATIVE_THRESHOLD = 3

export const createPositiveQuestionsTables = (chartData: any) => {
  // Find positive questions
  const { dataDictionary, surveyResponses } = chartData
  const questions = getChartQuestionsHelper(dataDictionary, POSITIVE)

  // Get separate table for different blocks of questions
  let questionsAdded = 0
  const returnCharts = []
  while (questionsAdded < questions.length) {
    const startIndex = questionsAdded
    questionsAdded += MAX_TABLE_ROWS_ON_PAGE
    const stopIndex = Math.min(questionsAdded, questions.length)

    returnCharts.push(questionsChartHelper(questions.slice(startIndex, stopIndex), surveyResponses, POSITIVE_THRESHOLD))
  }

  return returnCharts
}

export const createNegativeQuestionsTables = (chartData: any) => {
  // Find negative questions
  const { dataDictionary, surveyResponses } = chartData
  const questions = getChartQuestionsHelper(dataDictionary, NEGATIVE)

  // Get separate table for different blocks of questions
  let questionsAdded = 0
  const returnCharts = []
  while (questionsAdded < questions.length) {
    const startIndex = questionsAdded
    questionsAdded += MAX_TABLE_ROWS_ON_PAGE
    const stopIndex = Math.min(questionsAdded, questions.length)

    returnCharts.push(questionsChartHelper(questions.slice(startIndex, stopIndex), surveyResponses, NEGATIVE_THRESHOLD))
  }

  return returnCharts
}

const getChartQuestionsHelper = (dataDictionary: any, fieldNoteFinder: string) => {
  const questions: { questionId: string; questionText: string }[] = []

  for (const question of dataDictionary) {
    const { field_name, field_label, field_note } = question
    if (field_note.includes(fieldNoteFinder)) {
      questions.push({ questionId: field_name, questionText: field_label })
    }
  }

  questions.sort((a, b) => a.questionId.localeCompare(b.questionId))

  return questions
}

const questionsChartHelper = (
  questions: { questionId: string; questionText: string }[],
  surveyResponses: { [key: string]: string }[],
  threshold: number,
) => {
  const tableContents: (string | number)[][] = [['Q#', 'Question', '%']]

  for (const question of questions) {
    const { questionId, questionText } = question
    let totalAnswered = 0
    let aboveThreshold = 0
    for (const response of surveyResponses) {
      if (response[questionId]) {
        totalAnswered++
        if (Number(response[questionId]) >= threshold) {
          aboveThreshold++
        }
      }
    }

    tableContents.push([questionId, questionText, Math.round((aboveThreshold / totalAnswered) * 100)])
  }

  return createTable(tableContents, { header: true })
}

export const createShortAnswerQuestionsTables = (chartData: any) => {
  const { dataDictionary, surveyResponses } = chartData

  // Get descriptive questions
  const questions = []
  for (const question of dataDictionary) {
    const { form_name, field_name, field_label } = question
    if (form_name === Forms.DESCRIPTIVE_ANSWERS && !field_name.includes('description')) {
      questions.push({ questionId: field_name, questionText: field_label })
    }
  }

  // Get table for each question
  return questions.flatMap((question) => shortAnswerQuestionTableHelper(question, surveyResponses))
}

const shortAnswerQuestionTableHelper = (
  question: { questionId: string; questionText: string },
  surveyResponses: any,
) => {
  const { questionId, questionText } = question

  // Get answers
  const answers: { [answer: string]: number } = {}
  let totalAnswers = 0
  for (const response of surveyResponses) {
    let answer = get(response, questionId)
    if (answer) {
      answer = answer.trim().toLowerCase()
      // Don't record blank answers
      if (answer.length > 0) {
        if (get(answers, answer)) {
          answers[answer]++
        } else {
          answers[answer] = 1
        }
        totalAnswers++
      }
    }
  }

  // Sort answers
  const answerList = Object.keys(answers).map((answer) => ({ answer, count: answers[answer] }))
  answerList.sort((a, b) => {
    if (a.count === b.count) {
      return a.answer.localeCompare(b.answer)
    }
    return b.count - a.count
  })

  // Transform answers into table
  const pages: { table: string; title: string }[] = []
  const numPages = Math.floor(answerList.length / MAX_TABLE_ROWS_ON_PAGE)

  let pageCount = 0
  while (pageCount <= numPages) {
    const tableContents: (string | number)[][] = [['Answer', '#', '%']]
    let i
    for (
      i = pageCount * MAX_TABLE_ROWS_ON_PAGE;
      i < Math.min((pageCount + 1) * MAX_TABLE_ROWS_ON_PAGE, answerList.length);
      i++
    ) {
      const { answer, count } = answerList[i]
      tableContents.push([capitalize(answer), count, Math.round((count / totalAnswers) * 100)])
    }

    if (i === answerList.length) {
      tableContents.push(['Total', totalAnswers, 100])
    }

    pages.push({
      table: createTable(tableContents, {
        header: true,
        footer: i === answerList.length,
      }),
      title: questionText,
    })

    pageCount++
  }

  return pages
}
