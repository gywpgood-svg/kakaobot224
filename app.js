require('dotenv').config()

const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('서버 정상 작동중')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`서버 실행중: ${PORT}`)
})
