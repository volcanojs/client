export default function (eventType, callback, cancelCallback, context) {
  const _this = this
  return new Promise((resolve, reject) => {
    let offHandler
    offHandler = _this.on(eventType, callback, cancelCallback, context, true, ({ snapshot, error }) => {
      offHandler()
      if (error) return reject(error)
      return resolve(snapshot)
    })
  })
}
