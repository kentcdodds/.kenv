// Menu: Cloudinary upload
// Description: Upload an image to cloudinary
// Shortcut: command option control c
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import path from 'path'

const cloudinaryCloudName = await env('CLOUDINARY_CLOUD_NAME')
const cloudinaryKey = await env('CLOUDINARY_API_KEY')
const cloudinarySecret = await env('CLOUDINARY_API_SECRET')

await npm('cloudinary')
import cloudinary from 'cloudinary'

const cacheDb = await db('cloudinary-cache', {lastChoice: '', folders: {}})
await cacheDb.read()

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryKey,
  api_secret: cloudinarySecret,
  secure: true,
})

let chosenDirectory = await cacheDb.data.lastChoice
let directory
while (directory !== '.') {
  const directories = await getFolders(chosenDirectory)
  directory = await arg(
    `Select folder in ${chosenDirectory}`,
    [
      {name: '.', value: '.', description: 'choose this folder'},
      !chosenDirectory
        ? null
        : {name: '..', value: '..', description: 'go up a directory'},
      ...directories.map(folder => ({
        name: folder.name,
        value: folder.path,
      })),
    ].filter(Boolean),
  )
  if (directory === '..') {
    chosenDirectory = chosenDirectory.split('/').slice(0, -1).join('/')
  } else if (directory === '.') {
    break
  } else {
    chosenDirectory = directory
  }
}
console.log('selected choice', chosenDirectory)

cacheDb.data.lastChoice = chosenDirectory
await cacheDb.write()

const [{path: imagePath}] = await arg({
  placeholder: 'Drop the image you want to upload',
  drop: true,
  ignoreBlur: true,
})

const defaultName = path.parse(imagePath).name

const name =
  (await arg({
    placeholder: `Name of the image?`,
    hint: `Default is: "${defaultName}"`,
  })) || defaultName

console.log('image path', imagePath, name)

const uploadedImage = await cloudinary.v2.uploader.upload(imagePath, {
  public_id: name,
  overwrite: false,
  folder: chosenDirectory,
})

await copy(uploadedImage.secure_url)
await notify(`URL for ${name} copied to clipboard`)

async function getFolders(directory) {
  const cachedDirectories = cacheDb.data.folders[directory]
  if (cachedDirectories) return cachedDirectories

  const {folders: directories} = !directory
    ? await cloudinary.v2.api.root_folders()
    : await cloudinary.v2.api.sub_folders(directory)

  cacheDb.data.folders[directory] = directories

  await cacheDb.write()

  return directories
}
