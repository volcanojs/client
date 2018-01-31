import database from './database'

export const initializeApp = (config) => {
  const { serverURL } = config
  return {
    database: new database({ serverURL }),
  }
}

export default {
  initializeApp: initializeApp,
}
