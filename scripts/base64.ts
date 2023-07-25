// Name: Base64
// Menu: Base64 Encode
// Description: Base 64 encode anything
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import '@johnlindquist/kit'

const clipboardImage = await clipboard.readImage()
const clipboardText = await clipboard.readText()
const selectedFiles = await getSelectedFile()

const sources = [
  clipboardImage.byteLength
    ? {
        name: 'Clipboard Image',
        encode: async () => clipboardImage.toString('base64'),
      }
    : null,
  clipboardText.length
    ? {
        name: 'Clipboard Text',
        encode: async () => Buffer.from(clipboardText).toString('base64'),
      }
    : null,
  selectedFiles.length
    ? {
        name: 'File Selection',
        encode: async () => {
          const filepath = selectedFiles[0]
          const buffer = await readFile(filepath)
          return buffer.toString('base64')
        },
      }
    : null,
  {
    name: 'Paste Text',
    encode: async () => {
      const text = await arg({placeholder: 'Text to encode'})
      return Buffer.from(text).toString('base64')
    },
  },
  {
    name: 'Drop File',
    encode: async () => {
      const files = await drop({placeholder: 'File to encode'})
      const buffer = await readFile(files[0].path)
      return buffer.toString('base64')
    },
  },
].filter(Boolean)

const source = await arg(
  {placeholder: 'Source?'},
  sources.map(s => s.name),
)

const base64 = await sources.find(s => s.name === source).encode()

console.log(base64)
clipboard.writeText(base64)
