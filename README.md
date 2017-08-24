# codeship-restart-lambda

Restart the last build of a Codeship project using Lambda

### Installation:

* Run `npm install`
* Run `npm run setup`, this creates a number of config files
* Edit `.env` to contain your AWS settings like credentials, AWS region etc
* Edit `.deploy.env` to contain:
  * `CODESHIP_API_KEY` - required, your Codeship API v1 key
  * `CODESHIP_REPOSITORY_NAME` - required, your Codeship's project repository name
  * `CODESHIP_BRANCH_NAME` - optional, a branch name to filter - defaults to `master`
  * `CODESHIP_TESTING` - optional, when `true` aborts the application before telling Codeship to restart the build thereby saving on build counts
* Run `npm run package` to build and pack a zip to upload to Lambda
* Upload the zip to Lambda
* Set the environmental variables again in Lambda

### TODO:

* Currently `npm run deploy` isn't working. It seems to be but then the function never shows up in Lambda - get this working so I don't have to upload anything
