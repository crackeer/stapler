'use client'
import React from 'react';
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

const plugins = [
    gfm(), highlight(), gemoji(), frontmatter(), mediumZoom(), rehypeExternalLinks()
]

export default function MDViewer({
    value,
}) {
    return <Viewer value={props.value} plugins={[ ...plugins]} />   
}