// Menu: Cloudinary upload
// Description: Upload an image to cloudinary
// Shortcut: command option control c
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import path from 'path'

const cloudinaryCloudName = await env('CLOUDINARY_CLOUD_NAME')
const cloudinaryKey = await env('CLOUDINARY_API_KEY')
const cloudinarySecret = await env('CLOUDINARY_API_SECRET')
const cloudiaryConsoleId = await env('CLOUDINARY_CONSOLE_ID')

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

const actions = {
  CREATE_NEW: 'creating new folder',
  REFRESH_CACHE: 'refreshing cache',
  OPEN_DIR: 'opening directory',
}

let chosenDirectory = await cacheDb.data.lastChoice
let lastSelection
while (true) {
  // if the last action was to create a new directory then we know the chosen
  // directory is new and has no folders otherwise we have to wait a few seconds
  // for the API to be prepared for us to make a request for the contents.
  const directories =
    lastSelection === actions.CREATE_NEW
      ? []
      : await getFolders(chosenDirectory)
  lastSelection = await arg(
    `Select directory in ${chosenDirectory || '/'}`,
    [
      {name: '.', value: '.', description: '✅ Choose this directory'},
      !chosenDirectory
        ? null
        : {name: '..', value: '..', description: '⤴️ Go up a directory'},
      ...directories.map(folder => ({
        name: folder.name,
        value: folder.path,
        description: '⤵️ Select directory',
      })),
      {
        name: 'Open directory',
        value: actions.OPEN_DIR,
        description: '🌐 Open this directory in the browser',
      },
      {
        name: 'Refresh cache',
        value: actions.REFRESH_CACHE,
        description: '🔄 Refresh the cache for this directory',
      },
      {
        name: 'Create new directory',
        value: actions.CREATE_NEW,
        description: '➕ Create a new directory here',
      },
    ].filter(Boolean),
  )
  if (lastSelection === '..') {
    chosenDirectory = chosenDirectory.split('/').slice(0, -1).join('/')
  } else if (lastSelection === '.') {
    break
  } else if (lastSelection === actions.CREATE_NEW) {
    const newFolderName = await arg(`What's the new folder name?`)
    const newDirectory = `${chosenDirectory}/${newFolderName}`
    await cloudinary.v2.api.create_folder(newDirectory)
    delete cacheDb.data.folders[chosenDirectory]
    chosenDirectory = newDirectory
  } else if (lastSelection === actions.REFRESH_CACHE) {
    delete cacheDb.data.folders[chosenDirectory]
  } else if (lastSelection === actions.OPEN_DIR) {
    await openFolder(chosenDirectory)
  } else {
    chosenDirectory = lastSelection
  }
}

cacheDb.data.lastChoice = chosenDirectory
await cacheDb.write()

const images = await drop('Drop the image(s) you want to upload')

for (const image of images) {
  const defaultName = path.parse(image.path).name

  const name =
    (await arg({
      placeholder: `Name of this image?`,
      hint: `Default is: "${defaultName}"`,
    })) || defaultName

  const uploadedImage = await cloudinary.v2.uploader.upload(image.path, {
    public_id: name,
    overwrite: false,
    folder: chosenDirectory,
  })

  // If you have multiple files then this isn't really useful unless you have
  // clipbloard history (which I recommend you get!)
  await copy(uploadedImage.secure_url)
}

await openFolder(chosenDirectory)

function openFolder(folder) {
  const encodedFolder = encodeURIComponent(folder)
  console.log('opening')
  return exec(
    `open "https://cloudinary.com/console/${cloudiaryConsoleId}/media_library/folders/${encodedFolder}"`,
  )
}

async function getFolders(directory) {
  const cachedDirectories = cacheDb.data.folders[directory]
  if (cachedDirectories) {
    return cachedDirectories
  }

  try {
    const {folders: directories} = !directory
      ? await cloudinary.v2.api.root_folders()
      : await cloudinary.v2.api.sub_folders(directory)

    cacheDb.data.folders[directory] = directories

    await cacheDb.write()

    return directories
  } catch (error) {
    console.error('error with the directory')
    return []
  }
}
