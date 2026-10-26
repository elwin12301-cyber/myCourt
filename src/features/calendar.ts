export interface DayCell { day: number | null; iso: string | null }

/** Monday-first month grid padded to whole weeks. `month` is 0-based. */
export function monthGrid(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells: DayCell[] = []
  for (let i = 0; i < offset; i++) cells.push({ day: null, iso: null })
  for (let d = 1; d <= days; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, iso })
  }
  while (cells.length % 7) cells.push({ day: null, iso: null })
  return cells
}

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
