'use client'
import React from 'react'
import { Card, Link, Space, Input, Button, Message, Radio, Divider, Modal } from '@arco-design/web-react';
import api from '@/util/api'
import cache from '@/util/cache'
import JSONEditor from '@/component/JSONEditor';
const RadioGroup = Radio.Group;
const cacheKey = 'github-config'
async function getConfig() {
    let result = await cache.getJSON(cacheKey)
    return result
}
async function cacheSetConfig(data) {
    let result = await cache.setJSON(cacheKey, data)
    return result
}

async function getBookmarks(token, gist_id) {
    let detail = await api.getGithubGist(token, gist_id)
    let fileNames = Object.keys(detail.files)
    let list = []
    for (var i in fileNames) {

        if (detail.files[fileNames[i]].language == 'JSON') {
            console.log(i, fileNames[i], detail.files[fileNames[i]])
            let result = await api.getGithubGistFile(detail.files[fileNames[i]].raw_url)
            if (isBookmarkData(result)) {
                list.push({
                    'classify': fileNames[i],
                    'list': result
                })
            }
        }
    }

    return list
}

function isBookmarkData(jsonData) {
    return jsonData.length != undefined && jsonData[0].url != undefined
}


export default function App() {
    var editor = null;
    const [ready, setReady] = React.useState(false)
    const [config, setConfig] = React.useState({ 'token': '', 'gist_id': '' })
    const [visible, setVisible] = React.useState(false)
    const [gistID, setGistID] = React.useState('')
    const [tmpGistID, setTmpGistID] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [token, setToken] = React.useState('')
    const [gistList, setGistList] = React.useState([])
    const [bookmark, setBookmarkData] = React.useState([])
    const [open, setOpen] = React.useState(false)
    const [editClassify, setEditClassify] = React.useState('')
    async function initSetting() {
        let config = await getConfig()
        if (config == false || config == null || config.token == undefined) {
            setReady(true)
            return
        }
        setConfig(config)
        setToken(config.token)
        setBookmarks(config)
        setReady(true)
    }
    async function finishSet() {
        setConfig({
            token: token,
            gist_id: tmpGistID,
        })
        cacheSetConfig({
            token: token,
            gist_id: tmpGistID,
        })
        setBookmarks({
            token: token,
            gist_id: tmpGistID,
        })
    }
    async function setBookmarks(input) {
        let data = await getBookmarks(input.token, input.gist_id)
        setBookmarkData(data)
    }

    async function getGists() {
        try {
            setLoading(true)
            let result = await api.getGithubGists(token)
            setGistList(result)
        } catch (e) {
            Message.error(e.message)
        }
        setLoading(false)

    }
    React.useEffect(() => {
        initSetting()
    }, [])

    const doEditJSON = async (name) => {
        setOpen(true)
        setEditClassify(name)
        for (var i in bookmark) {
            if (bookmark[i].classify === name) {
                if (editor != null) {
                    editor.set(bookmark[i].list)
                } else {
                    setTimeout(() => {
                        editor.set(bookmark[i].list)
                    }, 600)
                }
                return
            }
        }
    }

    const doUpdate = async () => {
        let result = api.updateGithubGistFile(config.token, config.gist_id, editClassify, JSON.stringify(editor.get()))
        console.log(result)
    }

    const clear = async function() {
        cacheSetConfig({
            token: '',
            gist_id: '',
        })
        Message.info('success')
    }

    if (!ready) {
        return '获取数据中'
    }

    return <div id="app">
        <p>
            <Button onClick={clear}>Clear</Button>
        </p>
        {
            (config.gist_id.length < 1) ? <Card title='选择gists'>
                <div>
                    Github Token：<Input.TextArea value={token} onChange={setToken} style={{ width: '60%' }} placeholder="token"></Input.TextArea>
                    <Button onClick={getGists} type='outline' style={{ marginLeft: 8 }} loading={loading}>查询gists</Button>
                </div>
                <Divider orientation='left'>Gists列表</Divider>
                <RadioGroup direction='vertical' value={tmpGistID} onChange={setTmpGistID}>
                    {
                        gistList.map(item => {
                            return <Radio value={item.id}>{item.description}</Radio>
                        })
                    }
                </RadioGroup>
                {
                    tmpGistID.length > 0 ? <p>
                        <Button onClick={finishSet} type='text' style={{ marginLeft: 8 }} loading={loading}>确认选择该gists作为书签保存位置？</Button>
                    </p> : null
                }
            </Card> : null
        }
        {
            bookmark.map(item => {
                return <Card title={<>
                    {item.classify} <Button type='text' onClick={doEditJSON.bind(this, item.classify)}>修改</Button>
                </>} style={{ margin: '8px 0' }}>
                    <Space size={'large'}>
                        {item.list.map(tmp => {
                            return <Link href={tmp.url} target='_blank' key={tmp.url}>{tmp.name || tmp.url}</Link>
                        })}
                    </Space>
                </Card>
            })
        }
        <Modal
            title={editClassify}
            alignCenter={false}
            visible={open}
            style={{ width: '60%', top: '100' }}
            autoFocus={false}
            focusLock={true}
            onCancel={() => { setOpen(false) }}
            onOk={doUpdate}
        >
            <JSONEditor height={'300px'} ref={(ele) => {
                editor = ele
            }} />
        </Modal>
    </div>

}
