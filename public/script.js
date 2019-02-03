const ws = new ReconnectingWebSocket(`ws://${document.location.host}`)

ws.request = obj => ws.send(JSON.stringify({ request: obj }))

var app = new Vue({
    el: '#vue',
    components: {
        'medium-editor': vueMediumEditor.default
    },
    data: {
        projects: [],
        activeProjectId: null,
        activeProject: null,
        devSetup: [],
        selectedDevSetupCommandId: null,
        selectedDevSetupCommand: null,
        helpers: [],
        selectedHelperId: null,
        selectedHelper: null,
        addDevSetupObject: {},
        addHelperObject: {},
        projectFilter: '',
        startDevelopingRunning: false,
        helperRunning: false,
        newProject: null,
        projectEditOptions: {
            disableExtraSpaces: true,
            disableReturn: true,
            toolbar: false
        }
    },
    computed: {
        filteredProjects() {
            return this.projects.filter(project => project.name.toLowerCase().includes(this.projectFilter.toLowerCase()))
        }
    },
    watch: {
        activeProjectId() {
            if(this.activeProjectId) {
                localStorage.setItem('activeProjectId', this.activeProjectId)
                this.activeProject = this.projects.filter(project => project.id == this.activeProjectId)[0]
                app.fetchDevSetup()
                app.fetchHelpers()
            } else {
                this.activeProject = null
            }
        },
        selectedDevSetupCommandId() {
            if(this.selectedDevSetupCommandId) {
                localStorage.setItem('selectedDevSetupCommandId', this.selectedDevSetupCommandId)
                this.selectedDevSetupCommand = this.devSetup.filter(devSetupCommand => devSetupCommand.id == this.selectedDevSetupCommandId)[0]
            } else {
                this.selectedDevSetupCommand = null
            }
        },
        selectedHelperId() {
            if(this.selectedHelperId) {
                localStorage.setItem('selectedHelperId', this.selectedHelperId)
                this.selectedHelper = this.helpers.filter(helper => helper.id == this.selectedHelperId)[0]
            } else {
                this.selectedHelper = null
            }
        }
    },
    methods: {
        addProject() {
            this.newProject = {
                name: 'Untitled',
                path: 'Untitled'
            }
            ws.request({ method: 'add', param: 'projects', extraParams: this.newProject })
        },
        addProjectAfterResponse() {
            this.projects.unshift(JSON.parse(JSON.stringify(this.newProject)))
            this.activeProjectId = this.newProject.id
            this.newProject = null
        },
        moveUp(type) {
            if(type === 'devSetupCommand') {
                var order = this.selectedDevSetupCommand.order - 1
                if(order >= 1) {
                    var currentIndex = null
                    this.devSetup.forEach((devSetupCommand, index) => {
                        if(devSetupCommand.id == this.selectedDevSetupCommandId) {
                            currentIndex = index
                        }
                    })
                    this.devSetup[currentIndex-1].order++
                    this.selectedDevSetupCommand.order = order
                }
            }
            if(type === 'helper') {
                var order = this.selectedHelper.order - 1
                if(order >= 1) {
                    var currentIndex = null
                    this.helpers.forEach((helper, index) => {
                        if(helper.id == this.selectedHelperId) {
                            currentIndex = index
                        }
                    })
                    this.helpers[currentIndex-1].order++
                    this.selectedHelper.order = order
                }
            }
            this.reSort(type)
        },
        moveDown(type) {
            if(type === 'devSetupCommand') {
                var order = this.selectedDevSetupCommand.order + 1
                if(order <= this.devSetup.length) {
                    var currentIndex = null
                    this.devSetup.forEach((devSetupCommand, index) => {
                        if(devSetupCommand.id == this.selectedDevSetupCommandId) {
                            currentIndex = index
                        }
                    })
                    this.devSetup[currentIndex+1].order--
                    this.selectedDevSetupCommand.order = order
                }
            }
            if(type === 'helper') {
                var order = this.selectedHelper.order + 1
                if(order <= this.helpers.length) {
                    var currentIndex = null
                    this.helpers.forEach((helper, index) => {
                        if(helper.id == this.selectedHelperId) {
                            currentIndex = index
                        }
                    })
                    this.helpers[currentIndex+1].order--
                    this.selectedHelper.order = order
                }
            }
            this.reSort(type)
        },
        reSort(type) {
            if(type === 'devSetupCommand') {
                this.devSetup.sort((a, b) => a.order - b.order)
            }
            if(type === 'helper') {
                this.helpers.sort((a, b) => a.order - b.order)
            }
        },
        startDeveloping() {
            this.startDevelopingRunning = true
            this.devSetup.forEach((devSetupCommand, index) => {
                this.runCommand(devSetupCommand.command)
                this.$set(devSetupCommand, 'status', 'Running')
            })
            setTimeout(() => {
                this.devSetup.forEach((devSetupCommand, index) => {
                    this.$set(devSetupCommand, 'status', 'Completed')
                })
                this.startDevelopingRunning = false
            }, 2000)
        },
        runHelper() {
            if(this.selectedHelper) {
                this.helperRunning = true
                this.runCommand(this.selectedHelper.command)
                setTimeout(() => {
                    this.helperRunning = false
                }, 2000)
            }
        },
        addDevSetup() {
            this.addDevSetupObject.project_id = this.activeProjectId
            ws.request({ method: 'add', param: 'devSetup', extraParams: this.addDevSetupObject })
        },
        addDevSetupAfterResponse() {
            this.devSetup.push(JSON.parse(JSON.stringify(this.addDevSetupObject)))
            this.selectedDevSetupCommandId = this.addDevSetupObject.id
            this.addDevSetupObject = {}
        },
        addHelper() {
            this.addHelperObject.project_id = this.activeProjectId
            ws.request({ method: 'add', param: 'helpers', extraParams: this.addHelperObject })
        },
        addHelperAfterResponse() {
            this.helpers.push(JSON.parse(JSON.stringify(this.addHelperObject)))
            this.selectedHelperId = this.addHelperObject.id
            this.addHelperObject = {}
        },
        fetchProjects() {
            ws.request({ method: 'access', param: 'projects' })
        },
        fetchDevSetup() {
            ws.request({ method: 'access', param: 'devSetup', extraParams: this.activeProjectId })
        },
        fetchHelpers() {
            ws.request({ method: 'access', param: 'helpers', extraParams: this.activeProjectId })
        },
        updateProjectName(operation) {
            this.activeProject.name = operation.api.origElements.innerHTML
            ws.request({ method: 'update', param: 'projects', extraParams: this.activeProject })
        },
        updateProjectPath(operation) {
            this.activeProject.path = operation.api.origElements.innerHTML
            ws.request({ method: 'update', param: 'projects', extraParams: this.activeProject })
        },
        deleteProject() {
            if(confirm('Are you sure you want to delete this project?')) {
                ws.request({ method: 'delete', param: 'projects', extraParams: this.activeProjectId })
                this.projects = this.projects.filter(project => project.id != this.activeProjectId)
                this.activeProjectId = this.projects[0].id
            }
        },
        deleteDevSetupCommand() {
            if(confirm('Are you sure you want to delete this dev setup command?')) {
                ws.request({ method: 'delete', param: 'devSetup', extraParams: this.selectedDevSetupCommandId })
                this.devSetup = this.devSetup.filter(devSetupCommand => devSetupCommand.id != this.selectedDevSetupCommandId)
                this.selectedDevSetupCommandId = null
            }
        },
        deleteHelperCommand() {
            if(confirm('Are you sure you want to delete this helper command?')) {
                ws.request({ method: 'delete', param: 'helpers', extraParams: this.selectedHelperId })
                this.helpers = this.helpers.filter(helper => helper.id != this.selectedHelperId)
                this.selectedHelperId = null
            }
        },
        switchProject(projectId) {
            this.activeProjectId = projectId
            this.selectedDevSetupCommandId = null
            this.selectedHelperId = null
        },
        openProjectFolder() {
            ws.request({ method: 'openFolder', param: this.activeProject.path })
        },
        runCommand(command) {
            ws.request({ method: 'runCommand', param: command, extraParams: this.activeProject.path })
        }
    }
})

ws.addEventListener('open', () => {
    app.fetchProjects()
})

ws.addEventListener('message', message => {
    let parsedMessage = JSON.parse(message.data)

    if(parsedMessage.hasOwnProperty('request')) {
        handleRequest(parsedMessage.request)
    }

    if(parsedMessage.hasOwnProperty('response')) {
        handleResponse(parsedMessage.response)
    }
})

function handleRequest(request) {
    console.log('Not Implemented')
}

function handleResponse(response) {

    if(response.method === 'access') {

        if(response.param === 'projects') {
            app.projects = response.data

            var activeProjectId = localStorage.getItem('activeProjectId')
            if(activeProjectId) {
                app.activeProjectId = activeProjectId
            }
        }

        if(response.param === 'devSetup') {
            app.devSetup = response.data

            var selectedDevSetupCommandId = localStorage.getItem('selectedDevSetupCommandId')
            if(selectedDevSetupCommandId) {
                if(app.devSetup.some(devSetupCommand => devSetupCommand.id == selectedDevSetupCommandId)) {
                    app.selectedDevSetupCommandId = selectedDevSetupCommandId
                }
            }
        }

        if(response.param === 'helpers') {
            app.helpers = response.data

            var selectedHelperId = localStorage.getItem('selectedHelperId')
            if(selectedHelperId) {
                if(app.helpers.some(helper => helper.id == selectedHelperId)) {
                    app.selectedHelperId = selectedHelperId
                }
            }
        }

    }

    if(response.method === 'add') {

        if(response.param === 'projects') {
            app.newProject.id = response.data
            app.addProjectAfterResponse()
        }

        if(response.param === 'devSetup') {
            app.addDevSetupObject.id = response.data
            app.addDevSetupAfterResponse()
        }

        if(response.param === 'helpers') {
            app.addHelperObject.id = response.data
            app.addHelperAfterResponse()
        }

    }

}
