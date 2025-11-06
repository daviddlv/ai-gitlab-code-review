import type { FastifyPluginAsync } from 'fastify'

const root: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  // Health check endpoint for Cloud Run
  fastify.get('/', async function (_request, _reply) {
    return { 
      status: 'healthy',
      service: 'ai-gitlab-code-review',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    }
  })

  // Detailed health check
  fastify.get('/health', async function (_request, _reply) {
    return {
      status: 'healthy',
      checks: {
        api: 'ok',
        aiModel: process.env.AI_MODEL || 'not-configured',
        gitlabUrl: process.env.GITLAB_URL ? 'configured' : 'not-configured'
      },
      timestamp: new Date().toISOString()
    }
  })
}

export default root
