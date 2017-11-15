var fs = require('fs')
var readline = require('readline')
var google = require('googleapis')
var googleAuth = require('google-auth-library')
var axios = require('axios')
var moment = require('moment-timezone').tz('Asia/Bangkok')

var SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
  process.env.USERPROFILE) + '/.credentials/'
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json'

const CLIENT_SECRET_FILE = process.env.CLIENT_SECRET_FILE || 'client_secret.json'
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '11lSStysPa2WyFUiEhinJyDkDIoWlrPw6NHYjROKz6jY'
const sheetName = 'v2'

function updateNetpie () {
  console.log('sync time to netpie...')
  fs.readFile(CLIENT_SECRET_FILE, function processClientSecrets (err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err)
      return
    }
    authorize(JSON.parse(content), listMajors)
  })
}

function writeSpreadSheet (body) {

  console.log('sync time to netpie...')
  fs.readFile(CLIENT_SECRET_FILE, function processClientSecrets (err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err)
      return
    }
    authorize(JSON.parse(content), function (auth) {

      var sheets = google.sheets('v4')
      sheets.spreadsheets.values.batchUpdate({
        auth: auth,
        spreadsheetId: SPREADSHEET_ID,
        resource: body
      }, function (err, response) {
        if (err) {
          console.error(err)
          return
        }

        // TODO: Change code below to process the `response` object:
        console.log(JSON.stringify(response, null, 2))
      })

    })
  })

}

function authorize (credentials, callback) {
  var clientSecret = credentials.web.client_secret
  var clientId = credentials.web.client_id
  var redirectUrl = credentials.web.redirect_uris[0]
  var auth = new googleAuth()
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl)

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function (err, token) {
    if (err) {
      getNewToken(oauth2Client, callback)
    }
    else {
      oauth2Client.credentials = JSON.parse(token)
      callback(oauth2Client)
    }
  })
}

function getNewToken (oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  })
  console.log('Authorize this app by visiting this url: ', authUrl)
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.question('Enter the code from that page here: ', function (code) {
    rl.close()
    oauth2Client.getToken(code, function (err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err)
        return
      }
      oauth2Client.credentials = token
      storeToken(token)
      callback(oauth2Client)
    })
  })
}

function storeToken (token) {
  try {
    fs.mkdirSync(TOKEN_DIR)
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token))
  console.log('Token stored to ' + TOKEN_PATH)
}

function listMajors (auth) {

  var sheets = google.sheets('v4')
  sheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!1:1000`
  }, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err)
      return
    }
    var rows = response.values
    if (rows.length === 0) {
      console.log('No data found.')
    } else {
      let header = rows[0]
      console.log(header)
      const mapped = rows.slice(1).map((row) => {
        let retObj = {}
        header.forEach((item, k) => retObj[header[k]] = row[k])
        return retObj
      })

      var reqs = mapped.map((deviceConfig, idx) => {
        return axios.put(deviceConfig.target, deviceConfig['updateTime(minute)']).then(function (response) {
          console.log(`${idx} ${moment.format()} - ${deviceConfig.name} VALUE: ${deviceConfig['updateTime(minute)']} STATUS: ${response.statusText}`)
          return {
            range: `${sheetName}!F${idx + 2}`,
            values: [[moment.format()]]
          }
        })
          .catch(function (error) {
            console.log(error)
          })
      })

      Promise.all(reqs).then(function (results) {
        var beWrittenData = results.filter(value => !!value)
        writeSpreadSheet({
          data: beWrittenData,
          valueInputOption: 'RAW'
        })
        console.log(beWrittenData)
      })

    }
  })

}

updateNetpie()
