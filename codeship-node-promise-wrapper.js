'use strict'

const Codeship = require('codeship-node')

class CodeshipPromiseWrapper {
  constructor ({apiKey}) {
    this.codeship = new Codeship({apiKey})
    this.builds = {
      restart: this.restartBuild.bind(this)
    }
    this.projects = {
      get: this.getProject.bind(this),
      list: this.listProjects.bind(this)
    }
  }

  getProject (id) {
    return new Promise((resolve, reject) => {
      return this.codeship.projects.get(id, (error, data) => error ? reject(error) : resolve(data))
    })
  }

  listProjects () {
    return new Promise((resolve, reject) => {
      return this.codeship.projects.list((error, data) => error ? reject(error) : resolve(data))
    })
  }

  restartBuild (id) {
    return new Promise((resolve, reject) => {
      return this.codeship.builds.restart(id, (error, data) => error ? reject(error) : resolve(data))
    })
  }
}

module.exports = CodeshipPromiseWrapper
