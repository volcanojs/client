import io from 'socket.io-client'
import database from './database'

function initializeApp (config) {
  const { serverURL } = config
  this._socket = io(serverURL)
  return {
    database: () => new database(this._socket, serverURL),
    socket: this._socket,
  }
}

export default {
  initializeApp: (config) => new initializeApp(config),
}
