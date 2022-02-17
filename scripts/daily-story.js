// Menu: Daily Story
// Description: Write a quick story
// Author: Kent C. Dodds
// Shortcut: command option control o
// Twitter: @kentcdodds

const dateFns = await npm('date-fns')
const filenamify = await npm('filenamify')
const prettier = await npm('prettier')

const storyDir = await env(
  'DAILY_STORY_DIRECTORY',
  `Where do you want daily stories to be saved?`,
)

const story = await textarea({placeholder: 'Write your story here'})

const today = dateFns.format(new Date(), 'yyyy-MM-dd')
const date = await arg({
  input: today,
  hint: 'When did this happen?',
})
const title = await arg({
  placeholder: 'What do you want to call this story?',
  hint: 'Title',
})

const md = `---
title: ${title}
date: ${date}
written: ${today}
---

${story}
`

// prettify the markdown
const prettyMd = await prettier.format(md, {
  parser: 'markdown',
  arrowParens: 'avoid',
  bracketSpacing: false,
  embeddedLanguageFormatting: 'auto',
  htmlWhitespaceSensitivity: 'css',
  insertPragma: false,
  jsxBracketSameLine: false,
  jsxSingleQuote: false,
  printWidth: 80,
  proseWrap: 'always',
  quoteProps: 'as-needed',
  requirePragma: false,
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
  vueIndentScriptAndStyle: false,
})

const filename = filenamify(
  `${date}-${title.toLowerCase().replace(/ /g, '-')}.md`,
  {replacement: '-'},
)
await writeFile(path.join(storyDir, filename), prettyMd)
