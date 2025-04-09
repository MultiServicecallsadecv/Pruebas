import express from 'express'
import logger from 'morgan'
import dotenv from 'dotenv'
import { createClient } from '@libsql/client'

import { Server } from 'socket.io'
import { createServer } from 'node:http'

import cors from 'cors';

dotenv.config()

const port = process.env.PORT ?? 3000

const app = express()

// Configuración de CORS para Express
app.use(cors({
  origin: ['https://meek-lily-d07967.netlify.app', 'http://localhost:3000'], // URL de tu página en Netlify
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Crear servidor HTTP
const server = createServer(app)

// Configuración de CORS para Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['https://meek-lily-d07967.netlify.app', 'http://localhost:3000'], // URL de tu página en Netlify
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
})

const db = createClient({
  url: 'libsql://firm-elongated-arkinidox.turso.io',
  authToken: process.env.DB_TOKEN
})

await db.execute(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    user TEXT
  )
`)

io.on('connection', async (socket) => {
  console.log('a user has connected!')

  socket.on('disconnect', () => {
    console.log('an user has disconnected')
  })

  socket.on('chat message', async (msg) => {
    let result
    const username = socket.handshake.auth.username ?? 'anonymous'
    console.log({ username })
    try {
      result = await db.execute({
        sql: 'INSERT INTO messages (content, user) VALUES (:msg, :username)',
        args: { msg, username }
      })
    } catch (e) {
      console.error(e)
      return
    }

    io.emit('chat message', msg, result.lastInsertRowid.toString(), username)
  })

  if (!socket.recovered) { // <- recuperase los mensajes sin conexión
    try {
      const results = await db.execute({
        sql: 'SELECT id, content, user FROM messages WHERE id > ?',
        args: [socket.handshake.auth.serverOffset ?? 0]
      })

      results.rows.forEach(row => {
        socket.emit('chat message', row.content, row.id.toString(), row.user)
      })
    } catch (e) {
      console.error(e)
    }
  }
})

// Aquí ya agarra todas las carpetas
app.use(logger('dev'))
app.use(express.static(process.cwd() + '/client'))

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/client/index.html')
})

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
