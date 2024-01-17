// Menu: Open EpicWeb Repos
// Description: Open all the EpicWeb Repos in VSCode

import '@johnlindquist/kit'

const workshopDirs = [
  'full-stack-foundations',
  'web-forms',
  'data-modeling',
  'web-auth',
  'full-stack-testing',
].map(dir => home('code', 'epicweb-dev', dir))

for (const dir of workshopDirs) {
  edit(dir)
}
