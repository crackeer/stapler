import { useState } from 'react';
import { Tree, Upload, Button, Layout, List } from '@arco-design/web-react';
import styles from './page.module.css';
import { invoke } from '@tauri-apps/api/tauri';

const TreeNode = Tree.Node;
const Sider = Layout.Sider;
const Content = Layout.Content;

const FtpPage = () => {
  const [currentDir, setCurrentDir] = useState('/');
  const [files, setFiles] = useState([
    { name: 'documents', type: 'directory' },
    { name: 'image.jpg', type: 'file', size: '2.3MB' }
  ]);

  const treeData = [{
    title: '根目录',
    key: '/',
    children: [
      { title: '文档', key: '/documents' },
      { title: '图片', key: '/images' }
    ]
  }];

  return (
    <Layout className={styles.arcoLayout}>
      <Sider width={280} className={styles.sider}>
        <Tree
          blockNode
          treeData={treeData}
          onSelect={(keys) => setCurrentDir(keys[0])}
          renderTitle={(node) => (
            <Button type='text' className={styles.treeButton}>
              {node.title}
            </Button>
          )}
        />
      </Sider>

      <Content className={styles.content}>
        <Upload
          action='/api/upload'
          className={styles.uploadArea}
          drag
          showUploadList={false}
          customRequest={({ file }) => handleFileUpload(file)}
        >
          <div className={styles.uploadTip}>
            <Button type='primary'>点击或拖拽文件上传</Button>
          </div>
        </Upload>

        <List
          bordered={false}
          header={<h3>当前路径：{currentDir}</h3>}
          dataSource={files}
          render={(item) => (
            <List.Item
              actions={[
                item.type === 'file' && <Button type='text'>下载</Button>
              ]}
            >
              <List.Item.Meta
                avatar={<div className={styles.fileIcon} />}
                title={item.name}
                description={item.size}
              />
            </List.Item>
          )}
        />
      </Content>
    </Layout>
  );
};

export default FtpPage;

const handleFileUpload = async (file) => {
  try {
    await invoke('upload_file', {
      path: currentDir,
      contents: new Uint8Array(await file.arrayBuffer())
    });
    // 上传成功后刷新文件列表
    fetchFiles(currentDir);
  } catch (error) {
    console.error('上传失败:', error);
  }
};