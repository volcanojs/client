import io from 'socket.io-client'
import Database from './database'

function initializeApp (config) {
  const { serverURL, bucketName } = config
  this.socket = io(serverURL)
  return {
    database: () => new Database({
      socket: this.socket, 
      serverURL, 
      bucketName,
    }),
    socket: this.socket,
  }
}

export default {
  initializeApp: (config) => new initializeApp(config),
}
