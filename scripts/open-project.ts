// Menu: Open Project
// Description: Opens a project in code
// Shortcut: cmd shift .
// Cache: true

import '@johnlindquist/kit'
import path from 'path'
import fs from 'fs'
import os from 'os'

const projects = []

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

const ignoredDirectories = [
  'node_modules',
  'build',
  'dist',
  'coverage',
  '.cache',
]

async function getProjects(parentDir: string) {
  const codeDir = ls(parentDir).stdout.split('\n').filter(Boolean)
  const choices = []
  for (const dir of codeDir) {
    let fullPath = dir
    if (!path.isAbsolute(dir)) {
      fullPath = path.join(parentDir, dir)
    }
    if (ignoredDirectories.some(dir => fullPath.includes(`/${dir}/`))) continue

    const pkgjson = path.join(fullPath, 'package.json')
    if (await isFile(pkgjson)) {
      choices.push({
        name: dir,
        value: fullPath,
        description: fullPath,
        lastModified: (await fs.promises.stat(pkgjson)).mtime.getTime(),
        // gotta figure out how to make getting the last modified time of the directory not slow
        // lastModified: await getDirectoryLastModified(fullPath),
        // this is kinda fast, but still not very fast.
        // latestCommitTime: await getLatestCommitTime(fullPath),
      })
    } else if (await isDirectory(fullPath)) {
      choices.push(...(await getProjects(fullPath)))
    }
  }
  return choices
}

// async function getLatestCommitTime(dir: string) {
//   const gitDir = path.join(dir, '.git')
//   if (await isDirectory(gitDir)) {
//     const gitLog = await exec(`git log -1 --format=%at`, {
//       cwd: dir,
//     })
//     return parseInt(gitLog.stdout) * 1000
//   } else {
//     const pkgjson = path.join(dir, 'package.json')
//     return (await fs.promises.stat(pkgjson)).mtime.getTime()
//   }
// }

// async function getDirectoryLastModified(dir: string) {
//   const files = await fs.promises.readdir(dir)
//   const filteredFiles = files.filter(file => !ignoredDirectories.includes(file))
//   let lastModified = 0
//   for (const file of filteredFiles) {
//     const filePath = path.join(dir, file)
//     if (await isFile(filePath)) {
//       const stat = await fs.promises.stat(filePath)
//       const fileLastModified = stat.mtime.getTime()
//       if (lastModified > lastModified) {
//         lastModified = fileLastModified
//       }
//     } else if (await isDirectory(filePath)) {
//       const directoryLastModified = await getDirectoryLastModified(filePath)
//       if (directoryLastModified > lastModified) {
//         lastModified = directoryLastModified
//       }
//     }
//   }
//   return lastModified
// }

projects.push(...(await getProjects(path.join(os.homedir(), 'code'))))
projects.push(...(await getProjects(path.join(os.homedir(), 'Desktop'))))

const sortedProjectsRecentChanged = projects.sort((a: any, b: any) => {
  return b.lastModified - a.lastModified
})

const choice = await arg('Which project?', sortedProjectsRecentChanged)

process.env.PATH = process.env.PATH.split(path.delimiter)
  .filter(p => !p.includes('.kit'))
  .join(path.delimiter)

// await exec(`/usr/local/bin/code ${choice}`)
// Detached exec - runs in background without blocking the parent process
exec(`/usr/local/bin/cursor ${choice}`, {
  detached: true,
  stdio: 'ignore',
  // Prevent environment inheritance - start with minimal env
  env: {},
})
