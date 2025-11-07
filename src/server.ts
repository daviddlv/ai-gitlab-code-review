import Fastify from 'fastify'
import app from './app.js'

const PORT = parseInt(process.env.PORT || '8080')
const HOST = process.env.HOST || '0.0.0.0'

async function start() {
  const fastify = Fastify({
    logger: {
      level: 'info',
      // Change default 'msg' key to 'message' for better readability in GCP
      messageKey: 'message',
      // Configuration pour Google Cloud Platform
      formatters: {
        level(label, number) {
          return { 
            level: number,
            severity: label.toUpperCase() 
          }
        }
      },
      // Ensure formatter is applied to all logs including errors
      serializers: {
        err: (err) => {
          return {
            type: err.constructor.name,
            message: err.message,
            stack: err.stack || '',
            ...(err.code && { code: err.code }),
            ...(err.statusCode && { statusCode: err.statusCode })
          }
        }
      }
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
    fastify.log.error({ err }, 'Failed to start server')
    process.exit(1)
  }
}

start()
