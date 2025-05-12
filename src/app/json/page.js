"use client";
import React from "react";
import "jsoneditor/dist/jsoneditor.css";
import {
    Button,
    Modal,
    List,
    Space,
    Message,
    Popconfirm,
    Input,
    Drawer,
} from "@arco-design/web-react";
import {
    IconSave,
    IconImport,
    IconFire,
    IconAlignCenter,
    IconRefresh,
    IconClockCircle,
    IconShrink,
} from "@arco-design/web-react/icon";
import { save, open } from "@tauri-apps/plugin-dialog";
import JSONEditor from "@/component/JSONEditor";
import invoke from "@/util/invoke";
import common from "@/util/common";
import cache from "@/util/cache";
import jsonToGo from "@/util/json-to-go";
import ClickToCopy from "@/component/ClickToCopy";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { exists, readDir, BaseDirectory, writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';

const initJSONDir = async () => {
    let flag = await exists('json', { dir: BaseDirectory.AppData });
    if (flag) {
        return
    }
    //await createDir('json', { dir: BaseDirectory.AppData, recursive: true });
    return
}
const readJSONFiles = async () => {
    let results = await readDir('json', { dir: BaseDirectory.AppData, recursive: false });
    console.log(results)
    return JSON.parse(JSON.stringify(results))
}

const writeJSON = async (name, content) => {
    const { sep } = await import('@tauri-apps/api/path')
    return await writeTextFile('json' + sep + name, content, { dir: BaseDirectory.AppData });
}

const readJSON = async (name) => {
    const { sep } = await import('@tauri-apps/api/path')
    return await readTextFile('json' + sep + name, { dir: BaseDirectory.AppData });
}

const deleteJSON = async (name) => {
    const { sep } = await import('@tauri-apps/api/path')
    return await removeFile('json' + sep + name, { dir: BaseDirectory.AppData, recursive: false });
}

class App extends React.Component {
    editor = null;
    constructor(props) {
        super(props);
        this.state = {
            viewHeight: 200,
            convert: "",
            convertTitle: "",
            visible: false,
            tmpName: "",
            cacheVisible: false,
            cacheNames: [],
        };
    }
    async componentDidMount() {
        this.setState({ viewHeight: common.getViewHeight() });
        window.onresize = () => {
            this.setState({
                viewHeight: common.getViewHeight(),
            });
        };
        initJSONDir()
    }
    onJSONEditorReady = async (ele) => {
        this.editor = ele;
        let value = await cache.getJSON("JSON.cache");
        this.editor.set(value || {});
    };
    validateJSON = async (value) => {
        cache.setJSON("JSON.cache", value);
    };
    saveJSON = async () => {
        let file = await save({
            filters: [
                {
                    name: "unknown",
                    extensions: ["json"],
                },
            ],
        });
        if (file == null) return;
        await invoke.writeFile(file, JSON.stringify(this.editor.get()));
        Message.success("保存成功");
    };
    saveJSON2Cache = async () => {
        let content = JSON.stringify(this.editor.get())
        await writeJSON(this.state.tmpName, content)
        Message.success("保存成功");
    };
    loadCacheJSONList = async () => {
        let list = await readJSONFiles()
        this.setState({ cacheNames: list, cacheVisible: true });
    };
    loadJSON = async () => {
        let file = await open({
            multipart: false,
            filters: [
                {
                    name: "",
                    extensions: ["json"],
                },
            ],
        });
        if (file == null) return;
        let content = await invoke.readFile(file);
        try {
            let json = JSON.parse(content);
            this.editor.set(json);
        } catch (e) { }
    };
    toGoStruct = () => {
        let result = jsonToGo(JSON.stringify(this.editor.get()), null, null, false);
        this.setState({
            convert: result.go,
            convertTitle: "Go结构体",
            visible: true,
        });
    };
    toString = () => {
        this.setState({
            convert: JSON.stringify(JSON.stringify(this.editor.get())),
            convertTitle: "序列化结果",
            visible: true,
        });
    };
    clearJSON = () => {
        this.editor.set({});
    };
    importCacheJSON = async (item) => {
        let data = await readJSON(item.name);
        this.editor.set(JSON.parse(data));
        this.setState({ cacheVisible: false }, () => {
            Message.info("导入成功");
        });
    };
    copyCacheJSON = async (item) => {
        let data = await readJSON(item.name);
        writeText(data).then(() => {
            Message.info("复制成功");
        });
    };
    deleteCacheJSON = async (item) => {
        await deleteJSON(item.name);
        Message.info("删除成功");
        this.loadCacheJSONList()
    }
    render() {
        return (
            <div>
                <JSONEditor
                    height={this.state.viewHeight}
                    ref={this.onJSONEditorReady}
                    json={this.state.value}
                    onValidate={this.validateJSON}
                />
                <div style={{ textAlign: "center", marginTop: "15px" }}>
                    <Space>
                        <Button
                            onClick={this.loadJSON}
                            type="outline"
                            icon={<IconImport />}
                        >
                            从文件加载
                        </Button>
                        <Button onClick={this.saveJSON} type="outline" icon={<IconSave />}>
                            保存文件
                        </Button>
                        <Button
                            onClick={this.loadCacheJSONList}
                            type="outline"
                            icon={<IconShrink />}
                        >
                            从缓存加载
                        </Button>
                        <Popconfirm
                            title="请输入名字"
                            content={
                                <Input
                                    onChange={(value) => {
                                        this.setState({ tmpName: value });
                                    }}
                                    placeholder="请输入名字"
                                />
                            }
                            onOk={this.saveJSON2Cache}
                            onCancel={() => {
                                this.setState({ tmpName: "" });
                            }}
                        >
                            <Button type="outline" icon={<IconClockCircle />}>
                                保存到缓存
                            </Button>
                        </Popconfirm>
                        <Button
                            onClick={this.clearJSON}
                            type="outline"
                            icon={<IconRefresh />}
                        >
                            清空输入
                        </Button>
                        <Button
                            onClick={this.toGoStruct}
                            type="outline"
                            icon={<IconFire />}
                        >
                            转Go结构体
                        </Button>
                        <Button
                            onClick={this.toString}
                            type="outline"
                            icon={<IconAlignCenter />}
                        >
                            序列化
                        </Button>
                    </Space>
                </div>
                <Drawer
                    width={350}
                    title={<span>JSON缓存列表</span>}
                    visible={this.state.cacheVisible}
                    onCancel={() => {
                        this.setState({ cacheVisible: false });
                    }}
                    footer={null}
                >
                    <List
                        dataSource={this.state.cacheNames}
                        size="small"
                        render={(item, index) => (
                            <List.Item
                                key={index}
                                extra={
                                    <Space size="mini">
                                        <Button
                                            onClick={this.importCacheJSON.bind(this, item)}
                                            type="text"
                                            size="mini"
                                        >
                                            导入
                                        </Button>
                                        <Button
                                            onClick={this.copyCacheJSON.bind(this, item)}
                                            type="text"
                                            size="mini"
                                        >
                                            复制
                                        </Button>
                                        <Button
                                            onClick={this.deleteCacheJSON.bind(this, item)}
                                            type="text"
                                            size="mini"
                                        >
                                            删除
                                        </Button>
                                    </Space>
                                }
                            >
                                {item.name}
                            </List.Item>
                        )}
                    />
                </Drawer>
                <Modal
                    title={this.state.convertTitle}
                    alignCenter={false}
                    visible={this.state.visible}
                    footer={null}
                    style={{ width: "60%", top: "100" }}
                    autoFocus={false}
                    focusLock={true}
                    onCancel={() => {
                        this.setState({ visible: false });
                    }}
                >
                    <ClickToCopy value={this.state.convert}>复制</ClickToCopy>
                    <pre>{this.state.convert}</pre>
                </Modal>
            </div>
        );
    }
}

export default App;
