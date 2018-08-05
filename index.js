'use strict'
const apiKey = process.env.CODESHIP_API_KEY
const repositoryName = process.env.CODESHIP_REPOSITORY_NAME
const branchName = process.env.CODESHIP_BRANCH_NAME
const testing = process.env.CODESHIP_TESTING === 'true'
const includeTags = process.env.CODESHIP_INCLUDE_TAGS === 'true'

const headers = { 'Content-Type': 'application/json' }

const CodeshipWrapper = require('./codeship-node-promise-wrapper')
const Codeship = new CodeshipWrapper({apiKey})

const tagRegex = /v(\d+\.\d+\.\d+)/

function restartBuild (build) {
  console.log(`${build.id} is last build of branch ${build.branch}`)

  if (testing) {
    const message = 'Aborting early because of CODESHIP_TESTING flag'
    return Promise.reject(new Error(message))
  }

  return Codeship.restartBuild(build.id)
    .then(newBuild => {
      console.log('New build returned', newBuild)
      if (newBuild.status !== 'initiated' || newBuild.finished_at) {
        const message = 'Build did not return as expected'
        return Promise.reject(new Error(message))
      }
      return newBuild
    })
}

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
      const buildsMap = project.builds.reduce((builds, build) => {
        if (!includeTags && tagRegex.test(build.branch)) {
          return builds
        }
        if (branchName === '*' || branchName === build.branch) {
          builds[build.branch] = [...(builds[build.branch] || []), build]
        }
        return builds
      }, {})
      return Object.keys(buildsMap).map(key => buildsMap[key].shift())
    })
    .then(builds => Promise.all(builds.map(build => restartBuild(build))))
}

function apiGatewayResponse ({body, code}) {
  return {
    isBase64Encoded: false,
    statusCode: code,
    headers: headers,
    body: JSON.stringify(body)
  }
}

exports.handler = function (event, context, callback) {
  return restartLastBuild(repositoryName, branchName)
    .then(newBuilds => {
      const action = newBuilds.length > 1 ? 'builds were restarted' : 'build was restarted'
      console.info(`${newBuilds.length} ${action}`, JSON.stringify(newBuilds))

      const code = 200
      const body = newBuilds
      const response = apiGatewayResponse({body, code})
      return callback(null, response)
    })
    .catch(error => {
      console.info('Error:', error)

      const body = {
        error: error.message
      }
      const code = 400
      const response = apiGatewayResponse({body, code})
      return callback(null, response)
    })
}
