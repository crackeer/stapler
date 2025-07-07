"use client";
import React from "react";
import { useEffect, useState } from "react";
import { message, open } from "@tauri-apps/plugin-dialog";
import "jsoneditor/dist/jsoneditor.css";
import JSONEditor from "@/component/JSONEditor";
import invoke from "@/util/invoke";
import {
    Upload,
    Button,
    Layout,
    Form,
    Input,
    Card,
    Grid,
    Checkbox,
} from "@arco-design/web-react";
const Row = Grid.Row;
const Col = Grid.Col;
const CheckboxGroup = Checkbox.Group;
const CubeSizes = ["2048", "4096", "6144"];

const VRPage = () => {
    const [connectKey, setConnectKey] = useState("");
    const [observerCount, setObserverCount] = useState(0);
    const [viewHeight, setViewHeight] = useState(250);
    const [jsonValue, setJsonValue] = useState({});
    var editor = null;
    const [form] = Form.useForm();

    useEffect(() => {
        form.setFieldValue("cube_size", [CubeSizes[0]]);
    }, []);

    const onJSONEditorReady = (target) => {
        editor = target;
    };

    const loadJSON = async () => {
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
            editor.set(json);
            setCubeSize(json);
        } catch (e) {}
    };
    const onJsonValidate = (json) => {
        if (json == null) return;
        if (json.base_url != undefined) {
            form.setFieldValue("base_url", json.base_url);
        }
        if (json.panorama != undefined && json.panorama.list != undefined) {
            setObserverCount(json.panorama.list.length);
        }
    };
    const setCubeSize = (value) => {
        if (
            value.panorama != undefined &&
            value.panorama.list != undefined &&
            value.panorama.list.length > 0 &&
            value.panorama.list[0].size_list != undefined
        ) {
            let cubeSizes = [];
            for (var i in value.panorama.list[0].size_list) {
                cubeSizes.push(value.panorama.list[0].size_list[i] + "");
            }
            form.setFieldValue("cube_size", cubeSizes);
        }
    };
    const selectDirectory = async () => {
        let selected = await open({
            directory: true,
            filters: [
                {
                    name: "File",
                    extensions: [],
                },
            ],
        });
        if (selected == null) {
            return;
        }
        form.setFieldValue("download_dir", selected);
    };

    const download = async () => {
        let values = await form.validate();
    };

    return (
        <>
            <Card>
                <Form form={form} labelCol={{ span: 4 }}>
                    <Form.Item field="json" label="work.json">
                        <Row gutter={10}>
                            <Col span={21}>
                                <JSONEditor
                                    height={viewHeight}
                                    ref={onJSONEditorReady}
                                    json={jsonValue}
                                    onValidate={onJsonValidate}
                                />
                            </Col>
                            <Col span={3}>
                                <Button type="primary" onClick={loadJSON}>
                                    加载
                                </Button>
                            </Col>
                        </Row>
                    </Form.Item>
                    <Form.Item label="点位数量">
                        <div>
                            {observerCount}
                        </div>
                    </Form.Item>
                    <Form.Item
                        label="BaseURL"
                        field="base_url"
                        rules={[{ required: true, message: "请输入BaseURL" }]}
                    >
                        <Input placeholder="base_url" name="base_url" />
                    </Form.Item>
                    <Form.Item
                        label="尺寸"
                        field="cube_size"
                        rules={[{ required: true, message: "请选择Cube大小" }]}
                    >
                        <CheckboxGroup options={CubeSizes} />
                    </Form.Item>
                    <Form.Item
                        label="下载到"
                        field="download_dir"
                        rules={[{ required: true, message: "请选择目录" }]}
                    >
                        <Input.Search
                            searchButton={"选择目录"}
                            placeholder="请选择目录"
                            onSearch={selectDirectory}
                        />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 4 }}>
                        <Button type="primary" onClick={download}>
                            开始下载
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </>
    );
};

export default VRPage;
