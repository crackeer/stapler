import React from 'react';
import 'bytemd/dist/index.css'
import { useEffect } from 'react'
import 'highlight.js/styles/default.css'
import 'katex/dist/katex.css'
import 'github-markdown-css/github-markdown-light.css'
import highlight from '@bytemd/plugin-highlight';
import mermaid from '@bytemd/plugin-mermaid';
import gfm from '@bytemd/plugin-gfm'
import math from '@bytemd/plugin-math'
import image from '@/plugins/image'
import copyCode from '@/plugins/code-copy'
import rehypeExternalLinks from '@/plugins/external-link'
import mediumZoom from '@bytemd/plugin-medium-zoom'
import gemoji from '@bytemd/plugin-gemoji'
import frontmatter from '@bytemd/plugin-frontmatter'
import {  Viewer } from '@bytemd/react'

const plugins = [
    gfm(), highlight(), mermaid(), math(), gemoji(), frontmatter(), mediumZoom(), rehypeExternalLinks(), copyCode()
]

const MDViewer = (props) => {
    const [sep, setSep] = React.useState("/");


    const initValue = async (file) => {
        const { sep } = await import('@tauri-apps/api/path')
        setSep(sep)
    }

    useEffect(() => {
        initValue()
    }, [])
    return <Viewer value={props.value} plugins={[ ...plugins]} />   
}

export default MDViewer;