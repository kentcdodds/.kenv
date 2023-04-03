// Menu: ConvertKit > Lookup
// Description: Query convertkit
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import '@johnlindquist/kit'
const CONVERT_KIT_API_SECRET = await env('CONVERT_KIT_API_SECRET')
const CONVERT_KIT_API_KEY = await env('CONVERT_KIT_API_KEY')

const query = await arg('query')
let urlString
if (query.includes('@')) {
  const sub = await getConvertKitSubscriber(query)
  if (sub?.id) {
    urlString = `https://app.convertkit.com/subscribers/${sub.id}`
  }
}

if (!urlString) {
  const url = new URL(`https://app.convertkit.com/subscribers`)
  url.searchParams.set('utf8', '✓')
  url.searchParams.set('search', query)
  url.searchParams.set('status', 'all')
  urlString = url.toString()
}
exec(`open "${urlString}"`)

async function getConvertKitSubscriber(email) {
  const url = new URL('https://api.convertkit.com/v3/subscribers')
  url.searchParams.set('api_secret', CONVERT_KIT_API_SECRET)
  url.searchParams.set('email_address', email)

  const resp = await fetch(url.toString())
  const json = await resp.json()
  const {subscribers: [subscriber] = []} = json

  return subscriber
}
