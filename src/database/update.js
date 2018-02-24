import { Snapshot } from '../models'

export default function (value) {
  const ref = this.nodes.join('/')
  const params = {
    query: {
      ref,
      value,
      bucketName: this.bucketName,
    },
  }
  return new Promise((resolve, reject) => {
    this.socket.emit('volcano-update', params, (error) => {
      if (error) return reject(error)
      return resolve()
    })
  })
}
