'use strict'
const apiKey = process.env.CODESHIP_API_KEY
const repositoryName = process.env.CODESHIP_REPOSITORY_NAME
const branchName = process.env.CODESHIP_BRANCH_NAME
const testing = process.env.CODESHIP_TESTING === 'true'

const CodeshipWrapper = require('./codeship-node-promise-wrapper')
const Codeship = new CodeshipWrapper({apiKey})

function restartLastBuild (repositoryName, branchName = 'master') {
  return Codeship.listProjects()
    .then(projects => projects.find(project => project.repository_name === repositoryName))
    .then(project => project.builds.filter(build => build.branch === branchName).unshift())
    // TODO: make testing abort more graceful
    .then(build => !testing ? Codeship.restartBuild(build.id) : Promise.reject('Just testing'))
    .then(newBuild => (newBuild.status === 'initiated' && !newBuild.finished_at) ? newBuild : Promise.reject(newBuild))
}

exports.handler = function (event, context, callback) {
  return restartLastBuild(repositoryName, branchName)
    .then(newBuild => {
      console.info('Build was restarted', JSON.stringify(newBuild))
      return callback(null, newBuild)
    })
    .catch(error => {
      console.error('Error:', error)
      return callback(error)
    })
}
