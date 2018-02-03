import { arrayToObject } from './utils'

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
  this._request = (method, collection, params) => new Promise((resolve, reject) => {
    this._socket.emit(method, `d/${collection}`, params, (error, result) => {
      if (error) return reject(error)
      const formattedResult = Array.isArray(result.data) ? arrayToObject(result.data) : result.data
      return resolve(formattedResult)
    })
  })
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
  const initializingEventName = `${ref}-on-${eventType}-initializing`
  const initializedEventName = `${ref}-on-${eventType}-initialized`
  const onEventName = `${ref}-on-${eventType}`
  const initializingCB = function(snapshot) {
    callback(snapshot)
  }
  const initializedCB = function() {
    isInitialized = true
    queueWhenIniting.forEach(snapshot => {callback(snapshot)})
    this._socket.off(initializingEventName, initializingCB)
    this._socket.off(initializedEventName, initializedCB)
  }
  const onCB = function(snapshot) {
    if (!isInitialized) {
      queueWhenIniting.push(snapshot)
    } else {
      callback(snapshot)
    }
  }
  this._socket.on(initializingEventName, initializingCB)
  this._socket.on(initializedEventName, initializedCB)
  this._socket.on(onEventName, onCB)

  // this._socket.emit(REQUEST_METHOD.UPDATE, ROOT_SERVICE, null, {}, params, (error, result) => {
  //   if (error) {
  //     console.log(error)
  //     throw new Error(error)
  //   }
  //   const formattedResult = Array.isArray(result.data) ? arrayToObject(result.data) : result.data
  //   callback(formattedResult)
  // })
  console.log(params)
  this._socket.emit('volcano-on', params)
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
    this._socket.emit('volcano-set', params, ({ updatedData, error }) => {
      if (error) return reject(error)
      return resolve(updatedData)
    })
  })
}

export default database
