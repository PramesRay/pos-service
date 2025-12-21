import express from 'express'
import { initServer } from '../infrastructure/rest/rest.js'
import { initDB } from '../infrastructure/database/mysql.js'

const app = express()

await initDB()

const restApp = initServer()
app.use(restApp)

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
}

export default app