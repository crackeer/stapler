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
const CheckboxGroup = Checkbox.Group;
const CubeSizes = ["2048", "4096", "6144"];

const buttonTextMap = {
    converting: "转换中",
    indexing: "检索中",
};

const defaultCerticate = `-----BEGIN CERTIFICATE-----\nMIIEMzCCAhsCCQDYAS/7ATZRmTANBgkqhkiG9w0BAQsFADCBkzELMAkGA1UEBhMC\nQ04xEDAOBgNVBAgMB0JlaWppbmcxEDAOBgNVBAcMB0JlaWppbmcxFDASBgNVBAoM\nC2xpYW5qaWEuY29tMRAwDgYDVQQLDAdSZWFsc2VlMREwDwYDVQQDDAhIYXJkd2Fy\nZTElMCMGCSqGSIb3DQEJARYWbml1aGFpcWluZ0BsaWFuamlhLmNvbTAeFw0yMTA5\nMTAwNTIwMDBaFw0zMTA5MDgwNTIwMDBaMIGmMQswCQYDVQQGEwJDTjEQMA4GA1UE\nCAwHQmVpSmluZzEQMA4GA1UEBwwHQmVpSmluZzEQMA4GA1UECgwHUmVhbHNlZTEZ\nMBcGA1UECwwQUmVhbHNlZUFwcEdldHdheTEgMB4GA1UEAwwXYXBwLWdhdGV3YXku\ncmVhbHNlZS5jb20xJDAiBgkqhkiG9w0BCQEWFWRldmVsb3BlckByZWFsc2VlLmNv\nbTCBnzANBgkqhkiG9w0BAQEFAAOBjQAwgYkCgYEAuv/y3Ezsy/wh3LCA8vomPbgI\nSO9iO5kyR+oAetklD+epMU6J/ZbvTDEomZxuS5iyyKGBupzAh2ZFLIy7tsE71Vx1\nIIvT7Kdyq66lMU4YzdrpKUcxv7oOQnO8DA1orKluNa4jkyXBywHKs/Q+20LVc+RD\ngKXqFGJUdo8mAxEScs0CAwEAATANBgkqhkiG9w0BAQsFAAOCAgEAkMxsU4VLPd4J\n0rElBNBIyqPtvnlTs6VkhIK0l4oM58wtDKc1uG9UPSX5j29NguZM6LOe0jCsU2Vg\nEpUseMWQjx4o2yBg7MokQyjWc1zu6PppKhQ+RqHQy/biJ2zsIMpX3oMASXffvnW5\nn4Bjyo1JdDJiLm1fLvLlVVxQoraJD+rtpqWDEYixGVREUo5OIL5Y5dVjkHG2r9RQ\nQuu3yEiyr9gAW8yhz3YR6/sJ6boyGK8NC0v8Jih7NnCdT+9ML+3jn3P5F3TeXdSf\nVeYIm5oWAOTe3AjjKP8ARMb2RYACjg80/AcowD/dvRRjbwQmyucUNug2pXJynXpD\nNfx1IBmUmzSAT1Z5yNuY/f3VRBJvmIQ6Jpmef+g0/wUJpyS4SObguItyYlFPLqRH\nK1oKqNX/uV0GWWEQl6Lml986TzlHxc4ljtHBhjzlKYIYYZLWWipk4JiB8hxJcTK+\ncrgvclEQSxFlmAyoqxYFClrOOsPqZJdBhDTvoUWnnWuJLQt7DLHpyInp+S75Gg3o\n0zgHpt9m26B3YbjQGYMQlYmhl2VLQa+Ey0W8UZQXLcTvoRT4p+8crqr6cNNsxCyZ\nm08vBbEMIMvhBeLQvpM75oaMBmelegipFl2eelxVIHdGJWoyJSZQUdXN0uSidhZp\nI7AIgzhqK1Ku/IXK0OSXJonn+/9X/VI=\n-----END CERTIFICATE-----`
const VRPage = () => {
    const [convertList, setConvertList] = useState([]);
    const [current, setCurrent] = useState("");
    const [convertStatus, setConvertStatus] = useState("");
    const [indexDir, setIndexDir] = useState("");
    const [form] = Form.useForm();

    useEffect(() => {}, []);
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

    const convertJSONP = async () => {
        let workDir = form.getFieldValue("work_dir");
        setConvertStatus("indexing");
        let fileList = await getFileList(workDir, "");
        setIndexDir("");
        setConvertList(fileList);

        let saveDir = await path.join(workDir, "__jsonp__");
        setConvertStatus("converting");
        hashMap = {};
        await doConvert(fileList, workDir, saveDir);
        console.log(hashMap);

        // convert and write work.js
        let workJSON = await readWorkJSON(workDir);
        workJSON["certificate"] = defaultCerticate
        console.log(workJSON);
        workJSON = convertWorkJSON(workJSON);
        console.log(workJSON);
        let workSavePath = await path.join(saveDir, "work.js");
        await invoke.writeFile(workSavePath, 'var workJSON = ' + JSON.stringify(workJSON));
        setConvertStatus("success");
    };

    const readWorkJSON = async (workDir) => {
        let workJSONPath = await path.join(workDir, "work.json");
        try {
            let result = await invoke.readFile(workJSONPath);
            if (!result.success) {
                message(result.message);
                return;
            }
            return JSON.parse(result.data)
        } catch (e) {
            message(e);
            return {}
        }
    };

    const convertWorkJSON = (workJSON) => {
        let fileURL = lodash.get(workJSON, "model.file_url", "");
        if (fileURL.length > 0 && hashMap[fileURL] != undefined) {
            lodash.set(
                workJSON,
                "model.file_url",
                fileURL + "." + hashMap[fileURL] + ".jsonp"
            );
        }
        let material_textures = lodash.get(workJSON, "model.material_textures", []);
        let prefix = lodash.get(workJSON, "model.material_base_url", "");
        for (var i in material_textures) {
            let hashKey = prefix + material_textures[i];
            console.log(hashKey, hashMap[hashKey]);
            if (hashMap[hashKey] != undefined) {
                material_textures[i] =
                    material_textures[i] +
                    "." +
                   hashMap[hashKey]+
                    ".jsonp";
            }
        }
        lodash.set(workJSON, "model.material_textures", material_textures);
        let layers = lodash.get(workJSON, "model.layers", []);
        for (var i in layers) {
            if (hashMap[layers[i].tileset_url] != undefined) {
                layers[i].tileset_url =
                    layers[i].tileset_url +
                    "." +
                    hashMap[layers[i].tileset_url] +
                    ".jsonp";
            }
        }
        lodash.set(workJSON, "model.layers", layers);

        let panoList = lodash.get(workJSON, "panorama.list", []);
        let items = ["back", "front", "left", "right", "up", "down"];
        for (var i in panoList) {
            for (var j in items) {
                console.log(panoList[i][items[j]], hashMap[panoList[i][items[j]]]);
                if (hashMap[panoList[i][items[j]]] != undefined) {
                    panoList[i][items[j]] =
                        panoList[i][items[j]] +
                        "." +
                        hashMap[panoList[i][items[j]]] +
                        ".jsonp";
                }
            }
        }
        console.log(panoList);
        lodash.set(workJSON, "panorama.list", panoList);
        return workJSON;
    };

    const getFileList = async (workDir, relativePath) => {
        if (workDir.length < 1) {
            return [];
        }
        let retData = [];
        let realDir = await path.join(workDir, relativePath);
        console.log(realDir);
        setIndexDir(realDir);
        let result = await invoke.simpleReadDir(realDir);
        if (!result.success) {
            return retData;
        }
        let files = result.data;
        console.log(files);
        files = files.filter((item) => {
            if (item.name.startsWith("__") || item.name.startsWith(".")) {
                return false;
            }
            return true;
        });

        for (var i in files) {
            let tmpPath = await path.join(relativePath, files[i].name);
            if (files[i].file_type == "file" && files[i].name != "work.json") {
                retData.push(tmpPath);
            } else {
                let subList = await getFileList(workDir, tmpPath);
                retData = retData.concat(subList);
            }
        }

        return retData;
    };

    const doConvert = async (list, srcDir, saveDir) => {
        if (list.length == 0) {
            return;
        }
        let first = list.shift();
        let md5Str = common.md5(first).substring(0, 8);
        hashMap[first] = md5Str;
        let srcFile = await path.join(srcDir, first);
        let destFile = await path.join(saveDir, first);

        setCurrent(first);
        try {
            console.log(srcFile, destFile);
            let ret = await invoke.createJSONPFile(
                srcFile,
                destFile + "." + md5Str + ".jsonp",
                md5Str
            );
            await doConvert(list, srcDir, saveDir, hashMap);
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <>
            <Card style={{ marginBottom: "10px" }}>
                <Form form={form} labelCol={{ span: 4 }}>
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
                                onClick={convertJSONP}
                                disabled={
                                    convertStatus == "converting" ||
                                    convertStatus == "indexing"
                                }
                            >
                                {buttonTextMap[convertStatus] != undefined
                                    ? buttonTextMap[convertStatus]
                                    : "转换"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
            {convertStatus == "indexing" ? (
                <Alert
                    style={{ marginBottom: 10 }}
                    type="info"
                    content={`检索文件目录：${indexDir}`}
                />
            ) : null}
            {convertStatus == "success" ? (
                <Alert
                    style={{ marginBottom: 20 }}
                    type="success"
                    content="转换成功"
                />
            ) : null}

            {convertStatus == "converting" && (
                <Card>
                    <div>
                        <Statistic
                            title=" 剩余转换项"
                            value={convertList.length}
                            style={{ marginRight: 60 }}
                            extra={<>正在转换：{current}</>}
                        />
                    </div>
                </Card>
            )}
        </>
    );
};

export default VRPage;
