const path = require('path')

function getAbsolutePath(pathToFile) {
    return path.join(__dirname, pathToFile)
}

const Database = require('better-sqlite3')
const db = new Database(getAbsolutePath('store.db'))

module.exports = db
