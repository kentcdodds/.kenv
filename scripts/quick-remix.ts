// Menu: New Remix Project
// Description: Create a new Remix project with the KCD Quick Stack
// Shortcut: command option control r
// Author: Kent C. Dodds & John Lindquist
// Twitter: @kentcdodds

import '@johnlindquist/kit'
const generate = await npm('project-name-generator')
const Convert = await npm('ansi-to-html')
const convert = new Convert()

const defaultName = generate({words: 2, alliterative: true}).dashed

const name =
  (await arg({
    name: 'What is this called?',
    placeholder: `Default: ${defaultName}`,
  })) || defaultName

const quickRemixDir = home(`Desktop/locker/quick-remix`)
await ensureDir(quickRemixDir)
const projectPath = path.join(quickRemixDir, name)

const type = await arg({
  name: 'Fresh install or copy?',
  choices: ['copy', 'fresh'],
})

hide()

const copyCommands = [
  `cp -r ~/code/quick-stack ${quickRemixDir} && mv ${path.join(
    quickRemixDir,
    'quick-stack',
  )} ${projectPath}`,
  `cd ${projectPath}`,
  `npm rebuild`,
  `npx remix init`,
  `rm -rf ./.git`,
]

const freshCommands = [
  `npx create-remix ${projectPath} --typescript --install --template kentcdodds/quick-stack`,
]

const gitCommands = [`git init`, `git add .`, `git commit -am 'init'`]

const command = [
  ...(type === 'copy' ? copyCommands : freshCommands),
  ...gitCommands,
].join(' && ')

const initialLog = `<p>Running:\n  ${command
  .split(' && ')
  .join('\n  ')}\n\n----------\n\n</p>`
const logWidget = await widget(
  `
<script>
const logEl = document.querySelector("#log")

const callback = ()=> {
    logEl.lastChild.scrollIntoView()
}
const observer = new MutationObserver(callback)

observer.observe(logEl, {childList: true})
</script>
<div class="font-mono text-xxs w-full h-full p-4">
    <div id="log" v-html="log" class="max-h-full overflow-y-scroll whitespace-pre"/>
</div>
`,
  {
    width: 720,
    height: 480,
    ...(await getBounds()),
    alwaysOnTop: true,
    state: {
      log: initialLog,
    },
  },
)

let currentHtml = initialLog
const handleLog = line => {
  const lineHtml = convert.toHtml(line)
  currentHtml += `<p>${lineHtml}</p>`

  logWidget.setState({
    log: currentHtml,
  })
}

await execLog(command, handleLog)

logWidget.close()

await edit(projectPath)
