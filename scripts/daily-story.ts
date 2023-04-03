// Menu: Daily Story
// Description: Write a quick story
// Author: Kent C. Dodds
// Shortcut: command option control o
// Twitter: @kentcdodds

import '@johnlindquist/kit'

const dateFns = await npm('date-fns')
const filenamify = await npm('filenamify')

const storyDir = await env(
  'DAILY_STORY_DIRECTORY',
  `Where do you want daily stories to be saved?`,
)

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

Write your story here
`

const filename = filenamify(
  `${date}-${title.toLowerCase().replace(/ /g, '-').replace(/'/g, '')}.md`,
  {replacement: '-'},
)
const filepath = path.join(storyDir, filename)
await writeFile(filepath, md)
await edit(filepath, path.dirname(filepath))

export {}
