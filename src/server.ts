import Fastify from 'fastify'
import app from './app.js'

const PORT = parseInt(process.env.PORT || '8080')
const HOST = process.env.HOST || '0.0.0.0'

async function start() {
  const fastify = Fastify({
    logger: {
      level: 'info'
    }
  })

  try {
    await fastify.register(app)
    
    await fastify.listen({
      port: PORT,
      host: HOST
    })
    
    console.log(`Server listening on ${HOST}:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
