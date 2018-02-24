import on from './on'
import set from './set'
import update from './update'

class Database {
  constructor ({ socket, serverURL, bucketName }) {
    if (!this) throw new Error('`database` is a constructor and should be called with the `new` keyword')

    this.socket = socket
    this.serverURL = serverURL
    this.bucketName = bucketName
    this.nodes = []
  
    this.socket_listeners = {}
    this.socket_on = (eventType, callback) => {
      if (!callback.name) throw new Error('Anonymous callback not allowed.')
      const ref = this.nodes.join('/')
      const room = `${ref}-${eventType}`
      const key = `${this.socket.id}-${room}`
      if (this.socket_listeners[key]) {
        this.socket_room_data[key].push(callback)
      } else {
        this.socket_room_data[key] = [callback]
      }
      this.socket.on(room, callback)
    }
    this.socket_off = (eventType, callback) => {
      if (!callback.name) throw new Error('Anonymous callback not allowed.')
    }

    // Bind APIs
    this.on = on.bind(this)
    this.set = set.bind(this)
    this.update = update.bind(this)
  }

  ref (ref) {
    // TODO: validation
    this.nodes = ref.split('/').filter(node => !!node)
    return this
  }

  parent () {
    this.nodes.pop()
    return this
  }

  child (node) {
    // TODO: validation
    this.nodes.push(node)
    return this
  }

  toString () {
    let refString = this.serverURL
    if (refString[refString.length - 1] !== '/') refString += '/'
    refString += this.nodes.join('/')
    return refString
  }
}

export default Database
