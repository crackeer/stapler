"use client";
import React from "react";
import { useEffect, useState } from "react";
import {
    Upload,
    Button,
    Layout,
    Form,
    Input,
    Card,
    Message
} from "@arco-design/web-react";
import '@arco-design/web-react/es/_util/react-19-adapter';
import invoke from "@/util/invoke";

const FtpPage = () => {
    const [currentDir, setCurrentDir] = useState("/");
    const [files, setFiles] = useState([
        { name: "documents", type: "directory" },
        { name: "image.jpg", type: "file", size: "2.3MB" },
    ]);
    const [form] = Form.useForm();

    useEffect(() => {
        form.setFieldValue("port", "21");
    }, []);

    const connectFTPServer = async () => {
        try {
            Message.loading({
                content: "连接中...",
            })
            const values = await form.validate();
            let result = await invoke.connectFTPServer(
                values.host,
                parseInt(values.port),
                values.username,
                values.password
            )
            console.log(result)
        } catch (e) {
            console.log("Error", typeof e)
            Message.error(e)
        }
    };

    return (
        <>
            <Card>
                <Form
                    id="refreshForm"
                    layout="inline"
                    form={form}
                    style={{ width: "auto" }}
                >
                    <Form.Item
                        field="host"
                        label="host"
                        rules={[{ required: true, message: "请输入主机" }]}
                    >
                        <Input placeholder="输入host" />
                    </Form.Item>
                    <Form.Item
                        field="port"
                        label="port"
                        rules={[{ required: true, message: "请输入端口" }]}
                    >
                        <Input placeholder="输入port" />
                    </Form.Item>
                    <Form.Item
                        field="username"
                        label="username"
                        rules={[{ required: true, message: "请输入用户名" }]}
                    >
                        <Input placeholder="输入username" />
                    </Form.Item>
                    <Form.Item
                        field="password"
                        label="password"
                        rules={[{ required: true, message: "请输入密码" }]}
                    >
                        <Input placeholder="输入password" />
                    </Form.Item>

                    <Button type="primary" onClick={connectFTPServer}>
                        连接
                    </Button>
                </Form>
            </Card>
        </>
    );
};

export default FtpPage;