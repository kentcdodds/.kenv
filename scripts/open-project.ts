// Menu: Open Project
// Description: Opens a project in code
// Shortcut: cmd shift .

// Reminder: If the window isn't showing up, hit ⌘+0 from the main window to
// bring it to the center
import '@johnlindquist/kit'
import path from 'path'
import fs from 'fs'
import os from 'os'

async function isDirectory(filePath: string) {
  try {
    const stat = await fs.promises.stat(filePath)
    return stat.isDirectory()
  } catch (e) {
    return false
  }
}
async function isFile(filePath: string) {
  try {
    const stat = await fs.promises.stat(filePath)
    return stat.isFile()
  } catch (e) {
    return false
  }
}

async function getProjects(parentDir: string) {
  const codeDir = ls(parentDir).stdout.split('\n').filter(Boolean)
  const choices = []
  for (const dir of codeDir) {
    let fullPath = dir
    if (!path.isAbsolute(dir)) {
      fullPath = path.join(parentDir, dir)
    }
    if (fullPath.includes('/node_modules/')) continue
    if (fullPath.includes('/build/')) continue
    if (fullPath.includes('/dist/')) continue
    if (fullPath.includes('/coverage/')) continue
    if (fullPath.includes('/.cache/')) continue

    const pkgjson = path.join(fullPath, 'package.json')
    if (await isFile(pkgjson)) {
      choices.push({
        name: dir,
        value: fullPath,
        description: fullPath,
      })
    } else if (await isDirectory(fullPath)) {
      choices.push(...(await getProjects(fullPath)))
    }
  }
  return choices
}

const choice = await arg('Which project?', [
  ...(await getProjects(path.join(os.homedir(), 'code'))),
  ...(await getProjects(path.join(os.homedir(), 'Desktop'))),
])

await edit(choice)
