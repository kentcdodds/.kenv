// Menu: ConvertKit > Lookup
// Description: Query convertkit
// Author: Kent C. Dodds
// Twitter: @kentcdodds

const CONVERT_KIT_API_SECRET = await env('CONVERT_KIT_API_SECRET')
const CONVERT_KIT_API_KEY = await env('CONVERT_KIT_API_KEY')

const query = await arg('query')
let url
if (query.includes('@')) {
  const sub = await getConvertKitSubscriber(query)
  if (sub?.id) {
    url = `https://app.convertkit.com/subscribers/${sub.id}`
  }
}

if (!url) {
  url = `https://app.convertkit.com/subscribers?utf8=%E2%9C%93&q=${query}&status=all`
}
exec(`open "${url}"`)

async function getConvertKitSubscriber(email) {
  const url = new URL('https://api.convertkit.com/v3/subscribers')
  url.searchParams.set('api_secret', CONVERT_KIT_API_SECRET)
  url.searchParams.set('email_address', email)

  const resp = await fetch(url.toString())
  const json = await resp.json()
  const {subscribers: [subscriber] = []} = json

  return subscriber
}
