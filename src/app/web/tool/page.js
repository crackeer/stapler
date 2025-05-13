'use client'
import React from 'react';
import {  Input, Grid, Radio } from '@arco-design/web-react';
import { Base64 } from 'js-base64';
import dayjs from 'dayjs'
import cache from "@/util/cache";
const Row = Grid.Row;
const Col = Grid.Col;
const RadioGroup = Radio.Group;
class Convert extends React.Component {
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            input: '',
            output: '',
            tool: ''
        }
    }
    async componentDidMount() {
        let tool = await cache.get('web-tool-default') || 'base64_decode';
        let input = await cache.get('web-tool-default-input') || '';
        this.setState({
            tool: tool,
            input : input,
        }, this.handle)
    }
    handleToolChange = async (value) => {
        this.setState({ tool: value}, this.handle)
        cache.set('web-tool-default', value)
    }
    handleInputChange = async (value) => {
        this.setState({ input: value}, this.handle)
        cache.set('web-tool-default-input', value)
    }

    handle = async () => {
        let {input, tool} = this.state
        let output = ""
        let displayQRCode = false
        console.log(input, tool, 'handle')
        switch (tool) {
            case "base64_decode":
                output = Base64.decode(input)
                break
            case "base64_encode":
                output = Base64.encode(input)
                break
            case "urldecode":
                output = encodeURIComponent(input)
                break
            case "urlencode":
                output = decodeURIComponent(input)
                break
            case "formate_time":
                output = dayjs(this.state.input * 1000).format('YYYY-MM-DD HH:mm:ss')
                break
            case "now_timestamp":
                output = '' + dayjs().unix()
                break
        }
        this.setState({
            output: output,
        })
    }
    render() {
        return (
            <div>
                <Row>
                    <Col span={24}>
                        <Input.TextArea rows={5} onChange={this.handleInputChange} value={this.state.input}></Input.TextArea>
                    </Col>
                </Row>

                <RadioGroup defaultValue='base64_decode' style={{ marginBottom: 20, marginTop: 20 }} value={this.state.tool} onChange={
                    this.handleToolChange
                }>
                    <Radio value='urldecode'>UrlDecode</Radio>
                    <Radio value='urlencode'>UrlEncode</Radio>
                    <Radio value='base64_decode'>Base64Decode</Radio>
                    <Radio value='base64_encode'>Base64Encode</Radio>
                    <Radio value='now_timestamp'>当前时间戳</Radio>
                    <Radio value='formate_time'>格式化时间戳</Radio>
                </RadioGroup>
                <Row style={{ marginTop: '20px' }}>
                    <Col span={24}>
                        <Input.TextArea rows={5} value={this.state.output}></Input.TextArea>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default Convert;