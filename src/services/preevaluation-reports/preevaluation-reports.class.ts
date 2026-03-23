import { Application } from '../../declarations'

import axios from 'axios'
import dayjs from 'dayjs'
import ejs from 'ejs'
import { uniq } from 'lodash'
import path from 'path'
import puppeteer from 'puppeteer'
import { mean, median, quantile, standardDeviation, min, max } from 'simple-statistics'

import {
  createBalanceChart,
  createClinicianAssessmentsPieChart,
  createEmotionalHistogram,
  createGlobalHealthRatingsPieChart,
  createGlobalHealthRatingsTable,
  createLocationsPieChart,
  createLocationsTable,
  createMentalHistogram,
  createNegativeQuestionsTables,
  createParticipantCharacteristicsHistogram,
  createParticipantCharacteristicsTable,
  createPhysicalHistogram,
  createPositiveQuestionsTables,
  createScoresByQuadrantBoxPlot,
  createScoresByQuadrantTable,
  createShortAnswerQuestionsTables,
  createSpiritualHistogram,
  createSummaryHistogram,
} from './chart-helpers'
import {
  Forms,
  getRedcapCredentials,
  HEADERS,
  Metadata,
  MultipleChoice,
  OPTION_COMPONENT_DELIMITER,
  OPTION_DELIMITER,
  Outcome,
} from '../redcap/redcapUtils'
import { SurveyResponse } from '../survey-responses/survey-responses.class'

export class PreevaluationReports {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async create(data: { project_id: string; dataset_id: string }) {
    const { project_id, dataset_id } = data

    const { reportData, chartData } = await this._prepareData(project_id, dataset_id)
    const charts = await this._createCharts(chartData)
    return await this._renderPdfReport(reportData, charts)
  }

  async _prepareData(project_id: string, dataset_id: string) {
    const project = await this.app.service('projects').get(project_id)

    // Get survey responses
    const surveyResponses = await this.app.service('survey-responses').find({
      query: {
        project_id,
        dataset_id,
      },
    })

    // Get data dictionary for questions
    const { url, token } = await getRedcapCredentials(project_id, this.app)
    const dataDictionary = (
      await axios.post(
        url,
        {
          token,
          content: 'metadata',
          format: 'json',
          forms: [Forms.MULTIPLE_CHOICE, Forms.DESCRIPTIVE_ANSWERS],
          fields: [Outcome.CLINICIAN_ASSESSMENT_RESULT, Metadata.LOCATION],
        },
        HEADERS,
      )
    ).data

    const chartData = { surveyResponses, dataDictionary }
    const reportData = { projectName: project.name }
    return { chartData, reportData }
  }

  async _createCharts(chartData: any) {
    const { dataDictionary, surveyResponses } = chartData

    // Get list of unique participants
    const uniqueParticipantUuids = uniq(surveyResponses.map((sr: SurveyResponse) => sr[Metadata.PARTICIPANT_UUID]))
    const uniqueParticipants = uniqueParticipantUuids.map((uuid) => {
      const participant = surveyResponses
        .filter((sr: SurveyResponse) => sr[Metadata.PARTICIPANT_UUID] === uuid)
        .sort((a: SurveyResponse, b: SurveyResponse) => dayjs(b[Metadata.UPDATED_AT]).diff(a[Metadata.UPDATED_AT]))[0]
      const age = dayjs().diff(
        `${participant[Metadata.BIRTH_MONTH]} 1, ${participant[Metadata.BIRTH_YEAR]}`,
        'year',
        true,
      )
      return {
        age,
        [Metadata.PRONOUNS]: participant[Metadata.PRONOUNS],
      }
    }) as {
      [Metadata.PRONOUNS]: string
      age: number
    }[]

    // Get location options
    let locationOptions
    for (const entry of dataDictionary) {
      if (entry.field_name === Metadata.LOCATION) {
        locationOptions = entry.select_choices_or_calculations
          .split('|')
          .map((segment: string) => segment.split(',')[1].trim())
        break
      }
    }
    // Count locations
    const locationCount: { [key: string]: number } = locationOptions.reduce(
      (acc: { [key: string]: number }, curr: string) => {
        acc[curr] = 0
        return acc
      },
      {},
    )
    for (const surveyResponse of surveyResponses) {
      const location = surveyResponse[Metadata.LOCATION]

      if (location) {
        if (locationCount[location]) {
          locationCount[location]++
        } else {
          locationCount[location] = 1
        }
      }
    }

    // Count global health ratings (Question q000)
    let options
    for (const entry of dataDictionary) {
      if (entry.field_name === MultipleChoice.Q000) {
        options = entry.select_choices_or_calculations
        break
      }
    }
    const optionList = options.split(OPTION_DELIMITER).map((s: string) => s.trim())
    const globalHealthRatingsOptions: { [key: string]: string } = optionList.reduce((acc: any, curr: string) => {
      const [integerValue, stringValue] = curr.split(OPTION_COMPONENT_DELIMITER).map((s: string) => s.trim())
      acc[integerValue] = stringValue
      return acc
    }, {})

    const globalHealthRatingsCount: { [key: string]: number } = {}
    for (const option of Object.values(globalHealthRatingsOptions)) {
      globalHealthRatingsCount[option] = 0
    }

    for (const surveyResponse of surveyResponses) {
      const ghr = surveyResponse[MultipleChoice.Q000]
      if (ghr) {
        globalHealthRatingsCount[globalHealthRatingsOptions[ghr]]++
      }
    }

    // Create summary of scores by quadrant
    const scoresByQuadrant: {
      [key: string]: number[]
    } = {
      [Outcome.SUMMARY_SCORE]: [],
      [Outcome.SPIRITUAL_SCORE]: [],
      [Outcome.EMOTIONAL_SCORE]: [],
      [Outcome.PHYSICAL_SCORE]: [],
      [Outcome.MENTAL_SCORE]: [],
    }
    for (const surveyResponse of surveyResponses) {
      for (const [scoreCategory, scoreList] of Object.entries(scoresByQuadrant)) {
        if (surveyResponse[scoreCategory]) {
          scoreList.push(surveyResponse[scoreCategory])
        }
      }
    }

    const summaryOfScoresByQuadrant: {
      [key: string]: {
        mean: number
        med: number
        q1: number
        q3: number
        sd: number
        min: number
        max: number
      }
    } = {}
    for (const [quadrant, scoreList] of Object.entries(scoresByQuadrant)) {
      if (scoreList.length > 0) {
        summaryOfScoresByQuadrant[quadrant] = {
          mean: Math.round(mean(scoreList)),
          med: Math.round(median(scoreList)),
          q1: quantile(scoreList, 0.25),
          q3: quantile(scoreList, 0.75),
          sd: Math.round(standardDeviation(scoreList)),
          min: min(scoreList),
          max: max(scoreList),
        }
      } else {
        summaryOfScoresByQuadrant[quadrant] = {
          mean: 0,
          med: 0,
          q1: 0,
          q3: 0,
          sd: 0,
          min: 0,
          max: 0,
        }
      }
    }

    // Create positive questions tables
    return {
      participantCharacteristicsTable: createParticipantCharacteristicsTable(uniqueParticipants),
      participantCharacteristicsHistogram: await createParticipantCharacteristicsHistogram(uniqueParticipants),
      locationsTable: createLocationsTable(locationCount),
      locationsPieChart: await createLocationsPieChart(locationCount),
      globalHealthRatingsTable: createGlobalHealthRatingsTable(globalHealthRatingsCount),
      globalHealthRatingsPieChart: await createGlobalHealthRatingsPieChart(globalHealthRatingsCount),
      scoresByQuadrantTable: createScoresByQuadrantTable(summaryOfScoresByQuadrant),
      scoresByQuadrantBoxPlot: await createScoresByQuadrantBoxPlot(summaryOfScoresByQuadrant),
      spiritualHistogram: await createSpiritualHistogram(scoresByQuadrant),
      emotionalHistogram: await createEmotionalHistogram(scoresByQuadrant),
      physicalHistogram: await createPhysicalHistogram(scoresByQuadrant),
      mentalHistogram: await createMentalHistogram(scoresByQuadrant),
      summaryHistogram: await createSummaryHistogram(scoresByQuadrant),
      clinicianAssessmentsPieChart: await createClinicianAssessmentsPieChart(chartData),
      balanceChart: await createBalanceChart(summaryOfScoresByQuadrant),
      positiveQuestionsTables: createPositiveQuestionsTables(chartData),
      negativeQuestionsTables: createNegativeQuestionsTables(chartData),
      shortAnswerQuestionsTables: createShortAnswerQuestionsTables(chartData),
    }
  }

  async _renderPdfReport(reportData: any, charts: any) {
    const html: string = await ejs.renderFile(path.join(__dirname, 'template.ejs'), { ...reportData, ...charts })
    const browser = await puppeteer.launch({
      pipe: true,
      executablePath: '/usr/bin/google-chrome',
      args: ['--headless', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    return { html, pdf: Buffer.from(pdf) }
  }
}
