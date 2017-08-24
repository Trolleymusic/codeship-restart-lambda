'use strict'
const apiKey = process.env.CODESHIP_API_KEY
const repositoryName = process.env.CODESHIP_REPOSITORY_NAME
const branchName = process.env.CODESHIP_BRANCH_NAME
const testing = process.env.CODESHIP_TESTING === 'true'

const CodeshipWrapper = require('./codeship-node-promise-wrapper')
const Codeship = new CodeshipWrapper({apiKey})

function restartLastBuild (repositoryName, branchName = 'master') {
  console.log(`Ready to query Codeship for ${repositoryName}:${branchName}`)
  return Codeship.listProjects()
    .then(projects => {
      console.log(`${projects.length} project(s) found`)
      return projects.find(project => project.repository_name === repositoryName)
    })
    .then(project => {
      console.log(`${project.builds.length} build(s) found for ${project.repository_provider}:${project.repository_name}`)
      console.log(`Filtering builds to target ${branchName}`)
      return project.builds.filter(build => build.branch === branchName).shift()
    })
    // TODO: make testing abort more graceful
    .then(build => {
      console.log(`${build.id} is last build`)
      return testing ? Promise.reject('Aborted early because of CODESHIP_TESTING flag') : Codeship.restartBuild(build.id)
    })
    .then(newBuild => {
      console.log('New build returned', newBuild)
      return (newBuild.status === 'initiated' && !newBuild.finished_at) ? newBuild : Promise.reject(newBuild)
    })
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
