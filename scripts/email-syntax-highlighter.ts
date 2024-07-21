// Name: Email Syntax Highlighter
// Description: Take some code and convert it to HTML with inline styles for syntax highlighting
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import '@johnlindquist/kit'

import {remarkCodeBlocksShiki} from '@kentcdodds/md-temp'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remark2rehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import * as prettier from 'prettier'

const cssVars = `
--base00: #f3f3f3; /* editor background */
--base01: #e0e0e0; /* unused (currently) */
--base02: #d6d6d6; /* unused (currently) */
--base03: #989fb1; /* code comments */
--base04: #969896; /* unused (currently) */
--base05: #2e3039; /* fallback font color */
--base06: #282a2e; /* unused (currently) */
--base07: #1d1f21; /* unused (currently) */
--base08: #0c969b; /* variable references */
--base09: #aa0982; /* numbers */
--base0A: #994cc3; /* keywords */
--base0B: #c96765; /* strings */
--base0C: #aa0982; /* escape characters in strings */
--base0D: #4876d6; /* function calls */
--base0E: #994cc3; /* operators */
--base0F: #d3423e; /* "Embedded" (whatever that means) */
`
  .split('\n')
  .filter(Boolean)
  .reduce((acc, string) => {
    const [key, value] = string.split(':')
    acc[key.trim()] = value.split(';')[0].trim()
    return acc
  }, {})

async function processMarkdown(markdown: string) {
  const result = await unified()
    .use(remarkParse)
    .use(remark2rehype)
    .use(remarkCodeBlocksShiki)
    .use(rehypeStringify)
    .process(markdown)

  return result.value.toString().trim()
}

function replaceCssVars(html: string) {
  return html.replace(/var\((--\w+)\)/g, (match, varName) => {
    return cssVars[varName] || match
  })
}

function cleanupUnusedAttributes(html: string) {
  return html
    .replace(/data-line-number=".+?"/g, '')
    .replace(/class=".+?"/g, '')
    .replace(/data-lang=".+?"/g, '')
    .replace(/data-line-numbers=".+?"/g, '')
    .replace(/data-highlight=".+?"/g, '')
    .replace(/data-add=".+?"/g, '')
    .replace(/data-remove=".+?"/g, '')
    .replace(/data-diff-line-number=".+?"/g, '')
}

function format(html: string) {
  return prettier.format(html, {
    parser: 'html',
    htmlWhitespaceSensitivity: 'ignore',
  })
}

function fixTabSize(html: string) {
  return `<div style="tab-size: 2">${html}</div>`
}

const language = await arg({placeholder: 'What language do you want?'})
const markdown = await editor({
  placeholder: 'Paste your markdown here',
  ignoreBlur: true,
})

const result = fixTabSize(
  await format(
    cleanupUnusedAttributes(
      replaceCssVars(
        await processMarkdown(`
\`\`\`${language}
${markdown}
\`\`\`
`),
      ),
    ),
  ),
)

console.log(result)

clipboard.writeText(result)

notify({
  title: 'Markdown syntax highlighted',
  message: 'Your markdown has been copied to your clipboard',
})
