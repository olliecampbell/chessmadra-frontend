import axios from 'axios'
import applyCaseMiddleware from 'axios-case-converter'

const client = applyCaseMiddleware(
  axios.create({
    baseURL:
      !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
        ? 'http://localhost:8040'
        : undefined
  })
)

export default client
