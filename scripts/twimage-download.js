// Menu: Twimage Download
// Description: Download twitter images and set their exif info based on the tweet metadata
// Shortcut: command option control t
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import fs from 'fs'
import {fileURLToPath, URL} from 'url'

const exiftool = await npm('node-exiftool')
const exiftoolBin = await npm('dist-exiftool')
const fsExtra = await npm('fs-extra')

const baseOut = home('Pictures/twimages')

const token = await env('TWITTER_BEARER_TOKEN')
const twitterUrl = await arg('Twitter URL')
console.log(`Starting with ${twitterUrl}`)

const tweetId = new URL(twitterUrl).pathname.split('/').slice(-1)[0]
const response = await get(
  `https://api.twitter.com/1.1/statuses/show/${tweetId}.json?include_entities=true`,
  {
    headers: {
      authorization: `Bearer ${token}`,
    },
  },
)

const tweet = response.data
console.log({tweet})

const {
  geo,
  id,
  text,
  created_at,
  extended_entities: {media: medias} = {
    media: [
      {
        type: 'photo',
        media_url_https: await arg({
          ignoreBlur: true,
          placeholder: `Can't find media. What's the URL for the media?`,
          hint: `Media URL`,
        }),
      },
    ],
  },
} = tweet

const [latitude, longitude] = geo?.coordinates || []

const ep = new exiftool.ExiftoolProcess(exiftoolBin)

await ep.open()

for (const media of medias) {
  let url
  if (media.type === 'photo') {
    url = media.media_url_https
  } else if (media.type === 'video') {
    let best = {bitrate: 0}
    for (const variant of media.video_info.variants) {
      if (variant.bitrate > best.bitrate) best = variant
    }
    url = best.url
  } else {
    throw new Error(`Unknown media type for ${twitterUrl}: ${media.type}`)
  }
  if (!url) throw new Error(`Huh... no media url found for ${twitterUrl}`)

  const formattedDate = formatDate(created_at)
  const colonDate = formattedDate.replace(/-/g, ':')
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
      ...(geo
        ? {
            GPSLatitudeRef: latitude > 0 ? 'North' : 'South',
            GPSLongitudeRef: longitude > 0 ? 'East' : 'West',
            GPSLatitude: latitude,
            GPSLongitude: longitude,
            GPSDateStamp: colonDate,
            GPSDateTime: formattedTimestamp,
          }
        : null),
    },
    ['overwrite_original'],
  )
}

await ep.close()
notify(`All done with ${twitterUrl}`)

function formatDate(t) {
  const d = new Date(t)
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(
    d.getDate(),
  )}`
}
function formatTimestamp(t) {
  const d = new Date(t)
  const formattedDate = formatDate(t)
  return `${formatDate(t)} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
}
function padZero(n) {
  return String(n).padStart(2, '0')
}

async function getGeoCoords(placeId) {
  const response = await get(
    `https://api.twitter.com/1.1/geo/id/${placeId}.json`,
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
  )
  const [longitude, latitude] = response.data.centroid
  return {latitude, longitude}
}

async function download(url, out) {
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
