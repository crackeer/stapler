import React from 'react';
import '@/styles/globals.css'
import "@arco-design/web-react/dist/css/arco.css";
import { Layout, Menu, Affix, Divider } from '@arco-design/web-react';
import { IconHome, IconCodeSquare, IconScan, IconSend, IconHighlight, IconCloudDownload, IconQrcode } from '@arco-design/web-react/icon';
import cache from '@/util/cache';
const Sider = Layout.Sider;
const MenuItem = Menu.Item;

const MenuList = [
    { 'key': 'main', 'icon': <IconHome />, 'title': '主页' },
    { 'key': '/markdown/create', 'icon': <IconCodeSquare />, 'title': '新建Markdown' },
    { 'key': '/json/create', 'icon': <IconCloudDownload />, 'title': '新建JSON' },
    { 'key': '/tools/web', 'icon': <IconHighlight />, 'title': 'Web工具' },
    { 'key': '/tools/qrcode', 'icon': <IconQrcode />, 'title': 'QRCode生成' },
    { 'key': '/http/web_static', 'icon': <IconQrcode />, 'title': 'WebStatic' },
]

function getMarginLeft(value) {
    if (value) {
        return "48px"
    }
    return "200px"
}
class ClassApp extends React.Component {
    ref = null
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            headTitle: null,
            collapsed: null,
            marginLeft: '',
        }
    }
    componentDidMount = async () => {
        let collapsed =  0
        await this.setState({
            collapsed: collapsed,
            marginLeft: getMarginLeft(collapsed)
        });
    }
    refUpdate = async (ref) => {
        this.ref = ref;
        if (ref != null && ref.pageTitle != undefined) {
            this.setState({
                headTitle: ref.pageTitle(),
            })
        }
    }
    updateTitle = () => {
        if (this.ref != null && this.ref.pageTitle != undefined) {
            this.setState({
                headTitle: this.ref.pageTitle(),
            })
        }
    }
    setCollapse = async (value) => {
        await this.setState({
            collapsed: value,
            marginLeft: getMarginLeft(value),
        })
        //cache.setMenuCollapsed(value ? 1 : 0)
    }
    clickMenuItem = async (key) => {
        window.location.href = key
    }
    render() {
        const { Component, pageProps } = this.props
        if (this.state.collapsed == null) {
            return null
        }
        return <>
            <Layout>
                <Sider
                    theme='dark'
                    onCollapse={this.setCollapse}
                    collapsed={this.state.collapsed}
                    collapsible
                    style={{
                        overflow: 'auto',
                        height: '100vh',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                    }}
                >
                    <Menu onClickMenuItem={this.clickMenuItem} theme='dark'>
                        {
                            MenuList.map(item => {
                                return <MenuItem key={item.key}>{item.icon}{item.title}</MenuItem>
                            })
                        }
                    </Menu>
                </Sider>
                <Layout style={{ marginLeft: this.state.marginLeft, padding: '1px 10px' }}>
                    {this.state.headTitle}
                    <Divider></Divider>
                    <Component {...pageProps} ref={this.refUpdate} updateTitle={this.updateTitle} />
                </Layout>
            </Layout>

        </>
    }
}
export default ClassApp