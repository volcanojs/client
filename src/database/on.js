import { Snapshot } from '../models'

export default function (eventType, callback, cancelCallback, context, isOnce = false, onceCompleteCallback) {
  console.log('---on---')
  context && callback.bind(context)
  const ref = this.nodes.join('/')
  const nodes = [...this.nodes]
  const params = {
    eventType,
    query: {
      ref: ref,
      bucketName: this.bucketName,
    },
  }

  const room = `${this.bucketName}/${ref}-${eventType}`

  let isInitialized = false
  let queueWhenIniting = []
  const initingEvent = `${room}-initing`
  const initedEvent = `${room}-inited`
  const onEvent = `${room}`
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

  const initingCB = ({ snapshotRaw, error }, tellServerComplete) => {
    console.log('---initing---')
    invokeCallback({ error, snapshot: new Snapshot(snapshotRaw) })
    tellServerComplete()
  }
  const initedCB = () => {
    console.log('---inited---')
    isInitialized = true
    queueWhenIniting.forEach(result => {
      invokeCallback(result)
    })
    this.socket.off(initingEvent, initingCB)
    this.socket.off(initedEvent, initedCB)
  }
  const onCB = ({ snapshotRaw, error }) => {
    console.log('---on value change---')
    const result = { error, snapshot: new Snapshot(snapshotRaw) }
    if (!isInitialized) {
      queueWhenIniting.push(result)
    } else {
      invokeCallback(result)
    }
  }
  this.socket.on(initingEvent, initingCB)
  this.socket.on(initedEvent, initedCB)
  this.socket.on(onEvent, onCB)

  this.socket.emit('volcano-on', params)
  console.log(`---on ${room}---`)

  return (callback, context) => {
    context && callback.bind(context)
    this.socket.emit('volcano-off', { room: onEvent }, () => {
      this.socket.off(onEvent, onCB)
      console.log('---off', onEvent, '---')
      callback && callback()
    })
  }
}
