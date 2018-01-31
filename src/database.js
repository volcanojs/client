import io from 'socket.io-client'
import { arrayToObject } from './utils'

const EVENT_TYPE = {
  VALUE: 'value',
  CHILD_ADDED: 'child_added',
  CHILD_CHANGED: 'child_changed',
  CHILD_REMOVED: 'child_removed',
  CHILD_MOVED: 'child_moved',
}

function database (config) {
  if (!this) throw new Error('`database` is a constructor and should be called with the `new` keyword')
  this._init(config)
}

database.prototype._init = function (config) {
  this._config = config
  this._socket = io(this._config.serverURL)

  this._ref = ''

  this._getRefNodes = () => this._ref.split('/').filter(node => !!node)
  this._getModelName = () => this._getRefNodes()[0]
  this._getParams = (nodes) => {
    if (nodes.length > 1) {
      return {
        _id: nodes[1],
        _nodes: nodes.slice(1)
      }
    } else {
      return {}
    }
  }
  this._readyOrNot = () => {
    // TODO
    return null
  }
  this._request = (method, ref, params) => new Promise((resolve, reject) => {
    this._socket.emit(method, `d/${ref}/test`, params, (error, result) => {
      if (error) return reject(error)
      return resolve(arrayToObject(result.data))
    })
  })
}

database.prototype.ref = function (ref) {
  this._ref = ref
  return this
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

export default database
