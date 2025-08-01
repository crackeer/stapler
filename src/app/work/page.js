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
    Statistic,
    Radio,
} from "@arco-design/web-react";
import common from "@/util/common";
import lodash from "lodash";
import database from "@/util/database";

const Row = Grid.Row;
const Col = Grid.Col;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const CubeSizes = ["2048", "4096", "6144"];

const VRPage = () => {
    const [observerCount, setObserverCount] = useState(0);
    const [downloadList, setDownloadList] = useState([]);
    const [current, setCurrent] = useState("");
    const [downloadStatus, setDownloadStatus] = useState("");
    const [fileCount, setFileCount] = useState(0);
    var editor = null;
    const [form] = Form.useForm();

    useEffect(() => {
        database.getPageInitData("work", "default").then((result) => {
            if (result != null) {
                console.log(result);
                form.setFieldsValue({
                    cube_size: result.cube_size,
                    download_dir: result.download_dir,
                    download_layers: result.download_layers,
                });
                setTimeout(() => {
                    editor.set(result.work);
                }, 30);
            } else {
                form.setFieldValue("cube_size", [CubeSizes[0]]);
                form.setFieldValue("download_layers", 1);
            }
        });
        form.setFieldValue("cube_size", [CubeSizes[0]]);
    }, []);

    const onJSONEditorReady = (target) => {
        editor = target;
        console.log("onJSONEditorReady", editor);
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
        try {
            let result = await invoke.readFile(file);
            if (!result.success) {
                message(result.message);
                return;
            }
            let json = JSON.parse(result.data);
            editor.set(json);
            setCubeSize(json);
        } catch (e) {}
    };
    const onJsonValidate = (json) => {
        if (json == null) return;
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

    const downloadWork = async () => {
        let jsonValue = editor.get();

        let baseURL = lodash.get(jsonValue, "base_url", "");
        if (baseURL == "") {
            message("work.json中请输入base_url");
            return;
        }
        let cubeSizes = form.getFieldValue("cube_size");
        let downloadDir = form.getFieldValue("download_dir");
        let downloadLayers = form.getFieldValue("download_layers");
        let newWorkJson = convertWork(jsonValue);
        if (downloadDir == null || downloadDir == "") {
            message("请选择下载目录");
            return;
        }

        console.log("downloadLayers", parseInt(downloadLayers));
        await database.updatePageInitData(
            "work",
            "default",
            JSON.stringify({
                work: jsonValue,
                cube_size: cubeSizes,
                download_dir: downloadDir,
                download_layers: parseInt(downloadLayers),
            })
        );
        let cubeList = getCubeList(jsonValue, cubeSizes);
        let modelList = getModelList(jsonValue, baseURL);
        let layers = [];
        if (parseInt(downloadLayers) > 0) {
            layers = getLayers(jsonValue, baseURL);
            console.log(layers);
        } else {
            lodash.set(newWorkJson, "model.layers", []);
            if (
                newWorkJson.model != undefined &&
                newWorkJson.model.tiles != undefined
            ) {
                delete newWorkJson.model.tiles;
            }
        }

        // tileset文件下载 + 解析
        let totalData = [...cubeList, ...modelList];
        setFileCount(totalData.length);
        if (layers.length > 0) {
            setDownloadStatus("indexing");
            let tileSetFiles = await parseTitleFiles(
                layers,
                baseURL,
                downloadDir,
                totalData.length
            );
            totalData.push(...tileSetFiles);
        }
        setDownloadList(totalData);

        setDownloadStatus("downloading");
        await downloadResource(totalData, baseURL, downloadDir);
        console.log("downloadResourceEnd", downloadDir);
        let workJsonSave = await path.join(downloadDir, "work.json");
        await invoke.writeFile(workJsonSave, JSON.stringify(newWorkJson));
        setDownloadList([]);
        setDownloadStatus("success");
    };

    const parseTitleFiles = async (files, baseURL, saveDir, total) => {
        let tileSetFiles = [];
        let jsonFiles = [];
        do {
            for (var i in files) {
                setCurrent(files[i]);
                let dest = await path.join(saveDir, files[i]);
                let result = await doDownloadJson(baseURL + files[i], dest);
                console.log(baseURL + files[i], result);
                let currentFile = files[i];
                if (result !== false) {
                    let jsonData = JSON.parse(result);
                    let data = parseTileset(jsonData);
                    for (var i in data) {
                        if (data[i].endsWith(".json")) {
                            jsonFiles.push(comparePath(currentFile, data[i]));
                        } else {
                            tileSetFiles.push(
                                comparePath(currentFile, data[i])
                            );
                            total = total + 1;
                            setFileCount(total);
                        }
                    }
                }
            }
            files = [];
            if (jsonFiles.length > 0) {
                files = jsonFiles;
                jsonFiles = [];
            }
        } while (files.length > 0);
        return tileSetFiles;
    };

    const getModelList = (jsonValue, baseUL) => {
        let retData = [];
        if (jsonValue.model == undefined) {
            return [];
        }
        if (jsonValue.model.file_url != undefined) {
            if (common.startWithProtocol(jsonValue.model.file_url)) {
                retData.push(removeBaseURL(jsonValue.model.file_url, baseURL));
            } else {
                retData.push(jsonValue.model.file_url);
            }
        }
        if (jsonValue.model.material_textures != undefined) {
            let prefix = "";
            if (jsonValue.model.material_base_url != undefined) {
                prefix = jsonValue.model.material_base_url;
            }
            for (var i in jsonValue.model.material_textures) {
                retData.push(prefix + jsonValue.model.material_textures[i]);
            }
        }
        return retData;
    };

    const getCubeList = (jsonValue, cubeSizes) => {
        let retData = [];
        let items = ["front", "back", "left", "right", "up", "down"];
        for (var i in jsonValue.panorama.list) {
            for (var j in items) {
                for (var k in cubeSizes) {
                    retData.push(
                        jsonValue.panorama.list[i][items[j]].replace(
                            "cube_2048",
                            "cube_" + cubeSizes[k]
                        )
                    );
                }
            }
        }
        return retData;
    };

    const getLayers = (jsonValue, baseURL) => {
        let retData = [];
        let tilesetURLs = [];
        let layers = lodash.get(jsonValue, "model.layers", []);
        let b3md_mappings_url = lodash.get(
            jsonValue,
            "model.tiles.b3md_mappings_url",
            ""
        );
        let tileset_url = lodash.get(jsonValue, "model.tiles.tileset_url", "");
        if (layers == null) {
            layers = [];
        }
        if (b3md_mappings_url.length > 0) {
            tilesetURLs.push(b3md_mappings_url);
        }
        if (tileset_url.length > 0) {
            tilesetURLs.push(tileset_url);
        }
        console.log(tilesetURLs);

        for (var i in layers) {
            tilesetURLs.push(layers[i].tileset_url);
        }
        for (var i in tilesetURLs) {
            if (common.startWithProtocol(tilesetURLs[i])) {
                retData.push(removeBaseURL(tilesetURLs[i], baseURL));
            } else {
                retData.push(tilesetURLs[i]);
            }
        }
        return retData;
    };

    const removeBaseURL = (fullURL, baseUrl) => {
        if (fullURL.indexOf("/mesh/") != -1) {
            let parts = fullURL.split("/mesh/");
            return "mesh/" + parts[parts.length - 1];
        }
        if (fullURL.indexOf("/point_cloud/") != -1) {
            let parts = fullURL.split("/point_cloud/");
            return "point_cloud/" + parts[parts.length - 1];
        }
        if (fullURL.indexOf("/model/") != -1) {
            let parts = fullURL.split("/model/");
            return "model/" + parts[parts.length - 1];
        }

        if (fullURL.indexOf("/lod/") != -1) {
            let parts = fullURL.split("/lod/");
            return "lod/" + parts[parts.length - 1];
        }
        return fullURL.replace(baseUrl, "");
    };

    const downloadResource = async (list, baseUL, saveDir) => {
        for (var i in list) {
            let fullURL = baseUL + list[i];
            let dest = await path.join(saveDir, list[i]);
            setCurrent(list[i]);
            setFileCount(list.length - i - 1);
            await doDownload(fullURL, dest);
        }
    };

    const doDownloadJson = async (url, dest) => {
        try {
            let result = await invoke.fileExists(dest);
            if (result.success && result.data.exists) {
                let data = await invoke.readFile(dest);
                if (data.success) {
                    return data.data;
                }
            }
        } catch (e) {
            console.log(e);
            return false;
        }
        try {
            let result = await invoke.httpDownloadFileV2(url, dest);
            if (!result.success) {
                return false;
            }
            return result.data;
        } catch (e) {
            console.log(e);
            return false;
        }
    };
    const doDownload = async (url, dest) => {
        try {
            let result = await invoke.fileExists(dest);
            if (result.success && result.data.exists) {
                return true;
            }
        } catch (e) {
            console.log(e);
            return false;
        }
        try {
            let result = await invoke.httpDownloadFile(url, dest);
            if (result.success) {
                return true;
            }
            await invoke.deleteFile(dest);
            return false;
        } catch (e) {
            console.log(e);
            return false;
        }
    };

    const convertWork = (jsonValue) => {
        let data = lodash.cloneDeep(jsonValue);
        let baseURL = lodash.get(data, "base_URL", "");
        data["base_url"] = "{{BASE_URL}}";
        if (
            lodash.get(data, "model.file_url", "").length > 0 &&
            common.startWithProtocol(data.model.file_url)
        ) {
            data.model.file_url = removeBaseURL(data.model.file_url, baseURL);
        }
        let layers = lodash.get(data, "model.layers", []);
        delete data.title_picture_url;
        delete data.picture_url;
        if (layers != null && layers.length > 0) {
            for (var i in layers) {
                if (common.startWithProtocol(layers[i].tileset_url)) {
                    layers[i]["tileset_url"] = removeBaseURL(
                        layers[i].tileset_url,
                        baseURL
                    );
                }
            }
            data.model.layers = layers;
        }
        return data;
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
    const openDirectory = async () => {
        let dir = form.getFieldValue("download_dir");
        if (dir == null || dir == "") {
            return;
        }
        await invoke.openPath(dir);
    };

    return (
        <>
            <Card style={{ marginBottom: "10px" }}>
                <Form form={form} labelCol={{ span: 4 }}>
                    <Form.Item field="json" label="work.json">
                        <Row gutter={10}>
                            <Col span={21}>
                                <JSONEditor
                                    height={300}
                                    ref={onJSONEditorReady}
                                    json={{}}
                                    onValidate={onJsonValidate}
                                />
                            </Col>
                            <Col span={3}>
                                <Button type="primary" onClick={loadJSON}>
                                    LoadFile
                                </Button>
                            </Col>
                        </Row>
                    </Form.Item>
                    <Form.Item label="点位数量">
                        <div>{observerCount}</div>
                    </Form.Item>
                    <Form.Item
                        label="Cube尺寸"
                        field="cube_size"
                        rules={[{ required: true, message: "请选择Cube大小" }]}
                    >
                        <CheckboxGroup options={CubeSizes} />
                    </Form.Item>
                    <Form.Item
                        label="模型layers下载"
                        field="download_layers"
                        rules={[
                            { required: true, message: "请选择模型layers下载" },
                        ]}
                    >
                        <RadioGroup type="radio">
                            <Radio value={1}>是</Radio>
                            <Radio value={0}>否</Radio>
                        </RadioGroup>
                    </Form.Item>
                    <Form.Item
                        label="存储目录"
                        rules={[{ required: true, message: "请选择目录" }]}
                        style={{ marginBottom: 0 }}
                    >
                        <Row gutter={10}>
                            <Col span={15}>
                                <Form.Item
                                    rules={[{ required: true }]}
                                    field="download_dir"
                                >
                                    <Input placeholder="请选择目录" />
                                </Form.Item>
                            </Col>
                            <Col span={9}>
                                <Space>
                                    <Button
                                        onClick={selectDirectory}
                                        type={"outline"}
                                    >
                                        选择
                                    </Button>
                                    <Button
                                        onClick={openDirectory}
                                        type={"outline"}
                                    >
                                        打开
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 4 }}>
                        <Space>
                            <Button
                                type="primary"
                                onClick={downloadWork}
                                disabled={downloadStatus == "downloading"}
                            >
                                {downloadStatus == "downloading"
                                    ? "下载中..."
                                    : "下载"}
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

            {downloadStatus == "indexing" ? (
                <Card>
                    <Alert
                        style={{ marginBottom: 20 }}
                        type="info"
                        content={<>正在检索需要下载的文件:{current}</>}
                    />
                    <div>
                        <Statistic
                            title="需要下载的文件数量"
                            value={fileCount}
                            style={{ marginRight: 60 }}
                        />
                    </div>
                </Card>
            ) : null}

            {downloadStatus == "downloading" ? (
                <Card>
                    <Statistic
                        title="剩余下载项"
                        value={fileCount}
                        style={{ marginRight: 60 }}
                        extra={<>正在下载：{current}</>}
                    />
                </Card>
            ) : null}
        </>
    );
};

export default VRPage;
