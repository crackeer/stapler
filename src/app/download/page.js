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
    Checkbox,
    Statistic,
} from "@arco-design/web-react";
import common from "@/util/common";
import lodash from "lodash";
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

    useEffect(() => { }, []);
    var hashMap = {};

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
                    extensions: ["txt", "log"],
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
            form.setFieldValue('content', result.data)

        } catch (e) { }
    };

    const toDownload = async () => {
        let workDir = form.getFieldValue("work_dir");
        setDownloadStatus("downloading");
        let urls = common.splitIntoArray(form.getFieldValue('content'));
        console.log(form.getFieldValue('content'));

        if (urls.length < 1) {
            return;
        }
        console.log(urls);

        await doDownload(urls, workDir, 0);
        setDownloadStatus("success");
    };


    const doDownload = async (list, saveDir, nameType) => {
        if (list.length == 0) {
            return;
        }
        let first = list.shift();
        setDownloadList(list);
        let object = new URL(first)
        let filePath = object.pathname;
        let destFile = await path.join(saveDir, filePath);
        console.log(first, destFile);

        try {
            let result = await invoke.fileExists(destFile);
            if (result.success && result.data.exists) {
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
            await invoke.deleteFile(dest);
            return false;
        } catch (e) {
            console.log(e);
            return false;
        }
    };


    return (
        <>
            <Card style={{ marginBottom: "10px" }}>
                <Form form={form} labelCol={{ span: 4 }}>
                    <Form.Item
                        label="URL链接"
                    >
                        <Row gutter={10}>
                            <Col span={21}>
                                <Form.Item rules={[{ required: true }]} field="content">
                                    <Input.TextArea
                                        autoSize={{ minRows: 5, maxRows: 15 }}
                                        placeholder="url链接"
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
                    <Form.Item
                        label="存储目录"
                        field="work_dir"
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
                                onClick={toDownload}
                                disabled={
                                    downloadStatus == "downloading"
                                }
                            >
                                {buttonTextMap[downloadStatus] != undefined
                                    ? buttonTextMap[downloadStatus]
                                    : "下载"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
            {downloadStatus == "indexing" ? (
                <Alert
                    style={{ marginBottom: 10 }}
                    type="info"
                    content={`检索文件目录：${indexDir}`}
                />
            ) : null}
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

