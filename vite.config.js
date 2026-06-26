/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'

// ESM-compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// Custom helper to load env files into process.env for local API mock execution
function loadEnvFiles() {
  const paths = ['.env', '.env.local']
  paths.forEach(file => {
    const filePath = resolve(__dirname, file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      content.split('\n').forEach(line => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const firstEqual = trimmed.indexOf('=')
          if (firstEqual > 0) {
            const key = trimmed.slice(0, firstEqual).trim()
            const val = trimmed.slice(firstEqual + 1).trim()
            const cleanedVal = val.replace(/^["']|["']$/g, '')
            process.env[key] = cleanedVal
          }
        }
      })
    }
  })
}

loadEnvFiles()

// Vite plugin to run the /api/ai Vercel handler function locally during dev
function localApiPlugin() {
  return {
    name: 'local-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/ai') && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              const parsedBody = body ? JSON.parse(body) : {}
              const vercelReq = {
                method: req.method,
                headers: req.headers,
                body: parsedBody,
              }
              
              let statusVal = 200
              const headersVal = {}
              let sentData = null
              
              const vercelRes = {
                status(code) {
                  statusVal = code
                  return this
                },
                setHeader(name, value) {
                  headersVal[name] = value
                  return this
                },
                json(data) {
                  sentData = JSON.stringify(data)
                  return this
                },
                end() {
                  sentData = ''
                  return this
                }
              }
              
              const { default: handler } = await server.ssrLoadModule('/api/ai.js')
              await handler(vercelReq, vercelRes)
              
              res.statusCode = statusVal
              Object.entries(headersVal).forEach(([k, v]) => res.setHeader(k, v))
              res.setHeader('Content-Type', 'application/json')
              res.end(sentData)
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApiPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
