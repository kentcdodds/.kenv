// Menu: Kit > Lookup
// Description: Query kit
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import '@johnlindquist/kit'
const KIT_API_SECRET = await env('KIT_API_SECRET')
const KIT_API_KEY = await env('KIT_API_KEY')

const query = await arg('query')
let urlString
if (query.includes('@')) {
  const sub = await getKitSubscriber(query)
  if (sub?.id) {
    urlString = `https://app.kit.com/subscribers/${sub.id}`
  }
}

if (!urlString) {
  const url = new URL(`https://app.kit.com/subscribers`)
  url.searchParams.set('q', query)
  url.searchParams.set('status', 'all')
  urlString = url.toString()
}
exec(`open "${urlString}"`)

async function getKitSubscriber(email) {
  const url = new URL('https://api.kit.com/v3/subscribers')
  url.searchParams.set('api_secret', KIT_API_SECRET)
  url.searchParams.set('email_address', email)

  const resp = await fetch(url.toString())
  const json = await resp.json()
  const {subscribers: [subscriber] = []} = json

  return subscriber
}
