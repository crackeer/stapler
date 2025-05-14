"use client";
import React from "react";
import "jsoneditor/dist/jsoneditor.css";
import {
    Button,
    Modal,
    Space,
    Message,
    Input,
} from "@arco-design/web-react";
import {
    IconSave,
    IconImport,
    IconFire,
    IconAlignCenter,
    IconRefresh,
} from "@arco-design/web-react/icon";
import { save, open, message } from "@tauri-apps/plugin-dialog";
import JSONEditor from "@/component/JSONEditor";
import invoke from "@/util/invoke";
import common from "@/util/common";
import cache from "@/util/cache";
import jsonToGo from "@/util/json-to-go";
import ClickToCopy from "@/component/ClickToCopy";

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
    }
    onJSONEditorReady = async (ele) => {
        this.editor = ele;
        try {
            let value = await cache.readFile("JSON");
            let data = JSON.parse(value);
            setTimeout(() => {
                this.editor.set(data || {});
            }, 100);
            this.editor.set(data || {});
        } catch (e) {
            this.editor.set({});
        }
    }
    validateJSON = async (value) => {
        await cache.writeFile("JSON", JSON.stringify(value));
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
       alert("保存成功");
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
        let data = JSON.stringify(this.editor.get())
        this.editor.set(data);
    }
    clearJSON = () => {
        this.editor.set({});
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
                            Load
                        </Button>
                        <Button onClick={this.saveJSON} type="outline" icon={<IconSave />}>
                            Save
                        </Button>
                        <Button
                            onClick={this.clearJSON}
                            type="outline"
                            icon={<IconRefresh />}
                        >
                            清空
                        </Button>
                        <Button
                            onClick={this.toGoStruct}
                            type="outline"
                            icon={<IconFire />}
                        >
                            转Go
                        </Button>
                        <Button
                            onClick={this.toString}
                            type="outline"
                            icon={<IconAlignCenter />}
                        >
                            serialize
                        </Button>
                    </Space>
                </div>
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
                    <Input.TextArea value={this.state.convert} rows={20} />
                </Modal>
            </div>
        );
    }
}

export default App;
