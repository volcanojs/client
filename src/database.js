import { arrayToObject } from './utils'
import Snapshot from './models/Snapshot';

const ROOT_SERVICE = 'd'

const REQUEST_METHOD = {
  FIND: 'find',
  GET: 'get',
  CREATE: 'create',
  UPDATE: 'update',
  PATCH: 'patch',
  REMOVE: 'remove',
}
const VOLCANO_ACTION = {
  OFF: 'off',
  ON: 'on',
  ONCE: 'once',
}
const EVENT_TYPE = {
  VALUE: 'value',
  CHILD_ADDED: 'child_added',
  CHILD_CHANGED: 'child_changed',
  CHILD_REMOVED: 'child_removed',
  CHILD_MOVED: 'child_moved',
}

function database (socket, serverURL) {
  if (!this) throw new Error('`database` is a constructor and should be called with the `new` keyword')
  this._init(socket, serverURL)
}

database.prototype._init = function (socket, serverURL) {
  this._socket = socket
  this._serverURL = serverURL
  this._nodes = []

  this._getRef = (collection) => `d/${collection}`
  this._getParams = (nodes) => {
    if (nodes.length > 1) {
      return {
        _id: nodes[1],
        _volcano: {
          nodes: nodes.slice(1),
        },
      }
    } else {
      return {}
    }
  }
  this._readyOrNot = () => {
    // TODO
    return null
  }

  this._socket_listeners = {}
  this._socket_on = (eventType, callback) => {
    if (!callback.name) throw new Error('Anonymous callback not allowed.')
    const ref = this._nodes.join('/')
    const room = `${ref}-${eventType}`
    const key = `${this._socket.id}-${room}`
    if (this._socket_listeners[key]) {
      this._socket_room_data[key].push(callback)
    } else {
      this._socket_room_data[key] = [callback]
    }
    this._socket.on(room, callback)
  }
  this._socket_off = (eventType, callback) => {
    if (!callback.name) throw new Error('Anonymous callback not allowed.')
  }
}

database.prototype.ref = function (ref) {
  // TODO: validation
  this._nodes = ref.split('/').filter(node => !!node)
  return this
}

database.prototype.child = function (node) {
  // TODO: validation
  this._nodes.push(node)
  return this
}

database.prototype.parent = function () {
  this._nodes.pop()
  return this
}

database.prototype.toString = function () {
  let refString = this._serverURL
  if (refString[refString.length - 1] !== '/') refString += '/'
  refString += this._nodes.join('/')
  return refString
}

database.prototype.once = function (eventType) {
  return new Promise((resolve, reject) => {
    const notReady = this._readyOrNot()
    if (notReady) return reject(notReady)

    const method = 'find'
    const nodes = this._getRefNodes()
    // TODO: get data of all collections
    // if (nodes.length === 0)
    const ref = nodes[0]
    const params = this._getParams(nodes)
    this._request(method, ref, params)
      .then(snapshot => resolve(snapshot))
      .catch(error => reject(error))
  })
}

database.prototype.on = function (eventType, callback, cancelCallback, context) {
  context && callback.bind(context)
  const ref = this._nodes.join('/')
  const nodes = [...this._nodes]
  const params = {
    eventType,
    query: {
      ref,
    },
  }

  let isInitialized = false
  let queueWhenIniting = []
  const initingEvent = `${ref}-${eventType}-initing`
  const initedEvent = `${ref}-${eventType}-inited`
  const onEvent = `${ref}-${eventType}`
  console.log(onEvent)
  const initingCB = (snapshotData, tellServerComplete) => {
    console.log('---initing---')
    callback(new Snapshot(snapshotData))
    tellServerComplete()
  }
  const initedCB = () => {
    console.log('---inited---')
    isInitialized = true
    queueWhenIniting.forEach(snapshot => {callback(snapshot)})
    this._socket.off(initingEvent, initingCB)
    this._socket.off(initedEvent, initedCB)
  }
  const onCB = (snapshotData) => {
    console.log('---on value change---')
    const snapshot = new Snapshot(snapshotData)
    if (!isInitialized) {
      queueWhenIniting.push(snapshot)
    } else {
      callback(snapshot)
    }
  }
  this._socket.on(initingEvent, initingCB)
  this._socket.on(initedEvent, initedCB)
  this._socket.on(onEvent, onCB)

  this._socket.emit('volcano-on', params)

  return (callback, context) => {
    context && callback.bind(context)
    this._socket.emit('volcano-off', { room: onEvent }, () => {
      this._socket.off(onEvent, onCB)
      console.log('---off', onEvent, '---')
      callback()
    })
  }
}

database.prototype.set = function (data) {
  const ref = this._nodes.join('/')
  const params = {
    query: {
      ref,
      data,
    },
  }
  return new Promise((resolve, reject) => {
    this._socket.emit('volcano-set', params, ({ updatedSnapshotData, error }) => {
      if (error) return reject(error)
      console.log()
      return resolve(new Snapshot(updatedSnapshotData))
    })
  })
}

export default database
