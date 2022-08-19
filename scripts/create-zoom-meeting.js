// Name: Create Zoom Meeting
// Description: Create Zoom Meeting and copy link to clipboard
// Author: John Lindquist
// Shortcut: command option control z
// Twitter: @johnlindquist

import '@johnlindquist/kit'

let help = `
# Create a Server-to-Server OAuth App

* [Create an app here](https://marketplace.zoom.us/develop/create?source=devdocs).
* Fill out the form

> Scopes - Needs "View and manage all user meetings"
`

let ACCOUNT_ID = await env('ZOOM_ACCOUNT_ID', async () => {
  return await arg(
    {
      placeholder: 'ZOOM_ACCOUNT_ID',
      ignoreBlur: true,
    },
    () => md(help),
  )
})
let CLIENT_ID = await env('ZOOM_CLIENT_ID')
let CLIENT_SECRET = await env('ZOOM_CLIENT_SECRET')

let Authorization =
  'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

let data = new URLSearchParams({
  grant_type: 'account_credentials',
  account_id: ACCOUNT_ID,
})

let config = {headers: {Authorization}}

let response = await post(`https://zoom.us/oauth/token`, data, config)

let {access_token} = response.data

const date = new Date()
const year = date.getFullYear()
const month = (date.getMonth() + 1).toString().padStart(2, '0')
const day = date.getDate().toString().padStart(2, '0')

// @see https:
data = {
  topic: await arg({
    hint: 'Zoom meeting name',
    input: `Meeting with Kent (${year}-${month}-${day})`,
  }),
}
config = {
  headers: {
    Authorization: `Bearer ${access_token}`,
  },
}
response = await post(`https://api.zoom.us/v2/users/me/meetings`, data, config)

let {join_url, pmi, encrypted_password} = response.data

// Copy the URL you're going to share to the clipboard
await copy(join_url)

let params = new URLSearchParams({
  action: 'join',
  confno: pmi,
  pwd: encrypted_password,
})

// Opens Zoom using their URL protocol
await exec(`open 'zoommtg://zoom.us/join?${params}'`)
