const WebSocketServer = require('ws').Server
const server = require('http').createServer()
const expressApp = require('./http-server')

server.on('request', expressApp)

const wss = new WebSocketServer({
    server: server
})

const db = require('./db')

function dbSetup() {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS "projects" (
            id INTEGER,
            name TEXT,
            path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id)
        )
    `).run()
    db.prepare(`
        CREATE TABLE IF NOT EXISTS "dev_setup" (
            id INTEGER,
            project_id INTEGER,
            command TEXT,
            'order' INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id)
        )
    `).run()
    db.prepare(`
        CREATE TABLE IF NOT EXISTS "helpers" (
            id INTEGER,
            project_id INTEGER,
            command TEXT,
            'order' INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id)
        )
    `).run()
}

wss.on('connection', client => {
    dbSetup()

    client.respond = obj => client.send(JSON.stringify({ response: obj }))

    client.on('message', message => {
        let parsedMessage = JSON.parse(message)

        if(parsedMessage.hasOwnProperty('request')) {
            handleRequest(parsedMessage.request, client)
        }

        if(parsedMessage.hasOwnProperty('response')) {
            handleResponse(parsedMessage.response, client)
        }
    })
})

const exec = require('child_process').exec

function handleRequest(request, client) {

    if(request.method === 'access') {

        if(request.param === 'projects') {
            var projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()
            client.respond({
                method: request.method,
                param: request.param,
                data: projects
            })
        }

        if(request.param === 'devSetup') {
            var devSetup = db.prepare('SELECT * FROM dev_setup WHERE project_id = ? ORDER BY "order"').all(request.extraParams)
            client.respond({
                method: request.method,
                param: request.param,
                data: devSetup
            })
        }

        if(request.param === 'helpers') {
            var helpers = db.prepare('SELECT * FROM helpers WHERE project_id = ? ORDER BY "order"').all(request.extraParams)
            client.respond({
                method: request.method,
                param: request.param,
                data: helpers
            })
        }

    }

    if(request.method === 'add') {

        if(request.param === 'projects') {
            var insertedId = db.prepare('INSERT into projects(name, path) VALUES(?, ?)').run(request.extraParams.name, request.extraParams.path).lastInsertRowid
            client.respond({
                method: request.method,
                param: request.param,
                data: insertedId
            })
        }

        if(request.param === 'devSetup') {
            var insertedId = db.prepare('INSERT into dev_setup(command, "order", project_id) VALUES(?, ?, ?)').run(request.extraParams.command, request.extraParams.order, request.extraParams.project_id).lastInsertRowid
            client.respond({
                method: request.method,
                param: request.param,
                data: insertedId
            })
        }

        if(request.param === 'helpers') {
            var insertedId = db.prepare('INSERT into helpers(command, "order", project_id) VALUES(?, ?, ?)').run(request.extraParams.command, request.extraParams.order, request.extraParams.project_id).lastInsertRowid
            client.respond({
                method: request.method,
                param: request.param,
                data: insertedId
            })
        }

    }

    if(request.method === 'update') {

        if(request.param === 'projects') {
            db.prepare('UPDATE projects SET name=?, path=? WHERE id = ?').run(request.extraParams.name, request.extraParams.path, request.extraParams.id)
            // no response sent
        }

        if(request.param === 'devSetup') {
            db.prepare('UPDATE dev_setup SET command=?, "order"=? WHERE id = ?').run(request.extraParams.command, request.extraParams.order, request.extraParams.id)
            // no response sent
        }

        if(request.param === 'helpers') {
            db.prepare('UPDATE helpers SET command=?, "order"=? WHERE id = ?').run(request.extraParams.command, request.extraParams.order, request.extraParams.id)
            // no response sent
        }

    }

    if(request.method === 'delete') {

        if(request.param === 'projects') {
            db.prepare('DELETE FROM dev_setup WHERE project_id = ?').run(request.extraParams)
            db.prepare('DELETE FROM helpers WHERE project_id = ?').run(request.extraParams)
            db.prepare('DELETE FROM projects WHERE id = ?').run(request.extraParams)
            // no response sent
        }

        if(request.param === 'devSetup') {
            db.prepare('DELETE FROM dev_setup WHERE id = ?').run(request.extraParams)
            // no response sent
        }

        if(request.param === 'helpers') {
            db.prepare('DELETE FROM helpers WHERE id = ?').run(request.extraParams)
            // no response sent
        }

    }

    if(request.method === 'openFolder') {
        exec(`start "" "${request.param}"`)
        // no response sent
    }

    if(request.method === 'runCommand') {
        exec(`cd "${request.extraParams}" && start "cd ${request.extraParams} && ${request.param}" cmd.exe /c ${request.param}`)
        // no response sent
    }

}

function handleResponse(response, client) {
    console.log('Not Implemented')
}

server.listen(9896)
