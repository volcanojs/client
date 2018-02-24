import ObjectId from 'bson-objectid'

export default function (value) {
  this._nodes.push(ObjectId().toHexString())
  if (!value) return this
  return this.set(value)
}
