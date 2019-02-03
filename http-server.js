const path = require('path')

function getAbsolutePath(pathToFile) {
    return path.join(__dirname, pathToFile)
}

const express = require('express')
const app = express()
app.use(express.static(getAbsolutePath('public')))

module.exports = app
