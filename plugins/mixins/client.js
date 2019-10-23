import io from 'socket.io-client'
// import axios from 'axios'

let socket

export default {

	methods: {

		handleError (reason) {
			if (reason) {
				if (reason.includes('OK') ||
          (
          	reason.includes('Socket closed') &&
            (this.$store.state.datasets.length > 0)
          )
				) {
					this.$store.commit('status')
				} else {
					this.$store.commit('status', new Error(reason))
				}
			}
			this.stopClient()
		},

		stopClient (waiting) {
			if (waiting) {
				this.$store.commit('status', 'waiting')
			}

			if (socket) {
				try {
					socket.disconnect()
				} catch (error) {
					console.error(error)
				}
			}
		},

		startClient (username, key) {
			this.$store.commit('status', 'loading')

			// const auth = await axios({
			//   method: 'post',
			//   url: `${process.env.API_URL}/authorize`,
			//   data: {
			//     client_id: process.env.CLIENT_ID
			//   }
			// })

			// socket = io(process.env.API_URL, { query: `username=${username}&access_token=${auth.data.access_token}` })

			socket = io(process.env.API_URL, {
				query: `username=${username}`
			})

			socket.on('new-error', (reason) => {
				console.log('ERROR - ' + reason)
				this.handleError(reason)
			})

			// socket.on('api_key', (payload) => {
			// 	console.log('api_key - ' + payload)
			// })

			socket.on('dataset', (dataset) => {
				const fernet = require('fernet')

				let secret = new fernet.Secret(key)

				let token = new fernet.Token({
					secret,
					token: dataset,
					ttl: 0
				})

				const pako = require('pako')

				let originalInput = pako.inflate(atob(token.decode()), {
					to: 'string'
				})

				try {
					this.$store.commit('add', {
						dataset: JSON.parse(originalInput)
					})
					this.$forceUpdate()
				} catch (error) {
					console.error(error)
					this.$store.commit('status', error)
				}
			})

			socket.on('connect', () => {
				console.log('CONNECTION SUCCESS')
				this.$store.commit('status', 'receiving')
			})

			socket.on('connection-error', (reason) => {
				console.log('CONNECTION FAILURE - ' + reason)
				this.handleError()
			})

			socket.on('disconnect', (reason) => {
				console.log('CONNECTION LOST - ' + reason)
				this.handleError()
			})
		}
	}
}