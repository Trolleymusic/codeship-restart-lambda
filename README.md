# codeship-restart-lambda

Restart the last build of a Codeship project using Lambda - _1.0.0 now only works with Codeship API version 2 - use version 0.1.0 for version 1_

### Installation:

* Run `npm install`
* Run `npm run setup`, this creates a number of config files
* Edit `.env` to contain your AWS settings like credentials, AWS region etc
* Edit `.deploy.env` to contain:
  * ~~`CODESHIP_API_KEY` - required, your Codeship API v1 key~~
  * `CODESHIP_USERNAME` - required, your Codeship user's username
  * `CODESHIP_PASSWORD` - required, your Codeship user's password
  * `CODESHIP_ORG_NAME` - required, your Codeship organisation name -- either this and/or `CODESHIP_ORG_UUID` are required
  * `CODESHIP_ORG_UUID` - required, your Codeship organisation uuid -- either this and/or `CODESHIP_ORG_NAME` are required
  * `CODESHIP_REPOSITORY_NAME` - required, your Codeship's project repository name
  * `CODESHIP_BRANCH_NAME` - optional, a branch name to filter - defaults to `master` - you can also set this to '*' to restart the last build of every branch
  * `CODESHIP_TESTING` - optional, when `true` aborts the application before telling Codeship to restart the build thereby saving on build counts
  * `CODESHIP_INCLUDE_TAGS` - optional, when `true` and `CODESHIP_BRANCH_NAME` is set to `*` it will include all tags, which build as separate branches in Codeship, otherwise it ignores them
* Run `npm run package` to build and pack a zip to upload to Lambda
* Upload the zip to Lambda
* Set the environmental variables again in Lambda

### TODO:

* Currently `npm run deploy` isn't working. It seems to be but then the function never shows up in Lambda - get this working so I don't have to upload anything
