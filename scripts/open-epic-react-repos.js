// Menu: Open EpicReact Repos
// Description: Open all the EpicReact Repos in VSCode

import '@johnlindquist/kit'
const repos = [
  'advanced-react-hooks',
  'advanced-react-patterns',
  'bookshelf',
  'react-fundamentals',
  'react-hooks',
  'react-performance',
  'react-suspense',
  'testing-react-apps',
]

for (const repo of repos) {
  edit(`~/code/epic-react/${repo}`)
}
