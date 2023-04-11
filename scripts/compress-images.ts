// Menu: Compress Images
// Description: Compress images using imagemin
// Author: Vojta Holik
// Twitter: @vjthlk

/** @type {import("@johnlindquist/kit")} */

import imagemin from 'imagemin'
import imageminJpegtran from 'imagemin-jpegtran'
import imageminJpegRecompress from 'imagemin-jpeg-recompress'
import imageminPngquant from 'imagemin-pngquant'
import imageminSvgo from 'imagemin-svgo'
import imageminGifsicle from 'imagemin-gifsicle'
import {formatBytes} from 'bytes-formatter'

const plugins = [
  imageminJpegtran({
    arithmetic: true,
    progressive: true,
  }),
  imageminJpegRecompress({max: 85}),
  imageminSvgo(),
  imageminGifsicle({
    optimizationLevel: 2,
  }),
  imageminPngquant({
    quality: [0.3, 0.5],
  }),
]

const clipboardImage = await clipboard.readImage()

if (clipboardImage.byteLength) {
  const before = clipboardImage.byteLength
  const buffer = await imagemin.buffer(clipboardImage, {
    plugins: plugins,
  })
  clipboard.writeImage(buffer)
  const after = buffer.byteLength
  notify({
    title: 'Compression finished',
    message: `
Compressed image from clipboard 🗜️
${formatBytes(before)} -> ${formatBytes(after)}
${((after / before) * 100).toFixed(2)}% (${formatBytes(
      before - after,
    )}) savings 🤑
    `.trim(),
  })
} else {
  let selectedFiles = await getSelectedFile()
  let filePaths: Array<string>

  if (selectedFiles) {
    filePaths = selectedFiles.split('\n')
  } else {
    let droppedFiles = await drop({placeholder: 'Drop images to compress'})
    filePaths = droppedFiles.map(file => file.path)
  }

  for (let filePath of filePaths) {
    let directory = path.dirname(filePath)
    await imagemin([filePath], {
      destination: directory,
      plugins: plugins,
    })
  }

  notify({
    title: 'Compression finished',
    message: `Compressed ${filePaths.length} images.`,
  })
}
