// Load .env.local for all tests
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(__dirname, '../.env.local') })
