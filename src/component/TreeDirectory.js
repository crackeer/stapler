import React from 'react';
import { Tree } from '@arco-design/web-react';
import { simpleReadDir } from '../util/invoke'
import { sortFileList } from '@/util/common';
import { IconDown } from '@arco-design/web-react/icon';
import { Dropdown, Menu, Grid } from '@arco-design/web-react';
import { showEdit, hideEdit } from '../plugins/edit'
const getSubDir = async (dir) => {
    let fileList = await simpleReadDir(dir, ".md")
    fileList = sortFileList(fileList)
    const { join } = await import('@tauri-apps/api/path')
    let children = []
    for (var i in fileList) {
        let key = await join(dir, fileList[i].path)
        let child = {
            title: fileList[i].path,
            key: key,
            isLeaf: fileList[i].item_type == 'file',
        }
        if(!child.isLeaf) {
            child.children = await getSubDir(key)
        }
        children.push(child)
    }
    return children
}


const TreeDirectory = React.forwardRef((props, ref) => {
    const [treeData, setTreeData] = React.useState([]);
    const [selectKeys, setSelectKeys] = React.useState([props.activeFile]);
    const [expandKeys, setExpandKeys] = React.useState([]);
    React.useImperativeHandle(
        ref,
        () => ({ initData })
    );

    var initData = async (dir) => {
        let children = await getSubDir(dir)
        setTreeData(children)
    }
    const loadMore = async (treeNode) => {
        treeNode.props.dataRef.children = await getSubDir(treeNode.key)
        setTreeData([...treeData]);
    };
    const reload = async () => {
        initData(props.rootDir)
    }
    React.useEffect(() => {
        initData(props.rootDir)
    }, [])

    return <Tree icons={{
        switcherIcon: <IconDown />,
    }} defaultSelectedKeys={selectKeys}
        selectedKeys={selectKeys}
        loadMore={loadMore}
        treeData={treeData}
        onSelect={(value, info) => {
            if (info.node.props.isLeaf) {
                props.clickFile(info.node.props.dataRef.key)
                setSelectKeys([info.node.props.dataRef.key])
            }
        }}
        expandedKeys={expandKeys}
        onExpand={(value, info) => {
            setExpandKeys(value)
        }}
        size='small'
        actionOnClick={['expand', 'select']}
        renderTitle={(node) => {
            const { isLeaf, title } = node
            return <Dropdown
                trigger='contextMenu'
                position='bl'
                droplist={
                    <Menu>
                        <Menu.Item key='1' onClick={(e) => {
                            showEdit(node, 'rename', reload)
                            e.stopPropagation()
                        }}>重命名</Menu.Item>
                        <Menu.Item key='2' onClick={(e) => {
                                showEdit(node, 'delete_file', reload)
                                e.stopPropagation()
                            }}>删除</Menu.Item>
                        {!isLeaf ? <>
                            <Menu.Item key='new_folder' onClick={(e) => {
                                showEdit(node, 'new_folder', reload)
                                e.stopPropagation()
                            }}>新建文件夹</Menu.Item>
                            <Menu.Item key='new_file' onClick={(e) => {
                                showEdit(node, 'new_file', reload)
                                e.stopPropagation()
                            }}>新建文件</Menu.Item>
                        </> : null}
                    </Menu>
                }>
                {title}
            </Dropdown>
        }}
    ></Tree>;
})

export default TreeDirectory;