// Menu: Open EpicWeb Repos
// Description: Open all the EpicWeb Repos in VSCode

import '@johnlindquist/kit'

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

for (const dir of workshopDirs) {
  edit(dir)
}
