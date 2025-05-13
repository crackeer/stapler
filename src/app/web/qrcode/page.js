"use client";
import React from "react";
import { Input, Grid, Radio } from "@arco-design/web-react";
import { Base64 } from "js-base64";
import dayjs from "dayjs";
import { QRCodeSVG } from "qrcode.react";
import cache from "@/util/cache";
const Row = Grid.Row;
const Col = Grid.Col;
const RadioGroup = Radio.Group;
class Convert extends React.Component {
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            input: "",
        };
    }
    async componentDidMount() {
        let input = (await cache.readFile("web-qrcode-default")) || "http://baidu.com";
        this.setState(
            {
                input: input,
            },
            this.handle
        );
    }
    handleInputChange = async (value) => {
        this.setState({ input: value });
        cache.writeFile("web-qrcode-default", value);
    };
    render() {
        return (
            <div>
                <Row>
                    <Col span={24}>
                        <Input.TextArea
                            rows={5}
                            onChange={this.handleInputChange}
                            value={this.state.input}
                        ></Input.TextArea>
                    </Col>
                </Row>

                <div style={{ margin: "20px auto", textAlign: "center" }}>
                    <QRCodeSVG
                        value={this.state.input}
                        size={400} // 二维码的大小
                    />
                </div>
            </div>
        );
    }
}

export default Convert;
