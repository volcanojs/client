export default function (eventType, callback, cancelCallback, context) {
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
