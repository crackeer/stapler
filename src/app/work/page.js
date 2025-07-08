"use client";
import React from "react";
import { useEffect, useState } from "react";
import { message, open } from "@tauri-apps/plugin-dialog";
import "jsoneditor/dist/jsoneditor.css";
import JSONEditor from "@/component/JSONEditor";
import { path } from "@tauri-apps/api";
import invoke from "@/util/invoke";
import {
    Space,
    Button,
    Alert,
    Form,
    Input,
    Card,
    Grid,
    Checkbox,
} from "@arco-design/web-react";
import { set } from "lodash";
const Row = Grid.Row;
const Col = Grid.Col;
const CheckboxGroup = Checkbox.Group;
const CubeSizes = ["2048", "4096", "6144"];

const VRPage = () => {
    const [observerCount, setObserverCount] = useState(0);
    const [viewHeight, setViewHeight] = useState(250);
    const [panoIndex, setPanoIndex] = useState(0);
    const [currentDownloads, setCurrentDownloads] = useState([]);
    const [downloadType, setDownloadType] = useState("");
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloading, setDownloading] = useState(false);
    const [currentDownloadIndex, setCurrentDownloadIndex] = useState(-1);
    const [tilesetURLs, setTilesetURLs] = useState([]);
    const [downloadStatus, setDownloadStatus] = useState("");
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

    const downloadCube = async () => {
        let jsonValue = editor.get();
        let baseURL = form.getFieldValue("base_url");
        let cubeSizes = form.getFieldValue("cube_size");
        let downloadDir = form.getFieldValue("download_dir");
        if (downloadDir == null || downloadDir == "") {
            message("请选择下载目录");
            return;
        }
        let cubeList = getCubeList(jsonValue, cubeSizes);
        setDownloading(true);
        setDownloadType("cube");
        setDownloadStatus("");
        for (var i in cubeList) {
            setPanoIndex(parseInt(i) + 1);
            setCurrentDownloads(cubeList[i]);
            await downloadResource(baseURL, cubeList[i], downloadDir);
        }
        setDownloading(false);
        setCurrentDownloads([]);
        setDownloadStatus("success");
    };

    const downloadModel = async () => {
        let jsonValue = editor.get();
        let baseURL = form.getFieldValue("base_url");
        let downloadDir = form.getFieldValue("download_dir");
        if (downloadDir == null || downloadDir == "") {
            message("请选择下载目录");
            return;
        }
        let modelList = getModelList(jsonValue);
        if (modelList.length == 0) {
            message("model not found");
            return;
        }
        setDownloading(true);
        setDownloadStatus("");
        setDownloadType("model");
        setCurrentDownloads(modelList);
        await downloadResource(baseURL, modelList, downloadDir);
        setDownloading(false);
        setCurrentDownloads([]);
        setDownloadStatus("success");
    };

    const getModelList = (jsonValue) => {
        let retData = [];
        if (jsonValue.model == undefined) {
            return [];
        }
        if (jsonValue.model.file_url != undefined) {
            retData.push({
                name: "model",
                path: jsonValue.model.file_url,
            });
        }
        if (jsonValue.model.material_textures != undefined) {
            let prefix = "";
            if (jsonValue.model.material_base_url != undefined) {
                prefix = jsonValue.model.material_base_url;
            }
            for (var i in jsonValue.model.material_textures) {
                retData.push({
                    name: "material_textures" + i,
                    path: prefix + jsonValue.model.material_textures[i],
                });
            }
        }
        return retData;
    };

    const getCubeList = (jsonValue, cubeSizes) => {
        let retData = [];
        let items = ["front", "back", "left", "right", "up", "down"];
        for (var i in jsonValue.panorama.list) {
            let tmp = [];
            for (var j in items) {
                for (var k in cubeSizes) {
                    tmp.push({
                        name: items[j] + "_" + cubeSizes[k],
                        path: jsonValue.panorama.list[i][items[j]].replace(
                            "cube_2048",
                            "cube_" + cubeSizes[k]
                        ),
                    });
                }
            }
            retData.push(tmp);
        }
        return retData;
    };

    const downloadResource = async (baseUL, list, saveDir) => {
        for (var i in list) {
            let url = baseUL + list[i].path;
            let dest = await path.join(saveDir, list[i].path);
            setCurrentDownloadIndex(i);
            await invoke.httpDownloadFile(url, dest);
        }
        setCurrentDownloadIndex(-1);
    };

    const downloadLayer = async (layerType) => {
        let jsonValue = editor.get();
        let baseURL = form.getFieldValue("base_url");
        let downloadDir = form.getFieldValue("download_dir");
        if (downloadDir == null || downloadDir == "") {
            message("请选择下载目录");
            return;
        }
        if (
            jsonValue.model == undefined ||
            (jsonValue.model.layers != undefined &&
                jsonValue.model.layers != null &&
                jsonValue.model.layers.length < 1)
        ) {
            message("mesh not found");
            return;
        }
        console.log(layerType);
        let tilesetURL = "";
        for (var i in jsonValue.model.layers) {
            if (jsonValue.model.layers[i].type == layerType) {
                tilesetURL = jsonValue.model.layers[i].tileset_url;
            }
        }
        if (tilesetURL == "") {
            message("mesh not found");
            return;
        }
        if (
            tilesetURL.startsWith("http://") ||
            tilesetURL.startsWith("https://")
        ) {
            let parts = tilesetURL.split("/" + layerType + "/");
            tilesetURL = layerType + "/" + parts[parts.length - 1];
            baseURL = parts[0] + "/";
        }
        console.log(tilesetURL, layerType, baseURL);
        setTilesetURLs([tilesetURL]);
        setDownloadType(layerType);

        setDownloading(true);
        setDownloadStatus("");
        await downloadTileset(baseURL, downloadDir);
        setDownloading(false);
        setDownloadStatus("success");
    };

    const downloadTileset = async (baseURL, downloadDir) => {
        if (tilesetURLs.length == 0) {
            return;
        }

        // 获取第一个tileset.json
        let curJSON = tilesetURLs.shift();
        console.log("GET", curJSON);
        let fullURL = baseURL + curJSON;
        let savePath = await path.join(downloadDir, curJSON);
        // 下载tileset.json，解析其中的tileset.json/pnts/glb/b3dm
        let result = await invoke.httpDownloadFileV2(fullURL, savePath);
        if (!result.success) {
            console.log(result);
            message.error(result.message);
            return;
        }
        let jsonData = JSON.parse(result.data);
        let data = parseTileset(jsonData);
        let batchDownloads = [];
        for (var i in data) {
            if (data[i].endsWith(".json")) {
                tilesetURLs.push(comparePath(curJSON, data[i]));
            } else {
                batchDownloads.push({
                    name: data[i],
                    path: comparePath(curJSON, data[i]),
                });
            }
        }
        setTilesetURLs([...tilesetURLs]);
        // download：pnts / glb / b3dm
        setCurrentDownloads(batchDownloads);
        await downloadResource(baseURL, batchDownloads, downloadDir);
        await downloadTileset(baseURL, downloadDir);
        return;
    };

    const comparePath = (basePath, newPath) => {
        let parts = basePath.split("/");
        parts.pop();
        parts.push(newPath);
        return parts.join("/");
    };

    const parseTileset = (jsonData) => {
        if (jsonData == undefined || jsonData == null) {
            return [];
        }
        if (typeof jsonData == "string") {
            if (
                jsonData.endsWith(".json") ||
                jsonData.endsWith(".b3dm") ||
                jsonData.endsWith(".glb") ||
                jsonData.endsWith(".pnts")
            ) {
                return [jsonData];
            }
        }
        let data = [];
        if (typeof jsonData == "object") {
            if (jsonData.length == undefined) {
                let keys = Object.keys(jsonData);
                for (var i in keys) {
                    data.push(...parseTileset(jsonData[keys[i]]));
                }
            } else {
                for (var i in jsonData) {
                    data.push(...parseTileset(jsonData[i]));
                }
            }
        }
        return data;
    };

    return (
        <>
            <Card style={{ marginBottom: "10px" }}>
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
                        <div>{observerCount}</div>
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
                        <Space>
                            <Button
                                type="primary"
                                onClick={downloadCube}
                                disabled={downloading}
                            >
                                {downloading && downloadType == "cube"
                                    ? "下载中..."
                                    : "下载Cube"}
                            </Button>
                            <Button
                                type="primary"
                                onClick={downloadModel}
                                disabled={downloading}
                            >
                                {downloading && downloadType == "model"
                                    ? "下载中..."
                                    : "下载Model"}
                            </Button>
                            <Button
                                type="primary"
                                onClick={downloadLayer.bind(this, "mesh")}
                                disabled={downloading}
                            >
                                {downloading && downloadType == "mesh"
                                    ? "下载中..."
                                    : "下载Mesh"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
            {downloadStatus == "success" ? (
                <Alert
                    style={{ marginBottom: 20 }}
                    type="success"
                    content="下载成功"
                />
            ) : null}

            {downloadType == "cube" ? (
                <Card title="Cube图">
                    <h4>
                        当前下载：正在下载第{panoIndex} / {observerCount}点位
                    </h4>
                    <DownloadList
                        list={currentDownloads}
                        currentIndex={currentDownloadIndex}
                    />
                </Card>
            ) : null}

            {downloadType == "model" ? (
                <Card title="模型">
                    <DownloadList
                        list={currentDownloads}
                        currentIndex={currentDownloadIndex}
                    />
                </Card>
            ) : null}

            {downloadType == "mesh" || downloadType == "point_cloud" ? (
                <Card title={downloadType == "mesh" ? "Mesh" : "点云"}>
                    <Row gutter={20}>
                        <Col span={12}>
                            <h4>
                                等待下载tileset.json(数量：{tilesetURLs.length})
                            </h4>
                            <div
                                style={{ height: "400px", overflow: "scroll" }}
                            >
                                {tilesetURLs.map((item, index) => {
                                    return <p key={index}>{item}</p>;
                                })}
                            </div>
                        </Col>
                        <Col span={12}>
                            <h4>当前下载：</h4>
                            <DownloadList
                                list={currentDownloads}
                                currentIndex={currentDownloadIndex}
                            />
                        </Col>
                    </Row>
                </Card>
            ) : null}
        </>
    );
};

const DownloadList = (props) => {
    const { list, currentIndex } = props;
    return (
        <div>
            {list.map((item, index) => {
                return (
                    <p
                        key={index}
                        style={index == currentIndex ? { color: "red" } : {}}
                    >
                        {item.name} : {item.path}
                    </p>
                );
            })}
        </div>
    );
};

export default VRPage;
