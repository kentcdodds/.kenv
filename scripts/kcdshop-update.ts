// Name: KCDShop Update
// Description: Update the KCDShop workshop app in all the epicweb-dev workshop repos
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import '@johnlindquist/kit'
import {globby} from 'globby'
import {execa} from 'execa'

const workshopDirs = [
  'full-stack-foundations',
  'web-forms',
  'data-modeling',
  'web-auth',
  'full-stack-testing',
  'react-fundamentals',
  'react-hooks',
  'advanced-react-hooks',
  'advanced-react-patterns',
  'react-performance',
  // 'react-suspense',
  // 'react-server-components',
].map(dir => home('code', 'epicweb-dev', dir))

const version = (
  await execaCommand('npm show @kentcdodds/workshop-app version')
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
    const newContents = contents.replace(
      /(@kentcdodds\/workshop-app":\s*")([^"]+)"/,
      `$1^${version}"`,
    )
    if (contents === newContents) continue
    await writeFile(pkgPath, newContents)
    changed = true
  }
  if (changed) {
    try {
      await execa('npm', ['install'], {env: {}, cwd: workshopDir, all: true})
      await execa('git', ['add', 'package-lock.json', ...pkgs], {
        env: {},
        cwd: workshopDir,
        all: true,
      })
      await execa(
        'git',
        ['commit', '-m', 'chore: update @kentcdodds/workshop-app'],
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
    } catch (playwrightErrorResult) {
      console.log(playwrightErrorResult.all)
      throw `❌  ${workshopDirName} failed`
    }
  } else {
    console.log(`🟢 ${workshopDirName} already up to date`)
  }
}
