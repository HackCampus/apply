const models = require('../app/database')
const shortid = require('shortid')

const {Application} = models

async function main () {
  const applications = await Application.fetchAll()
  console.log(applications.length, 'applications fetched')
  for (let i = 0; i < applications.length; i++) {
    const application = applications[i]
    const profileToken = shortid.generate()
    try {
      await application.update({profileToken})
    } catch (e) {
      console.error(e)
    }
    console.log(i, 'updated with token', profileToken)
  }
  console.log('done')
  process.exit()
}
main()
