'use client'
import { useEffect } from 'react';
import 'bytemd/dist/index.css'
import 'highlight.js/styles/default.css'
import 'katex/dist/katex.css'
import 'github-markdown-css/github-markdown-light.css'
import highlight from '@bytemd/plugin-highlight';
import gfm from '@bytemd/plugin-gfm'
import rehypeExternalLinks from '@/plugins/external-link'
import mediumZoom from '@bytemd/plugin-medium-zoom'
import gemoji from '@bytemd/plugin-gemoji'
import frontmatter from '@bytemd/plugin-frontmatter'
import {  Viewer } from '@bytemd/react'
import imagePlugin   from '@/plugins/image'

let plugins = [
    gfm(), highlight(), gemoji(), frontmatter(), mediumZoom(), rehypeExternalLinks()
]

export default function MDViewer({
    value,
    baseDir,
}) {
    useEffect(() => {
        plugins = [...plugins, imagePlugin(baseDir)]
    }, [baseDir])
    return <Viewer value={value} plugins={[ ...plugins]} />   
}