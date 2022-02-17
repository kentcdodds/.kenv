// Menu: Update EpicReact deps
// Description: Update all the dependencies in the epicreact workshop repos

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

const script = `git add -A && git stash && git checkout main && git pull && ./scripts/update-deps && git commit -am "update all deps" --no-verify && git push && git status`
for (const repo of repos) {
  const scriptString = JSON.stringify(
    `cd ~/code/epic-react/${repo} && ${script}`,
  )
  exec(
    `osascript -e 'tell application "Terminal" to activate' -e 'tell application "Terminal" to do script ${scriptString}'`,
  )
}
