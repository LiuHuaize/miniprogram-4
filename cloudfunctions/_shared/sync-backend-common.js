const fs = require('fs')
const path = require('path')

const sourcePath = path.join(__dirname, 'backend-common.js')
const targetFiles = [
  'childrenSave/backend-common.js',
  'submissionSubmit/backend-common.js',
  'submissionUpdate/backend-common.js'
]

const source = fs.readFileSync(sourcePath, 'utf8')
const prefix = '// Generated from cloudfunctions/_shared/backend-common.js\n'

targetFiles.forEach((targetFile) => {
  const targetPath = path.join(__dirname, '..', targetFile)
  fs.writeFileSync(targetPath, `${prefix}${source}`, 'utf8')
  console.log(`synced ${targetFile}`)
})
