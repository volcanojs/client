function Snapshot ({ ref, value }) {
  this.ref = ref
  this.val = value
  const nodes = ref.split('/')
  this.key = nodes[nodes.length - 1]
  return {
    key: this.key,
    ref: this.ref,
    val: () => this.val,
    exists: () => !!this.val,
  }
}

export default Snapshot
