import React from 'react';
import 'bytemd/dist/index.css'
import { Button, Space, Message } from '@arco-design/web-react';
import { save } from '@tauri-apps/api/dialog';
import invoke from '@/util/invoke'
import common from '@/util/common'
import 'highlight.js/styles/default.css'
import 'katex/dist/katex.css'
import 'github-markdown-css/github-markdown-light.css'
import highlight from '@bytemd/plugin-highlight';
import mermaid from '@bytemd/plugin-mermaid';
import gfm from '@bytemd/plugin-gfm'
import math from '@bytemd/plugin-math'
import rehypeExternalLinks from '@/plugins/external-link'
import mediumZoom from '@bytemd/plugin-medium-zoom'
import gemoji from '@bytemd/plugin-gemoji'
import frontmatter from '@bytemd/plugin-frontmatter'
import { Editor } from '@bytemd/react'
import { IconSave } from '@arco-design/web-react/icon';


const plugins = [
    gfm(), highlight(), mermaid(), math(), gemoji(), frontmatter(), mediumZoom(), rehypeExternalLinks()
]

class App extends React.Component {
    editor = null;
    constructor(props) {
        super(props);
        this.state = {
            file: '',
            value: '',
            viewHeight: 0,
        }
    }
    async componentDidMount() {
        let file = common.getQuery("file", '')
        let content = ''
        if(file.length > 0) {
            content = await invoke.readFile(file)
        }
        
        await this.setState({
            viewHeight: common.getViewHeight(),
            file: file,
            value: content,
        })
        window.onresize = () => {
            this.setState({
                viewHeight: common.getViewHeight(),
            })
        }

    }
    pageTitle = () => {
        if (this.state.file.length > 0) {
            return <h3>编辑`{this.state.file}`</h3>
        }
        return <h3>创建Markdown</h3>
    }
    changeText = async (value) => {
        await this.setState({ value: value })
    }
    toSave = async () => {
        let file = this.state.file
        if (file.length < 1) {
            file = await save({
                filters: [{
                    name: "unknown",
                    extensions: ['md']
                }]
            });
        }
        if (file == null) return;
        await invoke.writeFile(file, this.state.value)
        if(this.state.file.length < 1) {
            Message.info('文件创建成功')
            await this.setState({
                file : file,
            })
            setTimeout(this.props.updateTitle, 100);
            this.props.updateTitle()
        } else {
            Message.info('文件保存成功')
        }
        
    }

    render() {
        return <div style={{ height: this.state.viewHeight, overflow: 'scroll', position: 'relative' }} tabIndex="-1">
            <Editor value={this.state.value}
                plugins={plugins}
                onChange={this.changeText} />
            <div style={{ position: 'fixed', right: '40px', bottom: '100px' }}>
                <Button onClick={this.toSave} type='outline' icon={<IconSave />}>保存</Button>
            </div>
        </div>
    }
}

export default App
