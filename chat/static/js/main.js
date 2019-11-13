const config = {
  serverURL: 'http://localhost:2306',
  bucketName: 'volcano-chat',
}
const volcanoApp = volcano.default.initializeApp(config)

new Vue({
  el: '#app',
  data() {
    return {
      messages: [],
      username: 'wildfire',
      photoURL: 'https://avatars3.githubusercontent.com/u/35029537?s=200&v=4',
      message: '',
    }
  },
  created() {
    volcanoApp.database().ref('messages').on('child_added', (snapshot) => {
      console.log('------message child_added------')
      const data = snapshot.val()
      this.messages.push(Object.assign({}, data, { id: snapshot.key }))
      console.log(snapshot.val())
      console.log(snapshot.key)
    })
  },
  methods: {
    send() {
      volcanoApp.database().ref('messages').push({
        username: this.username,
        photoURL: this.photoURL,
        content: this.message,
        createdAt: `${new Date().getTime()}`
      })
        .then(() => {
          console.log('Sent!')
        })
        .catch(error => {
          console.log('Failed to send')
          console.error(error)
        })
    },
  },
})