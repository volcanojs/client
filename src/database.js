import { arrayToObject } from './utils'
import Snapshot from './models/Snapshot'
import ObjectId from 'bson-objectid'

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

database.prototype.on = function (eventType, callback, cancelCallback, context, isOnce = false, onceCompleteCallback) {
  console.log('---on---')
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

  let isOnceComplete = false
  const invokeCallback = ({ snapshot, error }) => {
    if (isOnce) {
      console.log('---is once---')
      if (!isOnceComplete) {
        isOnceComplete = true
        onceCompleteCallback({ snapshot, error })
        console.log('---once complete---')
      }
    } else {
      console.log('---is on---')
      if (error) {
        cancelCallback(error)
      } else {
        callback(snapshot)
      }
    }
  }

  const initingCB = ({ error, snapshotData }, tellServerComplete) => {
    console.log('---initing---')
    invokeCallback({ error, snapshot: new Snapshot(snapshotData) })
    tellServerComplete()
  }
  const initedCB = () => {
    console.log('---inited---')
    isInitialized = true
    queueWhenIniting.forEach(result => {
      invokeCallback(result)
    })
    this._socket.off(initingEvent, initingCB)
    this._socket.off(initedEvent, initedCB)
  }
  const onCB = ({ error, snapshotData }) => {
    console.log('---on value change---')
    const result = { error, snapshot: new Snapshot(snapshotData) }
    if (!isInitialized) {
      queueWhenIniting.push(result)
    } else {
      invokeCallback(result)
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
      callback && callback()
    })
  }
}

database.prototype.once = function (eventType, callback, cancelCallback, context) {
  console.log('wfdfs')
  const _this = this
  return new Promise((resolve, reject) => {
    console.log('ldjka')
    let offHandler
    offHandler = _this.on(eventType, callback, cancelCallback, context, true, ({ snapshot, error }) => {
      offHandler()
      if (error) return reject(error)
      return resolve(snapshot)
    })
  })
}

database.prototype.push = function (value) {
  this._nodes.push(ObjectId().toHexString())
  if (!value) return this
  return this.set(value)
}

database.prototype.set = function (value) {
  const ref = this._nodes.join('/')
  const params = {
    query: {
      ref,
      value,
    },
  }
  console.log(params)
  return new Promise((resolve, reject) => {
    this._socket.emit('volcano-set', params, ({ updatedSnapshotData, error }) => {
      if (error) return reject(error)
      return resolve(new Snapshot(updatedSnapshotData))
    })
  })
}

database.prototype.update = function (value) {
  const ref = this._nodes.join('/')
  const params = {
    query: {
      ref,
      value,
    },
  }
  return new Promise((resolve, reject) => {
    this._socket.emit('volcano-update', params, ({ updatedSnapshotData, error }) => {
      if (error) return reject(error)
      console.log()
      return resolve(new Snapshot(updatedSnapshotData))
    })
  })
}


export default database
