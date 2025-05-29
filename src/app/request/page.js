'use client'

import React from 'react';
import { Table, Button, Space, Modal, Card, Input, Divider, Steps, Tag, Message, Grid, Tabs, Form, Checkbox, Radio } from '@arco-design/web-react';
import lodash, { set, truncate } from 'lodash'
import * as XLSX from 'xlsx';
import JSONEditor from '@/component/JSONEditor';
import { IconArrowDown } from "@arco-design/web-react/icon";
const Row = Grid.Row;
const Col = Grid.Col;
const style = {
    textAlign: 'center',
    marginTop: 20,
};
const FormItem = Form.Item;

var buildParams = (data, struct) => {
    if (typeof struct == "string") {
        if (lodash.startsWith(struct, "@")) {
            return lodash.get(data, struct.substring(1))
        }
    }

    if (typeof struct == 'object' && struct.length == undefined) {
        let retData = {}
        Object.keys(struct).forEach(key => {
            retData[key] = buildParams(data, struct[key])
        })
        return retData
    }
    if (typeof struct == 'object' && struct.length != undefined) {
        let retData = []
        for (var i in struct) {
            retData.push(buildParams(data, struct[i]))
        }
        return retData
    }
    return struct
}
class App extends React.Component {
    json1 = null
    json2 = null
    json3 = null
    form = null
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            inputValue: "",
            paramsList: [],
            requests: [],
            loading: true,
            paramsTempl: null,
            resultTpl: null,
            api: "",
            showRequestModal: false,
            showCollect: false,
            dataSource: [],
            tableData: [],
            tableHeader: [],
            formInitValue: {
                url: '',
                method: 'GET',
                content_type: '',
            },
            initHeader: {},
        }
    }
    async componentDidMount() {

    }
    onHeaderJsonReady = (ele) => {
        this.json3 = ele;
        setTimeout(() => {
            this.json3.set(this.state.initHeader || {});
        }, 100)
    }
    onParamsTmpJsonReady = (ele) => {
        this.json1 = ele;
        setTimeout(() => {
            this.json1.set(this.state.paramsTempl || {});
        }, 100)
    }
    onDataSourceJsonReady = (ele) => {
        this.json2 = ele;
        setTimeout(() => {
            this.json2.set(this.state.paramsList || []);
        }, 100)
    }
    onFileChange = (target, event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellHTML: false });
                let jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
                let paramList = this.intoObjectList(jsonData);
                console.log('转换后的数据', paramList)
                this.json2.set(paramList);
                return
                this.setState({
                    paramsList: paramList,
                    requests: this.formatRequests(paramList, this.state.paramsTempl),
                    processIndex: -1,
                })
            };
            reader.readAsArrayBuffer(file);
        }
    }
    importInputValue = () => {
        try {
            let paramsList = JSON.parse(this.state.inputValue)
            this.setState({
                paramsList: paramsList,
                requests: this.formatRequests(paramsList, this.state.paramsTempl),
                processIndex: -1,
            })
        } catch (e) {

        }
    }
    formatRequests = (paramsList, paramsTempl) => {
        let retData = []
        for (var i in paramsList) {
            let tmp = {
                excel: JSON.stringify(paramsList[i]),
                response: '',
                index: i,
            }
            if (paramsTempl == null || Object.keys(paramsTempl).length < 1) {
                tmp['params'] = tmp.excel
            } else {
                tmp['params'] = JSON.stringify(buildParams(paramsList[i], paramsTempl))
            }
            retData.push(tmp)
        }
        console.log(retData)
        return retData
    }
    intoObjectList = (list) => {
        let retData = []
        for (var i in list) {
            if (i > 0) {
                let tmp = {}
                for (var j in list[0]) {
                    tmp[list[0][j]] = list[i][j]
                }
                retData.push(tmp)
            }
        }
        return retData
    }
    startRequest = async () => {
        if (this.state.api.length < 1) {
            Message.info("请输入api")
            return
        }

        for (var i in this.state.requests) {
            let data = JSON.parse(this.state.requests[i].params)
            console.log('请求参数', data)
            let result = {}
            lodash.set(this.state, 'requests.' + i + '.response', JSON.stringify(result))
            await this.setState({
                processIndex: i,
                requests: this.state.requests,
            })
        }
    }
    batchBuildParams = () => {
        this.setState({
            requests: this.formatRequests(this.state.dataSource, this.state.paramsTempl),
            showRequestModal: true,
            processIndex: -1,
        })
        console.log('批量构建参数', this.state.requests, this.state.paramsTempl)
    }
    showCollectModal = () => {
        this.setState({
            showCollect: true
        })
    }
    doCollectResult = async () => {
        let tableHeader = []
        let tableData = []
        if (this.state.resultTpl == null || (typeof this.state.resultTpl == 'object' && Object.keys(this.state.resultTpl).length < 1)) {
            await this.setState({
                tableData: lodash.clone(this.state.requests),
                tableHeader: [{
                    title: 'excel',
                    dataIndex: 'excel',
                },
                {
                    title: 'params',
                    dataIndex: 'params',
                },
                {
                    title: 'response',
                    dataIndex: 'response',
                }]
            })
            return
        }

        for (var i in this.state.requests) {
            let data = {
                excel: this.tryDecode(this.state.requests[i].excel),
                params: this.tryDecode(this.state.requests[i].params),
                response: this.tryDecode(this.state.requests[i].response),
            }
            let realData = buildParams(data, this.state.resultTpl)
            if (tableHeader.length < 1) {
                Object.keys(realData).forEach(k => {
                    tableHeader.push({
                        title: k,
                        dataIndex: k,
                    })
                })
            }
            tableData.push(realData)
        }
        await this.setState({
            tableData: tableData,
            tableHeader: tableHeader
        })
    }
    tryDecode = (value) => {
        try {
            return JSON.parse(value)
        } catch (e) {
            return value
        }
    }
    exportExcel = async () => {
        let ExportJsonExcel = await require('js-export-excel')
        let sheetHeader = []
        this.state.tableHeader.forEach(item => {
            sheetHeader.push(item.dataIndex)
        })
        let sheetData = []
        this.state.tableData.forEach(item => {
            let tmp = {}
            for (var i in sheetHeader) {
                if (item[sheetHeader[i]] == undefined) {
                    tmp[sheetHeader[i]] = ''
                } else {
                    tmp[sheetHeader[i]] = item[sheetHeader[i]]
                }
            }
            sheetData.push(tmp)
        })
        console.log(sheetHeader, this.state.tableData)
        try {
            let date = new Date();
            let dateStr = date.toLocaleDateString().replace(/\//g, '-')
            var toExcel = new ExportJsonExcel({
                datas: [{
                    sheetData: sheetData,
                    sheetName: 'sheet',
                    sheetHeader: sheetHeader,
                }],
                fileName: "smart-request-" + dateStr
            });
            toExcel.saveExcel()
            message.info('下载成功')
        } catch (e) {
            message.error(e)
        }
    }

    render() {
        return (
            <div>
                <div style={{ margin: '0 10%' }}>
                    <Form autoComplete='off' form={this.form} initialValues={this.state.formInitValue} ref={(ele) => { this.form = ele }}>
                        <FormItem label='URL' field='url' rules={[{ required: true, message: 'URL不能为空' }]} >
                            <Input placeholder='please enter URL, eg: https://www.baidu.com' />
                        </FormItem>
                        <FormItem label='Method' field='method' >
                            <Radio.Group type='button' >
                                <Radio value='GET'>GET</Radio>
                                <Radio value='POST'>POST</Radio>
                                <Radio value='PUT'>PUT</Radio>
                                <Radio value='DELETE'>DELETE</Radio>
                            </Radio.Group>
                        </FormItem>
                        <FormItem label='ContentType' field='content_type' >
                            <Radio.Group type='button' >
                                <Radio value=''>无</Radio>
                                <Radio value='application/json'>application/json</Radio>
                                <Radio value='application/x-www-form-urlencoded'>application/x-www-form-urlencoded</Radio>
                            </Radio.Group>
                        </FormItem>
                        <FormItem label='Header' field='header'>
                            <JSONEditor
                                json={{}}
                                onValidate={(val) => this.setState({ header: val })}
                                height="230px"
                                ref={this.onHeaderJsonReady}
                            />
                        </FormItem>
                        <FormItem label='参数模版' >
                            <JSONEditor
                                json={{}}
                                onValidate={(val) => this.setState({ paramsTempl: val })}
                                height="230px"
                                ref={this.onParamsTmpJsonReady}
                            />
                        </FormItem>
                        <FormItem label='数据源(jsonArray)' >
                            <Input type='file' accept='.xlsx,.xls' onChange={this.onFileChange} />
                            <JSONEditor
                                json={{}}
                                onValidate={(val) => this.setState({ dataSource: val })}
                                height="230px"
                                ref={this.onDataSourceJsonReady}
                            />
                        </FormItem>
                        <FormItem label='操作'>
                            <Button type='primary' size='small' onClick={this.batchBuildParams}>开始请求</Button>
                        </FormItem>

                    </Form>
                </div>

                <Modal visible={this.state.showRequestModal} title={"批量请求"} onCancel={() => {
                    this.setState({ showRequestModal: false })
                }} onOk={() => { this.setState({ showRequestModal: false }) }} style={{ width: '80%' }}>
                    <Divider style={{ marginTop: '-10px' }}>
                        <Button onClick={this.startRequest} type='primary' size='small'>开始请求</Button>
                    </Divider>
                    <div style={{ height: '400px', overflowY: 'scroll' }}>
                        {
                            this.state.requests.map((item, index) => {
                                return <Card style={{ marginBottom: '10px' }} title={<div>第{index + 1}个 {this.state.processIndex >= index ? '(ok)' : ''}</div>} size='small'>
                                    <Row gutter={20}>
                                        <Col span={12}>
                                            参数
                                            <Input.TextArea value={item.params}></Input.TextArea>
                                        </Col>
                                        <Col span={12}>
                                            响应
                                            <Input.TextArea value={item.response}></Input.TextArea>
                                        </Col>
                                    </Row>
                                </Card>
                            })
                        }
                    </div>
                </Modal>


                <Modal visible={this.state.showCollect} title={"收集结果"} width={'75%'} onCancel={() => {
                    this.setState({ showCollect: false })
                }} onOk={() => { this.setState({ showCollect: false }) }}>
                    <JSONEditor
                        json={{}}
                        onValidate={(val) => this.setState({ resultTpl: val })}
                        height="230px"
                        ref={(ele) => { this.json1 = ele }}
                    />
                    <p style={{ marginTop: '10px' }}>
                        获取excel列：<Tag>@excel</Tag>, 获取参数列：<Tag>@params</Tag>, 获取response列：<Tag>@response</Tag>
                    </p>
                    <Divider>
                        <Space>
                            <Button onClick={this.doCollectResult} type='dashed'>1. 构建Excel</Button>
                            -----
                            <Button onClick={this.exportExcel} type='dashed'>2. 下载Excel</Button>
                        </Space>
                    </Divider>
                    <Table
                        columns={this.state.tableHeader}
                        rowKey={'index'}
                        dataSource={this.state.tableData}
                        size="small"
                        pagination={false}
                    />
                </Modal>
            </div>
        );
    }
}

export default App;
