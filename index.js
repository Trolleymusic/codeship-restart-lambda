'use strict'
const CodeshipAPI = require('codeship-node-v2')

const orgUuid = process.env.CODESHIP_ORG_UUID
const orgName = process.env.CODESHIP_ORG_NAME
const username = process.env.CODESHIP_USERNAME
const password = process.env.CODESHIP_PASSWORD
const repositoryName = process.env.CODESHIP_REPOSITORY_NAME
const branchName = process.env.CODESHIP_BRANCH_NAME
const testing = process.env.CODESHIP_TESTING === 'true'
const includeTags = process.env.CODESHIP_INCLUDE_TAGS === 'true'

const headers = { 'Content-Type': 'application/json' }

const Codeship = new CodeshipAPI({ orgUuid, orgName, username, password })

const tagRegex = /v(\d+\.\d+\.\d+)/

function restartBuild (build) {
  console.log(`${build.uuid} is last build of branch ${build.branch}`)

  if (testing) {
    const message = 'Aborting early because of CODESHIP_TESTING flag'
    return Promise.reject(new Error(message))
  }

  return Codeship.builds.restart(build.uuid)
    .then(() => (build.uuid))
}

function restartLastBuild (repositoryName, branchName = 'master') {
  console.log(`Ready to query Codeship for ${repositoryName}:${branchName}`)
  return Codeship.projects.list()
    .then(projects => {
      console.log(`${projects.length} project(s) found`)
      return projects.find(project => project.name === repositoryName || project.repository_name === repositoryName)
    })
    .then(project => Codeship.builds.list(project.uuid).then(builds => ({ project, builds })))
    .then(({ project, builds }) => {
      console.log(`${builds.length} build(s) found for ${project.repository_provider}:${project.repository_name}`)
      console.log(`Filtering builds to target ${branchName}`)
      const buildsMap = builds.reduce((builds, build) => {
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
