"use client";
import React from "react";
import { useEffect, useState } from "react";
import { message, open } from "@tauri-apps/plugin-dialog";
import "jsoneditor/dist/jsoneditor.css";
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
    Statistic,
} from "@arco-design/web-react";
import common from "@/util/common";
import database from "@/util/database";
const Row = Grid.Row;
const Col = Grid.Col;

const buttonTextMap = {
    downloading: "下载中...",
};

const DownloadPage = () => {
    const [downloadList, setDownloadList] = useState([]);
    const [current, setCurrent] = useState("");
    const [downloadStatus, setDownloadStatus] = useState("");
    const [form] = Form.useForm();

    useEffect(() => {
        database.getPageInitData("download", "default").then((result) => {
            form.setFieldsValue(result);
        });
    }, []);

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
        form.setFieldValue("work_dir", selected);
    };

    const loadTxt = async () => {
        let file = await open({
            multipart: false,
            filters: [
                {
                    name: "",
                    extensions: ["txt", "json"],
                },
            ],
        });
       
        if (file == undefined) {
            return;
        }
        if (file == null && file.length < 1) return;

        let urls = common.splitIntoArray(form.getFieldValue("content"), [
            "\n",
            "\r\n",
            ",",
            ";",
            " ",
        ]);
        try {
            let result = await invoke.readFile(file);
            console.log(result);
            if (!result.success) {
                message(result.message);
                return;
            }
            if (file.endsWith(".txt")) {
                let parts = result.data.split("\n").filter((item) => {
                    return (
                        item.trim().length > 0 && common.startWithProtocol(item)
                    );
                });
                urls.push(...parts);
            } else if (file.endsWith(".json")  ) {
                let data = JSON.parse(result.data);
                urls.push(...common.extractURLs(data));
            }

            form.setFieldValue("content", urls.join("\n"));
        } catch (e) {
            console.log(e);
        }
    };

    const toDownload = async () => {
        let workDir = form.getFieldValue("work_dir");
        setDownloadStatus("downloading");
        let urls = common.splitIntoArray(form.getFieldValue("content"), [
            "\n",
            "\r\n",
            ",",
            ";",
            " ",
        ]);

        if (urls.length < 1) {
            return;
        }
        database.updatePageInitData(
            "download",
            "default",
            form.getFieldsValue()
        );
       
        await doDownload(urls, workDir, 0);
        setDownloadStatus("success");
    };

    const formChange = (_, values) => {
        database.updatePageInitData("download", "default", values);
    };

    const doDownload = async (list, saveDir, nameType) => {
        if (list.length == 0) {
            return;
        }
        let first = list.shift(); 
        console.log(first);
        setDownloadList(list);
        let object = new URL(first);
        let filePath = object.pathname;
        let destFile = await path.join(saveDir, filePath);

        try {
            let result = await invoke.fileExists(destFile);
            if (result.success && result.data.exists) {
                await doDownload(list, saveDir, nameType);
                return true;
            }
        } catch (e) {
            console.log(e);
            return false;
        }
        setCurrent(first);
        try {
            console.log(first, destFile);
            let ret = await simpleDownload(first, destFile);
            if (ret === false) {

                return false;
            }
            await doDownload(list, saveDir, nameType);
        } catch (error) {
            console.log(error);
        }
    };

    const simpleDownload = async (url, dest) => {
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
            console.log(result);
            await invoke.deleteFile(dest);
            return false;
        } catch (e) {
            console.log(e);
            return false;
        }
    };

    const openDirectory = async () => {
        let dir = form.getFieldValue("work_dir");
        if (dir == null || dir == "") {
            return;
        }
        await invoke.openPath(dir);
    };

    return (
        <>
            <Card style={{ marginBottom: "10px" }}>
                <Form
                    form={form}
                    labelCol={{ span: 4 }}
                    onValuesChange={formChange}
                >
                    <Form.Item label="URL链接">
                        <Row gutter={10}>
                            <Col span={21}>
                                <Form.Item
                                    rules={[{ required: true }]}
                                    field="content"
                                >
                                    <Input.TextArea
                                        rows={8}
                                        placeholder="url链接，一行一个"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={3}>
                                <Button type="primary" onClick={loadTxt}>
                                    LoadFile
                                </Button>
                            </Col>
                        </Row>
                    </Form.Item>
                    <Form.Item label="存储目录">
                        <Row gutter={10}>
                            <Col span={15}>
                                <Form.Item
                                    rules={[{ required: true }]}
                                    field="work_dir"
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
                                onClick={toDownload}
                                disabled={downloadStatus == "downloading"}
                            >
                                {buttonTextMap[downloadStatus] != undefined
                                    ? buttonTextMap[downloadStatus]
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

            {downloadStatus == "downloading" && (
                <Card>
                    <div>
                        <Statistic
                            title="剩余下载项"
                            value={downloadList.length}
                            style={{ marginRight: 60 }}
                            extra={<>正在下载：{current}</>}
                        />
                    </div>
                </Card>
            )}
        </>
    );
};

export default DownloadPage;
