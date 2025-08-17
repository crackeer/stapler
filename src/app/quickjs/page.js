'use client'
import React from 'react'
import { Button, Input, Message, Select, Grid, List, Popconfirm, Link, Space, Modal } from '@arco-design/web-react';
import { IconPlayArrow, IconSave, IconPlus } from "@arco-design/web-react/icon";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { dracula } from '@uiw/codemirror-theme-dracula';
import invoke from '@/util/invoke';
import database from '@/util/database';
import cache from '@/util/cache';
const codeTmpl = `(function run() {
    let retData = []
    for(var i = 1;i< 10000;i++) {
        retData.push(i)
    }
    return retData
})()`
const Option = Select.Option;
const Row = Grid.Row;
const Col = Grid.Col;

const presetNodePath = [
    'node',
    '/usr/local/bin/node',
    '/usr/local/node',
]


export default function App() {
    const [code, setCode] = React.useState(codeTmpl)
    const [codeID, setCodeID] = React.useState(0)
    const [codeList, setCodeList] = React.useState([])
    const [title, setTitle] = React.useState('')
    const [output, setOutput] = React.useState("")
    const [running, setRunning] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    React.useEffect(() => {
        var initSet = async () => {
            updateCodeList()
        }
        initSet()
    }, [])
    const updateCodeList = async () => {
        let codeList = await database.getCodeList()
        console.log(codeList)
        setCodeList(codeList)
    }
    const runJsCode = async () => {
        setOutput('')
        setRunning(true)
        let result = await invoke.runJsCode(nodePath, code)
        setRunning(false)
        if (!result.success) {
            Message.error(result.message)
            return
        }
        setOutput(result.data.output)
    }

    const onChange = React.useCallback((val, viewUpdate) => {
        setCode(val);
    }, []);

    const createCode = async () => {
        if (title.length < 1) {
            return
        }
        let result = await database.createCode(title, code)
        updateCodeList()
    }
    const resetCode = async () => {
        setCode(codeTmpl)
    }
    const deleteCode = async (item) => {
        Modal.confirm({
            title: '删除提醒',
            content: '确认删除?',
            onOk: async () => {
                await database.deleteContent(item.id)
                Message.success('删除成功')
                updateCodeList();
                if (codeID == item.id) {
                    setCode('')
                    setCodeID(0)
                }
            }
        })
    }
    const changeJsScript = (item) => {
        setCodeID(item)
        for (let i = 0; i < codeList.length; i++) {
            if (codeList[i].id == item) {
                setCode(codeList[i].content)
            }
        }
    }
    return <div>
        <Row gutter={5}>
            <Col span={24}>
                <div className='mg-b10'>
                    脚本列表：<Select
                        placeholder='请选择脚本'
                        style={{ width: '40%', }}
                        allowCreate
                        onChange={changeJsScript}
                        value={codeID}
                    >
                        {
                            codeList.map(item => {
                                return <Option key={item.id} value={item.id}>{item.title}</Option>
                            })
                        }

                    </Select>
                </div>

                <CodeMirror
                    value={code} height="calc(100vh - 400px)" extensions={[javascript({ jsx: true })]}
                    onChange={onChange}
                    theme={dracula}
                />
                <div style={{ margin: '10px 0' }}>
                    <Space>
                        <Button onClick={runJsCode} icon={<IconPlayArrow />} loading={running} type='primary'>运行</Button>
                        <Button onClick={resetCode} type='primary'>reset</Button>
                        {
                            codeID < 1 ? <Popconfirm
                                title="请输入名字"
                                content={
                                    <Input
                                        onChange={setTitle}
                                        placeholder="请输入名字"
                                    />
                                }
                                onOk={createCode}
                                onCancel={() => {
                                    setTitle('')
                                }}
                            >
                                <Button type="primary" icon={<IconSave />}>
                                    保存
                                </Button>
                            </Popconfirm> : null
                        }
                    </Space>

                </div>
                <Input.TextArea value={output} rows={10} placeholder="js output"></Input.TextArea>
            </Col>
        </Row>

    </div>
}
