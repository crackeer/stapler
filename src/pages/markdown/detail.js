import React from 'react';
import 'jsoneditor/dist/jsoneditor.css';
import { Button, Modal, List, Link, Space, Message } from '@arco-design/web-react';
import cache from '@/util/cache';
import invoke from '@/util/invoke'
import common from '@/util/common'
import 'bytemd/dist/index.css'
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

class App extends React.Component {
    editor = null;
    constructor(props) {
        super(props);
        this.state = {
            file: '',
            value: null,
            viewHeight: 0,
        }
    }
    async componentDidMount() {
        let file = common.getQuery("file")
        let content = await invoke.readFile(file)
        const { sep } = await import('@tauri-apps/api/path')
        await this.setState({
            file: file,
            value: content,
            viewHeight: common.getViewHeight(),
            sep: sep,
        })
        cache.addOpenFiles([file])
        setTimeout(this.props.updateTitle, 100)
    }
    pageTitle = () => {
        return <h3>Markdown： `{this.state.file} `</h3>
    }

    render() {
        if(this.state.file.length < 1) {
            return null
        }
        return <div style={{ margin: '0 auto', width: '70%' }}>
           <Viewer value={this.state.value} plugins={[image(this.state.file, this.state.sep), ...plugins]} /> 
        </div>
    }
}

export default App
