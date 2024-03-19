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
import filenamify from 'filenamify'

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

const selectedDir = await getSelectedDir()

const base =
  (await arg({
    placeholder: `Where are the mp3 files?`,
    description: `The directory should contain the metadata.json, mp3 files, an art.jpg file`,
    defaultValue: selectedDir,
    hint: `Should have mp3s and art.jpg. Default is ${selectedDir}`,
    ignoreBlur: true,
  })) || selectedDir

const metadataJsonPath = path.join(base, 'metadata.json')

let specifiedTagsRaw: any
try {
  specifiedTagsRaw = JSON.parse(fs.readFileSync(metadataJsonPath, 'utf-8'))
} catch (error) {
  console.error(error)
  const example = {
    title: 'Title of the book',
    artist: 'Author name',
    subtitle: 'Some description',
    copyright: 'copyright info',
    date: '1988-01-01',
    userDefinedText: [
      {
        description: 'book_genre',
        value: "Children's Audiobooks:Literature & Fiction:Dramatized",
      },
      {
        description: 'narrated_by',
        value: 'BBC',
      },
    ],
  }
  console.error(
    `
Make sure you have a metadata.json file at "${metadataJsonPath}" with the audio files:

${JSON.stringify(example, null, 2)}
    `.trim(),
  )
  const choice = await arg({
    choices: ['Yes', 'No'],
    placeholder: `Create example metadata.json file in ${base}?`,
  })
  if (choice === 'Yes') {
    fs.writeFileSync(metadataJsonPath, JSON.stringify(example, null, 2))
  }
  throw error
}

const specifiedTags = z
  .object({
    title: z.string(),
    artist: z.string(),
    copyright: z.string(),
    subtitle: z.string(),
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

const titleAsFilename = filenamify(title)
const defaultOutputFile = path.join(
  os.homedir(),
  'Desktop',
  `${titleAsFilename}.mp3`,
)
const outputFilepath =
  (await arg({
    placeholder: `Where should the output file be?`,
    ignoreBlur: true,
    hint: `Default is ${defaultOutputFile}`,
  })) || defaultOutputFile

const tmpDir = path.join(
  os.tmpdir(),
  'book-stitcher',
  path.parse(outputFilepath).name,
)
const filesListFile = path.join(tmpDir, 'files.txt')

await ensureDir(tmpDir)
await writeFile(
  filesListFile,
  files.map(file => `file ${shellQuote([file])}`).join('\n'),
)

const bitrate = await arg({
  placeholder: `What bitrate should the audio be?`,
  hint: `The higher the number, the bigger the file. 64k is fine for regular audiobooks, higher for dramatized versions.`,
  choices: ['64k', '128k', '192k'],
  defaultValue: '64k',
})

console.log('stitching')
await execa(
  '/opt/homebrew/bin/ffmpeg', // path to ffmpeg executable
  // prettier-ignore
  [
    '-y', // overwrite output file if it exists
    '-f', 'concat', // set input format to concatenated files
    '-safe', '0', // allow unsafe file access
    '-i', filesListFile, // path to a file containing a list of input files to concatenate
    '-c:a', 'mp3', // set audio codec to mp3
    '-b:a', bitrate, // set audio bitrate to 64 kbps
    outputFilepath, // path to the output file
  ],
  {stdio: 'inherit'}, // inherit standard I/O streams from parent process
)
console.log('finished stitching')

console.log('starting chapters')
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
console.log('chapters finished')

// the types are wrong and the fix hasn't been released.
type CorrectedTags = Omit<Tags, 'userDefinedText'> & {
  userDefinedText: Array<Partial<Tags['userDefinedText'][0]>>
}

const tags = {
  title,
  album: title,
  artist: specifiedTags.artist,
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
} satisfies CorrectedTags

console.log('starting tags')
const result = NodeID3.write(tags as Tags, outputFilepath)
if (result !== true) {
  throw result
}
console.log('tags finished')

export function typedBoolean<T>(
  value: T,
): value is Exclude<T, false | null | undefined | '' | 0> {
  return Boolean(value)
}
