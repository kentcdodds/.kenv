// Menu: Twimage Download
// Description: Download twitter images and set their exif info based on the tweet metadata
// Shortcut: command option control t
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import '@johnlindquist/kit'
import fs from 'fs'
import {URL} from 'url'
import {getTweet} from '../lib/twitter'

const exiftool = await npm('node-exiftool')
const exiftoolBin = await npm('dist-exiftool')
const fsExtra = await npm('fs-extra')

const baseOut = home('Pictures/twimages')

const twitterUrl = await arg('Twitter URL')
console.log(`Starting with ${twitterUrl}`)

const tweetId = new URL(twitterUrl).pathname.split('/').slice(-1)[0]
const tweet = await getTweet(tweetId)

console.log({tweet})

const {
  text,
  created_at,
  mediaDetails = [
    {
      type: 'photo',
      media_url_https: await arg({
        ignoreBlur: true,
        placeholder: `Can't find media. What's the URL for the media?`,
        hint: `Media URL`,
      }),
    },
  ],
} = tweet

const ep = new exiftool.ExiftoolProcess(exiftoolBin)

await ep.open()

for (const media of mediaDetails) {
  let url: string
  if (media.type === 'photo') {
    url = media.media_url_https
  } else if (media.type === 'video') {
    let best: (typeof media.video_info.variants)[number]
    for (const variant of media.video_info.variants) {
      if (!best || variant.bitrate > best.bitrate) best = variant
    }
    url = best.url
  } else {
    throw new Error(`Unknown media type for ${twitterUrl}: ${media.type}`)
  }
  if (!url) throw new Error(`Huh... no media url found for ${twitterUrl}`)

  const formattedDate = formatDate(created_at)
  const formattedTimestamp = formatTimestamp(created_at)
  const filename = new URL(url).pathname.split('/').slice(-1)[0]
  const filepath = path.join(
    baseOut,
    formattedDate.split('-').slice(0, 2).join('-'),
    /\..+$/.test(filename) ? filename : `${filename}.jpg`,
  )

  await download(url, filepath)

  await ep.writeMetadata(
    filepath,
    {
      ImageDescription: `${text.split('\n').join(' ')} – ${twitterUrl}`,
      Keywords: 'photos from tweets',
      DateTimeOriginal: formattedTimestamp,
      FileModifyDate: formattedTimestamp,
      ModifyDate: formattedTimestamp,
      CreateDate: formattedTimestamp,
    },
    ['overwrite_original'],
  )
}

await ep.close()
notify(
  `
All done with ${twitterUrl}
Media File Count: ${mediaDetails.length}
`.trim(),
)

function formatDate(t: string) {
  const d = new Date(t)
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(
    d.getDate(),
  )}`
}
function formatTimestamp(t: string) {
  const d = new Date(t)
  return `${formatDate(t)} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
}
function padZero(n: number) {
  return String(n).padStart(2, '0')
}

async function download(url: string, out: string) {
  console.log(`downloading ${url} to ${out}`)
  await fsExtra.ensureDir(path.dirname(out))

  const writer = fs.createWriteStream(out)
  const response = await get(url, {responseType: 'stream'})
  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(out))
    writer.on('error', reject)
  })
}
