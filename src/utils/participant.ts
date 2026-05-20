import dayjs from 'dayjs'

export const computeBirthDate = (birthMonth: string, birthYear: string | number): string => {
  const day = Math.floor(Math.random() * 29) + 1
  return dayjs(`${birthMonth} ${day}, ${birthYear}`).format('YYYY-MM-DD')
}

export const computeAge = (birthDate: string): number => {
  return dayjs().diff(dayjs(birthDate), 'year', true)
}
