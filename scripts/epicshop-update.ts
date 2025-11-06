// Name: EpicShop Update
// Description: Update the EpicShop workshop app in all the epic web workshop repos
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import '@johnlindquist/kit'
import {globby} from 'globby'
import {execa} from 'execa'
import chalk from 'chalk'
import fs from 'fs/promises'

async function getLatestMtime(dir: string) {
  const files = await fs.readdir(dir, {withFileTypes: true})
  let latestMtime = 0
  for (const file of files) {
    if (file.name === 'node_modules') continue
    const fullPath = path.join(dir, file.name)
    const stats = await fs.stat(fullPath)
    latestMtime = Math.max(latestMtime, stats.mtime.getTime())
    if (file.isDirectory()) {
      latestMtime = Math.max(latestMtime, await getLatestMtime(fullPath))
    }
  }
  return latestMtime
}

async function findWorkshopDirs(startDir: string) {
  const dirs = await fs.readdir(startDir, {withFileTypes: true})
  const workshopDirs = []

  for (const dir of dirs) {
    if (!dir.isDirectory() || dir.name === 'node_modules') continue
    const fullPath = path.join(startDir, dir.name)
    const epicshopPath = path.join(fullPath, 'epicshop')
    const packageJsonPath = path.join(fullPath, 'package.json')

    const pkgStat = await fs.stat(packageJsonPath).catch(() => null)
    const hasPkgJson = pkgStat ? pkgStat.isFile() : false
    if (hasPkgJson) {
      const epicshopDirStat = await fs.stat(epicshopPath).catch(() => null)
      const hasEpicshopDir = epicshopDirStat
        ? epicshopDirStat.isDirectory()
        : false
      if (hasEpicshopDir) {
        workshopDirs.push(fullPath)
      }
      // once we find a package.json, we don't need to look deeper
      continue
    }

    workshopDirs.push(...(await findWorkshopDirs(fullPath)))
  }

  return workshopDirs
}

async function getSortedWorkshopDirs() {
  const workshopDirs = [
    ...(await findWorkshopDirs(path.join(home(), 'code'))),
    ...(await findWorkshopDirs(path.join(home(), 'Desktop'))),
  ]

  const workshopDirsWithMtime = await Promise.all(
    workshopDirs.map(async dir => ({
      dir,
      mtime: await getLatestMtime(dir),
    })),
  )

  workshopDirsWithMtime.sort((a, b) => b.mtime - a.mtime)

  const sortedWorkshopDirs = workshopDirsWithMtime.map(({dir}) => dir)

  return sortedWorkshopDirs
}

async function updateWorkshopRepos(workshopDirs: Array<string>) {
  const version = (
    await execaCommand('npm show @epic-web/workshop-app version')
  ).stdout.trim()

  // do npm show for the rest of the packages so we trigger a version update on all packages
  await Promise.all([
    execaCommand('npm show @epic-web/workshop-cli version'),
    execaCommand('npm show @epic-web/workshop-presence version'),
    execaCommand('npm show @epic-web/workshop-utils version'),
  ])

  console.log(`🔍 Updating to version ${version}`)

  for (const workshopDir of workshopDirs) {
    const workshopDirName = path.basename(workshopDir)
    const pkgs = await globby(`**/package.json`, {
      cwd: workshopDir,
      gitignore: true,
    })
    let changed = false
    console.log(`🔍 ${workshopDirName} - updating version`)
    const hasChanges =
      (
        await execa('git', ['status', '--porcelain'], {
          env: {},
          cwd: workshopDir,
        })
      ).stdout.trim() !== ''
    if (hasChanges) {
      try {
        await execa('git', ['stash'], {env: {}, cwd: workshopDir, all: true})
      } catch (error) {
        console.log(error.all)
        throw `❌  ${workshopDirName} failed to stash properly`
      }
    }
    for (const pkg of pkgs) {
      const pkgPath = path.join(workshopDir, pkg)
      const contents = await readFile(pkgPath, 'utf8')
      const newContents = contents.replace(
        /(@epic-web\/workshop-[^":]+":\s*")([^"]+)"/g,
        `$1^${version}"`,
      )
      if (contents === newContents) continue
      await writeFile(pkgPath, newContents)
      changed = true
    }
    if (changed) {
      try {
        await execa('npm', ['install'], {env: {}, cwd: workshopDir, all: true})
        const pkgLocks = await globby('**/package-lock.json', {
          cwd: workshopDir,
          gitignore: true,
        })
        await execa('git', ['add', ...pkgLocks, ...pkgs], {
          env: {},
          cwd: workshopDir,
          all: true,
        })
        await execa(
          'git',
          ['commit', '-m', 'chore: update @epic-web/workshop-app'],
          {env: {}, cwd: workshopDir, all: true},
        )
        await execa('git', ['pull'], {env: {}, cwd: workshopDir, all: true})
        await execa('git', ['push'], {env: {}, cwd: workshopDir, all: true})
        if (hasChanges) {
          await execa('git', ['stash', 'pop'], {
            env: {},
            cwd: workshopDir,
            all: true,
          })
        }
        console.log(`✅ ${workshopDirName} finished`)
      } catch (updateErrorResult) {
        console.log(updateErrorResult.all)
        throw `❌  ${workshopDirName} failed`
      }
    } else {
      console.log(`🟢 ${workshopDirName} already up to date`)
    }
  }
}

async function main() {
  const sortedWorkshopDirs = await getSortedWorkshopDirs()

  console.log(`Found ${sortedWorkshopDirs.length} workshop directories:`)
  console.log(
    sortedWorkshopDirs
      .map(dir => `  ${chalk.cyan('-')} ${chalk.green(path.basename(dir))}`)
      .join('\n'),
  )

  if (sortedWorkshopDirs.length > 30) {
    console.log(
      '🚨  Found more than 30 workshop directories. Are you sure you want to continue?',
    )
    const confirm = await arg({
      placeholder: 'Are you sure you want to continue?',
      hint: `[y]es/[n]o`,
    })
    if (confirm !== 'y') {
      console.log('👋  Exiting')
      return
    }
  }

  await updateWorkshopRepos(sortedWorkshopDirs)
}

await main()
