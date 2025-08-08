'use client'
import React from 'react';
import 'bytemd/dist/index.css'
import 'highlight.js/styles/default.css'
import 'katex/dist/katex.css'
import { useEffect } from 'react'
import 'github-markdown-css/github-markdown-light.css'
import highlight from '@bytemd/plugin-highlight';
import gfm from '@bytemd/plugin-gfm'

import mediumZoom from '@bytemd/plugin-medium-zoom'
import gemoji from '@bytemd/plugin-gemoji'
import frontmatter from '@bytemd/plugin-frontmatter'
import { Editor } from '@bytemd/react'
import imagePlugin   from '@/plugins/image'
import rehypeExternalLinks from '@/plugins/external-link'
import { create, BaseDirectory, exists, mkdir} from '@tauri-apps/plugin-fs';
import { nanoid } from 'nanoid'

let plugins = [
    gfm(), highlight(), gemoji(), frontmatter(), mediumZoom(), rehypeExternalLinks()
]


export default function MDEditor({
    value,
    onChangeText,
    mode,
    baseDir
}) {
    useEffect(() => {
        plugins = [...plugins, imagePlugin(baseDir)]
    }, [baseDir])
    async function doUploadImages(files) {
        try {
            console.log(files[0].name)
            let buffer = await files[0].arrayBuffer()
            let fileName = nanoid()
            if (!await exists('markdown', { baseDir: BaseDirectory.AppData })) {
                await mkdir('markdown', { baseDir: BaseDirectory.AppData })
            }
            const file = await create('markdown/' + fileName, {
                baseDir: BaseDirectory.AppData,
            });
            console.log(file)
            let result = await file.write(new Uint8Array(buffer));
            console.log(result)
            await file.close();
            return new Promise((resolve, _) => {
                resolve([{
                    url: 'markdown/' + fileName,
                    title: fileName,
                }])
            })
        } catch (e) {
            console.log(e)
            return new Promise((resolve, _) => {
                resolve([{
                    url: 'markdown/' + fileName,
                    title: '失败'
                }])
            })
        }
    }

    return <Editor
        value={value}
        plugins={[...plugins]}
        mode={mode || 'split'}
        uploadImages={doUploadImages}
        onChange={onChangeText}
    />
}