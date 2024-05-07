// Name: EpicShop Update
// Description: Update the EpicShop workshop app in all the epic web workshop repos
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import '@johnlindquist/kit'
import {globby} from 'globby'
import {execa} from 'execa'

const workshopDirs = [
  // Volume 1
  'full-stack-foundations',
  'web-forms',
  'data-modeling',
  'web-auth',
  'full-stack-testing',

  // Epic React
  'react-fundamentals',
  'react-hooks',
  'advanced-react-apis',
  'advanced-react-patterns',
  'react-performance',
  'react-suspense',
  'react-server-components',
].map(dir => home('code', 'epicweb-dev', dir))

const version = (
  await execaCommand('npm show @epic-web/workshop-app version')
).stdout.trim()

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
      await execa('git', ['status', '--porcelain'], {env: {}, cwd: workshopDir})
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
    const newContents = contents
      .replace(/(@epic-web\/workshop-app":\s*")([^"]+)"/, `$1^${version}"`)
      .replace(/(@epic-web\/workshop-utils":\s*")([^"]+)"/, `$1^${version}"`)
      .replace(/(@epic-web\/workshop-presence":\s*")([^"]+)"/, `$1^${version}"`)
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
