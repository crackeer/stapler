"use client";

import React, { useState, useEffect } from "react";

import {
    Button,
    Card,
    Input,
    Divider,
    Grid,
    Select,
    Form,
    Checkbox,
    Radio,
} from "@arco-design/web-react";
import JSONEditor from "@/component/JSONEditor";

const Row = Grid.Row;
const Col = Grid.Col;

import invoke from "@/util/invoke.js";
import lodash from "lodash";
import { message } from "@tauri-apps/plugin-dialog";
const VRPage = () => {
    const [title, setTitle] = useState("");
    const [linkInfo, setLinkInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [works, setWorks] = useState([]);
    const [currentWorkIndex, setCurrentWorkIndex] = useState(-1);
    const [observerCount, setObserverCount] = useState(0);
    const [fiveInitData, setFiveInitData] = useState("");

    const [form] = Form.useForm();
    var editor = null;
    useEffect(() => {
        form.setFieldValue("url", "https://realsee.cn/yBjjNoRL");
        getWorkJSON()
    }, []);
    const onJSONEditorReady = (target) => {
        if (!target) {
            return;
        }
        editor = target;
    };

    const getWorkJSON = async () => {
        let url = form.getFieldValue("url");
        try {
            setLoading(true);
            setWorks([]);
            setCurrentWorkIndex(-1);
            setTitle("");
            setObserverCount(0);
            setFiveInitData("");
            setLinkInfo(null);
            editor.set({});
            let res = await invoke.parseJSCode(url);
            setLoading(false);
            for (var i in res) {
                if (res[i].indexOf("_signature") > 0) {
                    let data = formatJSON(res[i]);
                    setLinkInfo(data.initData.shortLinkDetail);
                    console.log(data.initData.vr.works);
                    setWorks(data.initData.vr.works);
                    setCurrentWorkIndex(0);
                    editor.set(data.initData.vr.works[0].work);
                    setObserverCount(
                        lodash.get(
                            data,
                            "initData.vr.works[0].work.panorama.list",
                            []
                        ).length
                    );
                    setTitle(
                        lodash.get(
                            data,
                            "initData.vrConfig.config.openScene.work.title"
                        )
                    );
                    setFiveInitData(JSON.stringify(data.fiveInitial));
                }
            }
        } catch (e) {
            message(e);
            console.log(e);
        }
    };

    var formatJSON = (jsCode) => {
        let expression = jsCode.replace(
            /self.__next_f.push/g,
            "JSON.stringify"
        );
        let jsonStr = eval(expression);
        try {
            let json = JSON.parse(jsonStr)[1];
            let jsonObject = JSON.parse(json.substr(json.indexOf(":") + 1));
            return lodash.get(jsonObject, "1.3.children.1.3");
        } catch (e) {
            console.log(e);
            return {};
        }
    };

    const selectWork = (index) => {
        setCurrentWorkIndex(index);
        editor.set(works[index].work);
        setObserverCount(works[index].work.panorama.list.length);
    };

    return (
        <div>
            <Card style={{ margin: "20px 5%" }}>
                <Form autoComplete="off" form={form} labelCol={{ span: 4 }}>
                    <Form.Item
                        label="URL"
                        field="url"
                        rules={[{ required: true, message: "URL不能为空" }]}
                    >
                        <Input placeholder="please enter URL, eg: https://www.baidu.com" />
                    </Form.Item>

                    <Form.Item label="操作">
                        <Button
                            type="primary"
                            size="small"
                            onClick={getWorkJSON}
                            loading={loading}
                        >
                            {loading ? "解析中" : "解析"}
                        </Button>
                    </Form.Item>
                </Form>
                <Row gutter={20}>
                    <Col span={8}>
                        <Divider orientation="left">Info</Divider>
                        <p>
                            <strong>标题：</strong> {title}
                        </p>
                        {linkInfo != null && (
                            <div>
                                <p>
                                    <strong>BindType：</strong>{" "}
                                    {linkInfo.bind_type}
                                </p>
                                <p>
                                    <strong>ResourceCode：</strong>{" "}
                                    {linkInfo.resource_code}
                                </p>
                                <p>
                                    <strong>Source：</strong> {linkInfo.source}
                                </p>
                                <p>
                                    <strong>CustomID：</strong>{" "}
                                    {linkInfo.custom_id}
                                </p>
                                <p>
                                    <strong>LinkCode：</strong>{" "}
                                    {linkInfo.link_code}
                                </p>
                                <p>
                                    <strong>NeedPassword：</strong>{" "}
                                    {linkInfo.needPassword > 0 ? "是" : "否"}
                                </p>
                                <p>
                                    <strong>FiveInitData：</strong>
                                    <Input.TextArea value={fiveInitData} rows={3}/>
                                </p>
                                <p>
                                    <strong>点位数：</strong>
                                    {observerCount}
                                </p>
                            </div>
                        )}
                    </Col>
                    <Col span={16}>
                        <Divider orientation="left">Work</Divider>
                        列表：
                        <Select
                            placeholder="选择VR"
                            value={currentWorkIndex}
                            style={{ width: 200, marginBottom: 10 }}
                            onChange={selectWork}
                            options={works.map((option, index) => {
                                return {
                                    label: option.workCode,
                                    value: index,
                                };
                            })}
                        />
                        <JSONEditor
                            height={400}
                            ref={onJSONEditorReady}
                            json={{}}
                        />
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default VRPage;
