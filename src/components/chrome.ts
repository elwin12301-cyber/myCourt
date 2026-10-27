import { createContext, useContext } from 'react'

/** Small label above page headings; the services site overrides it so pages do not say "myCourt workspace". */
export const EyebrowContext = createContext('myCourt workspace')
export const useEyebrow = () => useContext(EyebrowContext)
