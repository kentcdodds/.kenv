// Menu: Book Stitcher
// Description: Stitch together multiple mp3 files into a single mp3 file
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import '@johnlindquist/kit'

import path from 'path'
import os from 'os'
import fs from 'fs'
import * as mm from 'music-metadata'
import NodeID3 from 'node-id3'
import {type Tags} from 'node-id3'
import {z} from 'zod'
import shellQuote from 'shell-quote/quote.js'

// to convert files from m4a to mp3
// for f in *.m4a; do ffmpeg -i "$f" -codec:v copy -codec:a libmp3lame -q:a 2 newfiles/"${f%.m4a}.mp3"; done

/*
01
├── 1-01.mp3
├── 1-02.mp3
├── 1-03.mp3
... etc...
├── art.jpg
└── metadata.json
*/

const base = await arg({
  placeholder: `Where are the mp3 files?`,
  hint: 'It should be in a directory with the mp3 files and art.jpg',
  ignoreBlur: true,
})

const metadataJsonPath = path.join(base, 'metadata.json')

let specifiedTagsRaw: any
try {
  specifiedTagsRaw = JSON.parse(fs.readFileSync(metadataJsonPath, 'utf-8'))
} catch (error) {
  console.error(
    `
Make sure you have a metadata.json file at "${metadataJsonPath}" with the audio files:

{
  "title": "Title of the book",
  "artist": "Author name",
  "subtitle": "Some description",
  "copyright": "copyright info",
  "date": "1988-01-01",
  "userDefinedText": [
    {
      "description": "book_genre",
      "value": "Children's Audiobooks:Literature & Fiction:Dramatized"
    },
    {
      "description": "narrated_by",
      "value": "BBC"
    },
    {
      "description": "asin",
      "value": -49201153
    }
  ]
}
    `.trim(),
  )
  throw error
}
const specifiedTags = z
  .object({
    title: z.string(),
    artist: z.string(),
    copyright: z.string(),
    subtitle: z.string(),
    albumArtist: z.string(),
    date: z.string(),
    userDefinedText: z.array(
      z.object({
        description: z.string(),
        value: z.string(),
      }),
    ),
  })
  .parse(specifiedTagsRaw)

const {title} = specifiedTags

const files = fs
  .readdirSync(base)
  .filter(n => n.endsWith('.mp3'))
  .map(n => path.join(base, n))
const metadatas = await Promise.all(
  files.map(async filepath => {
    const meta = await mm.parseFile(filepath)
    return {
      filepath,
      duration: meta.format.duration,
      title: meta.common.title,
    }
  }),
)

const defaultOutputFile = path.join(os.homedir(), 'Desktop', `${title}.mp3`)
const outputFilepath =
  (await arg({
    placeholder: `Where should the output file be?`,
    ignoreBlur: true,
    hint: `Default is ${defaultOutputFile}`,
  })) || defaultOutputFile

const tmpDir = path.join(
  os.tmpdir(),
  'book-stitcher',
  title.replaceAll(' ', '_'),
)
const filesListFile = path.join(tmpDir, 'files.txt')

await ensureDir(tmpDir)
await writeFile(
  filesListFile,
  files.map(file => `file ${shellQuote([file])}`).join('\n'),
)

await execa(
  '/opt/homebrew/bin/ffmpeg',
  // prettier-ignore
  [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', filesListFile,
    '-c', 'copy',
    outputFilepath,
  ],
  {stdio: 'inherit'},
)

const chapters = []
let startTimeMs = 0
for (let fileIndex = 0; fileIndex < metadatas.length; fileIndex++) {
  const {duration, title} = metadatas[fileIndex]
  const endTimeMs = startTimeMs + Math.round(duration * 1000)

  chapters.push({
    elementID: `ch${fileIndex}`,
    startTimeMs,
    endTimeMs,
    tags: {title},
  })

  startTimeMs = endTimeMs
}

const tags = {
  title,
  album: title,
  albumArtist: specifiedTags.artist,
  genre: 'Audiobook',
  date: specifiedTags.date.split('-')[0],

  image: path.join(base, 'art.jpg'),
  chapter: chapters,
  ...specifiedTags,
  userDefinedText: [
    specifiedTags.userDefinedText.find(t => t.description === 'year')
      ? null
      : {
          description: 'year',
          value: specifiedTags.date,
        },
    specifiedTags.userDefinedText.find(t => t.description === 'author')
      ? null
      : {
          description: 'author',
          value: specifiedTags.artist,
        },
    specifiedTags.userDefinedText.find(t => t.description === 'comment')
      ? null
      : {
          description: 'comment',
          value: specifiedTags.subtitle,
        },
    ...specifiedTags.userDefinedText,
  ].filter(typedBoolean),
} as Tags
// it's unclear why zod is parsing specifiedTags as optional properties, but
// that's why these aren't considered tags 🤷‍♂️

const result = NodeID3.write(tags, outputFilepath)
if (result !== true) {
  throw result
}

export function typedBoolean<T>(
  value: T,
): value is Exclude<T, false | null | undefined | '' | 0> {
  return Boolean(value)
}
