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
const codeTmpl = `for(var i = 1;i< 10000;i++) {
    console.log(i)
}`
const Option = Select.Option;
const Row = Grid.Row;
const Col = Grid.Col;

const presetNodePath = [
    'node',
    '/usr/local/bin/node',
    '/usr/local/node',
]

const setInputNodePath = async (value) => {
    return await cache.set("run_js_code.node_input_path", value)
}

const getInputNodePath = async () => {
    return await cache.get("run_js_code.node_input_path")
}

const setSelectNodePath = async (value) => {
    return await cache.set("run_js_code.select_node_path", value)
}

const getSelectNodePath = async () => {
    return await cache.get("run_js_code.select_node_path")
}

export default function App() {
    const [code, setCode] = React.useState(codeTmpl)
    const [codeID, setCodeID] = React.useState(0)
    const [codeList, setCodeList] = React.useState([])
    const [title, setTitle] = React.useState('')
    const [output, setOutput] = React.useState("")
    const [nodePath, setNodePath] = React.useState(presetNodePath[0])
    const [nodePaths, setNodePaths] = React.useState(presetNodePath)
    const [running, setRunning] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    React.useEffect(() => {
        var initSet = async () => {
            let inputNodePath = await getInputNodePath()
            if (inputNodePath != null) {
                setNodePaths([...presetNodePath, inputNodePath])
            }
            let selectNodePath = await getSelectNodePath()
            if (selectNodePath != null) {
                setNodePath(selectNodePath)
            }

            updateCodeList()
        }
        initSet()
    }, [])
    const updateCodeList = async () => {
        setLoading(true)
        let codeList = await database.getCodeList()
        setCodeList(codeList)
        setLoading(false)
    }
    const runJsCode = async () => {
        setOutput([])
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

    const changeNodePath = (value) => {
        for (var i in presetNodePath) {
            if (value !== presetNodePath[i]) {
                setInputNodePath(value)
            }
        }
        setSelectNodePath(value)
        setNodePath(value)
    }
    const createCode = async () => {
        if (title.length < 1) {
            return
        }
        let result = await database.createCode(title, code)
        updateCodeList()
    }
    const setCurrentCode = async (item) => {
        let detail = await database.getCode(item.id)
        if (detail != null) {
            setCode(detail.content)
            setCodeID(detail.id)
        }
    }
    const updateCode = async () => {
        let result = await database.updateCode(codeID, code);
        Message.success('更新成功');
        updateCodeList()
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
    return <div>
        <Row gutter={5}>
            <Col span={6}>
                <List
                    dataSource={codeList}
                    size='small'
                    loading={loading}
                    render={(item, index) => (
                        <List.Item key={item.id} style={{ background: item.id == codeID ? '#CCCCCC' : '' }} extra={<Link href='#' onClick={deleteCode.bind(null, item)}>删除</Link>}>
                            <Link href='#' onClick={setCurrentCode.bind(null, item)}>{item.title}</Link>
                        </List.Item>
                    )}
                />
            </Col>
            <Col span={18}>
                <CodeMirror
                    value={code} height="350px" extensions={[javascript({ jsx: true })]}
                    onChange={onChange}
                    theme={dracula}
                />
                <div style={{ margin: '10px 0' }}>
                    <Space>
                        <Button onClick={runJsCode} icon={<IconPlayArrow />} loading={running} type='primary'>运行</Button>
                        <Button onClick={() => {
                            setCode('');
                            setCodeID('');
                        }} icon={<IconPlus />} type='primary'>新建</Button>
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
                        {codeID > 0 ? <Button onClick={updateCode} icon={<IconSave />} type='primary'>更新</Button> : null}

                    </Space>
                    <Select
                        placeholder='Please select node path'
                        style={{ width: 345, marginBottom: 20, float: 'right' }}
                        allowCreate
                        onChange={changeNodePath}
                        value={nodePath}
                    >
                        {
                            nodePaths.map(item => {
                                return <Option key={item} value={item}>{item}</Option>
                            })
                        }

                    </Select>
                </div>
                <Input.TextArea value={output} rows={10} placeholder="js output"></Input.TextArea>
            </Col>
        </Row>

    </div>
}
