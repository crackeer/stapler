'use client'
import React from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Button, Card, Message, Form, Input, Grid, Breadcrumb, Radio, Divider, Space, Link, Table } from "@arco-design/web-react";
import { IconPlayArrow, IconLoading, IconObliqueLine, IconHome } from "@arco-design/web-react/icon";
import cache from "@/util/cache";
import invoke from "@/util/invoke";
import { open as shellOpen } from '@tauri-apps/plugin-shell';
const FormItem = Form.Item;

async function generateQuickDirs(rootDir, currentDir) {
    const { sep } = await import('@tauri-apps/plugin-fs');
    let list = [{
        name: rootDir,
        path: "ROOT",
        icon: <IconHome />
    }]
    if (currentDir.length < 1 || rootDir == currentDir) {
        return list;
    }
    let absPath = currentDir.substr(rootDir.length + 1);
    console.log("generateQuickDirs", absPath, rootDir, currentDir)
    let parts = absPath.split(sep)
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].length > 0) {
            list.push({
                path: parts.slice(0, i + 1).join(sep),
                name: parts[i],
            })
        }
    }
    return list
}

class App extends React.Component {
    columns = [
        {
            'title': '名字',
            'dataIndex': 'name',
            'key': 'name',
            'render': (col, record, index) => (
                record.file_type == 'directory' ? <a href="javascript:;" onClick={this.selectDir.bind(this, record.name)} style={{ textDecoration: 'none' }}>{record.name}</a> : <span>{record.name}</span>
            )
        },
        {
            'title': '大小',
            'dataIndex': 'human_size',
            'key': 'human_size',
        },
        {
            'title': '操作',
            'key': 'opt',
            'align': 'center',
            'render': (col, record, index) => {
                return <Space>
                    {record.file_type != 'directory' ? <Link onClick={this.openFile.bind(this, record)} size="mini" >查看</Link> : null}
                </Space>
            }
        }
    ]
    constructor(props) {
        super(props);
        this.state = {
            staticPath: "",
            port: 8888,
            running: 0,
            local_addr: 'localhost',
            currentFilePath: '',
            quickDirs: [],
            fileList: [],
        };
    }
    async componentDidMount() {
        let result = await invoke.httpServerStatus()
        let addrResult = await invoke.getLocalAddr()
        if (addrResult.success) {
            this.setState({ local_addr: addrResult.data.addr })
        }
        if (result.success && result.data.running > 0) {
            this.setState(result.data, () => {
                this.setState({ currentFilePath: result.data.staticPath }, this.showFiles)
            });
        } else {
            let data = await cache.getStaticServerConfig();
            this.setState(data, () => {
                this.setState({ currentFilePath: data.staticPath }, this.showFiles)
            });
        }
    }
    selectStaticPath = async () => {
        let selected = await open({
            directory: true,
            multiple: false,
        });
        if (selected == null || selected.length < 1) {
            return;
        }
        this.setState({
            staticPath: selected,
            currentFilePath: selected,
        }, this.showFiles);
        cache.setStaticServerConfig({
            staticPath: selected,
            port: this.state.port,
        })
    };
    showFiles = async () => {
        if (this.state.currentFilePath.length < 1) {
            return;
        }
        let quickDirs = await generateQuickDirs(this.state.staticPath, this.state.currentFilePath)
        console.log(`Generating ${quickDirs}`, quickDirs)
        try {
            let result = await invoke.simpleReadDir(this.state.currentFilePath);
            if (result.success) {
                result.data.sort((a, b) => {
                    if (a.file_type === 'directory') {
                        return -1
                    }
                    return 1
                })
                this.setState({
                    quickDirs: quickDirs,
                    fileList: result.data,
                });
            }

        } catch (e) {
            console.error(e)
            Message.error(e.message());
        }
    }
    goDir = async (item) => {
        if (item.path === 'ROOT') {
            this.setState({
                currentFilePath: this.state.staticPath
            }, this.showFiles);
            return;
        }
        const { sep } = await import('@tauri-apps/api/path');
        this.setState({
            currentFilePath: this.state.staticPath + sep + item.path,
        }, this.showFiles);
    }
    selectDir = async (name) => {
        const { sep } = await import('@tauri-apps/api/path');
        this.setState({
            currentFilePath: this.state.currentFilePath + sep + name,
        }, this.showFiles);
    }
    setPort = async (value) => {
        this.setState({
            port: value,
        });
        cache.setStaticServerConfig({
            staticPath: this.state.staticPath,
            port: value
        })
    }
    startHTTP = async () => {
        if (this.state.running > 0) {
            await this.stopHTTP()
            return
        }
        if (this.state.staticPath.length < 1 || this.state.port < 1) {
            Message.error('参数有误')
            return
        }
        let result = await invoke.startHTTPServer(this.state.staticPath, parseInt(this.state.port))
        if (result.success) {
            Message.success("静态资源服务启动成功")
            this.setState({
                running: 1,
            })

            return
        } else {
            Message.error(result.message)
        }
    }
    stopHTTP = async () => {
        let result = await invoke.stopHTTPServer()
        if (result.success) {
            Message.success("静态资源服务已停止")
            this.setState({
                running: 0,
            })
            return
        } else {
            Message.error(result.message)
        }
    }
    openFile = async (item) => {
        if (item.file_type == 'file') {
            let absPath = this.state.currentFilePath + '/' + item.name
            absPath = absPath.substr(this.state.staticPath.length + 1).replace(/\\/g, '/')
            shellOpen('http://' + this.state.local_addr + ":" + this.state.port + '/' + absPath)
        }
    }

    render() {
        return <div>
            <Card title={'本机：' + this.state.local_addr}>
                <Form autoComplete="off">
                    <FormItem label="静态资源文件夹" >
                        <Grid.Row gutter={8}>
                            <Grid.Col span={18}>
                                <Input
                                    placeholder="请选择"
                                    value={this.state.staticPath}
                                    disabled={this.state.running > 0}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Button onClick={this.selectStaticPath} type="primary" disabled={this.state.running > 0}>选择文件夹</Button>
                            </Grid.Col>
                        </Grid.Row>
                    </FormItem>
                    <FormItem label="服务端口">
                        <Grid.Row gutter={8}>
                            <Grid.Col span={18}>
                                <Input
                                    placeholder="服务端口"
                                    onChange={this.setPort}
                                    value={this.state.port}
                                    disabled={this.state.running > 0}
                                />
                            </Grid.Col>
                        </Grid.Row>
                    </FormItem>
                    <FormItem wrapperCol={{ offset: 5 }}>
                        <Button type="primary" status={this.state.running > 0 ? 'danger' : ''} onClick={this.startHTTP} icon={this.state.running ? <IconLoading /> : <IconPlayArrow />}>{this.state.running > 0 ? '服务运行中,点击停止服务' : '启动'}</Button>
                    </FormItem>
                    {
                        this.state.running > 0 ? <Divider><Space>
                            {
                                this.state.local_addr.length > 0 ? <Link href={'http://' + this.state.local_addr + ':' + this.state.port} target='_blank'>http://{this.state.local_addr}:{this.state.port}</Link> : null
                            }
                        </Space> </Divider> : null
                    }
                </Form>
                <Space split={<IconObliqueLine />} align={'center'} style={{ marginRight: '0', marginBottom: '15px' }} >
                    {
                        this.state.quickDirs.map(item => {
                            return <Link onClick={this.goDir.bind(this, item)} key={item.path} icon={item.icon}>{item.name}</Link>
                        })
                    }
                </Space>
                <Table data={this.state.fileList} columns={this.columns} pagination={false} rowKey={'name'}
                    footer={this.state.currentFilePath} />
            </Card>
        </div>;
    }
}

export default App;
