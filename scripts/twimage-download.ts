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

  if (url.endsWith('.m3u8')) {
    // here's an example of the contents of this file. We need to parse the best quality video and download that one.
    // #EXTM3U
    // #EXT-X-VERSION:6
    // #EXT-X-INDEPENDENT-SEGMENTS
    // #EXT-X-MEDIA:NAME="Audio",TYPE=AUDIO,GROUP-ID="audio-32000",AUTOSELECT=YES,URI="/amplify_video/1778425062439391232/pl/mp4a/32000/SFfmtB9lSulDeR-I.m3u8?container=cmaf"
    // #EXT-X-MEDIA:NAME="Audio",TYPE=AUDIO,GROUP-ID="audio-64000",AUTOSELECT=YES,URI="/amplify_video/1778425062439391232/pl/mp4a/64000/6yWPKqkQLL4CyAQW.m3u8?container=cmaf"
    // #EXT-X-MEDIA:NAME="Audio",TYPE=AUDIO,GROUP-ID="audio-128000",AUTOSELECT=YES,URI="/amplify_video/1778425062439391232/pl/mp4a/128000/2ZTMqpezB92ELJ1t.m3u8?container=cmaf"

    // #EXT-X-STREAM-INF:AVERAGE-BANDWIDTH=407200,BANDWIDTH=487683,RESOLUTION=320x320,CODECS="mp4a.40.2,hvc1.1.808000.L60.0",AUDIO="audio-32000"
    // /amplify_video/1778425062439391232/pl/hevc/320x320/fmfn_wJ61oEU85k6.m3u8?container=cmaf
    // #EXT-X-STREAM-INF:AVERAGE-BANDWIDTH=470915,BANDWIDTH=571490,RESOLUTION=320x320,CODECS="mp4a.40.2,avc1.4D4015",AUDIO="audio-32000"
    // /amplify_video/1778425062439391232/pl/avc1/320x320/J9NbCZ6cMaFehZwq.m3u8?container=cmaf
    // #EXT-X-STREAM-INF:AVERAGE-BANDWIDTH=654395,BANDWIDTH=805224,RESOLUTION=540x540,CODECS="mp4a.40.2,hvc1.1.808000.L90.0",AUDIO="audio-64000"
    // /amplify_video/1778425062439391232/pl/hevc/540x540/qwXlCxQcLc1symRs.m3u8?container=cmaf
    // #EXT-X-STREAM-INF:AVERAGE-BANDWIDTH=809212,BANDWIDTH=1004760,RESOLUTION=540x540,CODECS="mp4a.40.2,avc1.4D401E",AUDIO="audio-64000"
    // /amplify_video/1778425062439391232/pl/avc1/540x540/sZ-ASAIqCRF21uZz.m3u8?container=cmaf
    // #EXT-X-STREAM-INF:AVERAGE-BANDWIDTH=864772,BANDWIDTH=1075876,RESOLUTION=720x720,CODECS="mp4a.40.2,hvc1.1.808000.L90.0",AUDIO="audio-128000"
    // /amplify_video/1778425062439391232/pl/hevc/720x720/khFv4h5GxZCcVAL8.m3u8?container=cmaf
    // #EXT-X-STREAM-INF:AVERAGE-BANDWIDTH=1344238,BANDWIDTH=2597570,RESOLUTION=720x720,CODECS="mp4a.40.2,avc1.64001F",AUDIO="audio-128000"
    // /amplify_video/1778425062439391232/pl/avc1/720x720/_dIJCYiqZ7ytoeCF.m3u8?container=cmaf
    console.log(
      'TODO: This is a video. We need to parse the m3u8 file and download the best quality video',
    )
  }

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
