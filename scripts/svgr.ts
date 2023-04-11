// Name: svgr
// Menu: SVG to React Component
// Description: Create a React Component from an SVG file or SVG in your clipboard
// Author: Kent C. Dodds
// Twitter: @kentcdodds

/** @type {import("@johnlindquist/kit")} */

import '@johnlindquist/kit'
import {transform} from '@svgr/core'
import {parse} from 'svg-parser'

const currentClipboard = (await paste()) || ''

let isValidSvgInClipboard = false

try {
  parse(currentClipboard)
  isValidSvgInClipboard = true
} catch {
  // do nothing
}

let svgCode: string = ``
if (isValidSvgInClipboard) {
  svgCode = currentClipboard
} else {
  let files = await drop({
    placeholder: `Drop an SVG file like it's hot 🔥`,
    hint: 'Drop an svg file or put an SVG in your clipboard and try again',
  })
  let svgPath = files?.[0]?.path
  if (svgPath) {
    svgCode = await readFile(svgPath, 'utf-8')
  }
}

// get the title from the svg <title> tag
const defaultTitle = svgCode.match(/<title>(.*)<\/title>/)?.[1] || 'Icon'
const title =
  (await arg({
    placeholder: 'Title',
    description: `Defaults to: ${defaultTitle}`,
    defaultValue: defaultTitle,
  })) || defaultTitle

const componentName = title
  .split(' ')
  .filter(Boolean)
  .map(word => word[0].toUpperCase() + word.slice(1))
  .join('')

const jsCode = await transform(svgCode, {
  template(variables, {tpl}) {
    variables.jsx.children.unshift(tpl`<title>{title}</title>`.expression)
    return tpl`
export function ${componentName}({
  size = "1em",
  title = ${JSON.stringify(title)},
}: {
  size?: string | number
  title?: string
}) {
  return ${variables.jsx}
}
      `
  },
  icon: true,
  typescript: true,
  jsxRuntime: 'automatic',
  dimensions: true,
  expandProps: false,
  replaceAttrValues: {
    fill: 'currentColor',
  },
  svgProps: {
    width: '{size}',
    height: '{size}',
  },
  svgoConfig: {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
          },
        },
      },
    ],
  },
  prettierConfig: {
    arrowParens: 'avoid',
    bracketSameLine: false,
    bracketSpacing: true,
    embeddedLanguageFormatting: 'auto',
    endOfLine: 'lf',
    htmlWhitespaceSensitivity: 'css',
    insertPragma: false,
    jsxSingleQuote: false,
    printWidth: 80,
    proseWrap: 'always',
    quoteProps: 'as-needed',
    requirePragma: false,
    semi: false,
    singleAttributePerLine: false,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    useTabs: true,
  },
  prettier: true,
  svgo: true,
  plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx', '@svgr/plugin-prettier'],
})

await copy(jsCode)
notify(`Copied ${componentName} to your clipboard!`)
