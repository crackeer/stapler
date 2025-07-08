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
    Progress,
    Form,
    Input,
    Card,
    Grid,
    Checkbox,
} from "@arco-design/web-react";
import common from "@/util/common";
const Row = Grid.Row;
const Col = Grid.Col;
const CheckboxGroup = Checkbox.Group;
const CubeSizes = ["2048", "4096", "6144"];

const VRPage = () => {
    const [observerCount, setObserverCount] = useState(0);
    const [viewHeight, setViewHeight] = useState(250);
    const [panoIndex, setPanoIndex] = useState(0)
    const [currentDownloads, setCurrentDownloads] = useState([])
    const [jsonValue, setJsonValue] = useState(null)
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloading, setDownloading] = useState(false)
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
        } catch (e) { }
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
        let jsonValue = editor.get()

        let baseURL = form.getFieldValue('base_url')
        let cubeSizes = form.getFieldValue('cube_size')
        let downloadDir = form.getFieldValue('download_dir')
        let cubeList = getCubeList(jsonValue, cubeSizes)
        setDownloading(true)
        for (var i in cubeList) {
            setPanoIndex(parseInt(i) + 1)
            setCurrentDownloads(cubeList[i])
            await downloadCube(baseURL, cubeList[i], downloadDir)
        }
    };

    const getCubeList = (jsonValue, cubeSizes) => {
        let retData = []
        let items = ['front', 'back', 'left', 'right', 'up', 'down']
        for (var i in jsonValue.panorama.list) {
            let tmp = []
            for (var j in items) {
                for (var k in cubeSizes) {
                    tmp.push({
                        'name': items[j] + '_' + cubeSizes[k],
                        'path': jsonValue.panorama.list[i][items[j]].replace('cube_2048', 'cube_' + cubeSizes[k])
                    })
                }
            }
            retData.push(tmp)
        }
        return retData
    }

    const downloadCube = async (baseUL, list, saveDir) => {
       for (var i in list) {
            let path = list[i].path
            let url = baseUL + path
            let dest = saveDir + path
            await invoke.httpDownloadFile(url, dest)
       }
    }

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
                                    json={{}}
                                    onValidate={onJsonValidate}
                                />
                            </Col>
                            <Col span={3}>
                                <Button type="primary" onClick={loadJSON}>
                                    加载json
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
                        label="Cube尺寸"
                        field="cube_size"
                        rules={[{ required: true, message: "请选择Cube大小" }]}
                    >
                        <CheckboxGroup options={CubeSizes} />
                    </Form.Item>
                    <Form.Item label="下载项" field="more">
                        <CheckboxGroup>
                            <Checkbox value="cube">模型</Checkbox>
                            <Checkbox value="pano">点云</Checkbox>
                        </CheckboxGroup>
                    </Form.Item>
                    <Form.Item
                        label="存储目录"
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
                        <Button type="primary" onClick={download} disabled={downloading}>
                            {downloading ? '下载中...' : '下载'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
            <Card title="Cube图">
                <div style={{ display: 'flex' }}>
                    <Progress type='circle' percent={downloadProgress} size="large" formatText={
                        (percent) => {
                            return panoIndex + "/" + observerCount
                        }
                    } status="success" style={{flex : 1}}/>
                    <div style={{flex : 9}}>
                        {
                            currentDownloads.map((item, index) => {
                                return <p>
                                    {item.name} : {item.path}
                                </p>
                            })
                        }
                    </div>
                </div>
            </Card>
        </>
    );
};

export default VRPage;
