// Menu: Shorten
// Description: Shorten a given URL with a given short name via netlify-shortener
// Shortcut: command option control s
// Author: Kent C. Dodds
// Twitter: @kentcdodds

const dir = await env(
  'SHORTEN_REPO_DIRECTORY',
  'Where is your netlify-shortener repo directory?',
)

const longURL = await arg(`What's the full URL?`)
// TODO: figure out how to make this optional
const shortName = await arg(`What's the short name?`)
const netlifyShortenerPath = path.join(
  dir,
  'node_modules/netlify-shortener/dist/index.js',
)
const {baseUrl} = JSON.parse(await readFile(path.join(dir, 'package.json')))

setPlaceholder(`Creating redirect: ${baseUrl}/${shortName} -> ${longURL}`)
const result = exec(
  `node "${netlifyShortenerPath}" "${longURL}" "${shortName}"`,
)

const {stderr, stdout} = result

if (result.code === 0) {
  const lastLine = stdout.split('\n').filter(Boolean).slice(-1)[0]
  notify({
    title: '✅ Short URL created',
    message: lastLine,
  })
} else {
  const getErr = str => str.match(/Error: (.+)\n/)?.[1]
  const error = getErr(stderr) ?? getErr(stdout) ?? 'Unknown error'
  console.error({stderr, stdout})
  notify({
    title: '❌ Short URL not created',
    message: error,
  })
}
