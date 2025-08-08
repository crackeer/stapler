import invoke from "@/util/invoke";
import { basename } from '@tauri-apps/api/path'
import common, { sleep } from "@/util/common";
import { join } from '@tauri-apps/api/path'
export const connectServer = async (server) => {
    return await invoke.sshConnectByPassword(server.server, server.port, server.user, server.password, server.id + '')
}

export const executeCmd = async (server, cmd) => {
    try {
        let sessionKey = await connectServer(server)
        let result = await invoke.sshExecuteCmd(sessionKey, cmd)
        return {
            status: 'success',
            output: result
        }
    } catch (e) {
        return {
            status: 'failed',
            output: e.message,
        }
    }
}

export const executeScript = async (server, scriptFile, uploadState) => {
    try {
        let name = await basename(scriptFile)
        let sessionKey = await connectServer(server)
        await invoke.sshExecuteCmd(sessionKey, "mkdir -p /tmp/stapler/upload_script")
        let scriptName = "/tmp/stapler/upload_script/" + name
        await invoke.uploadRemoteFileSync(sessionKey, scriptFile, scriptName)

        uploadState({
            status: 'executing'
        })
        let result = await invoke.sshExecuteCmd(sessionKey, "bash " + scriptName)
        return {
            status: 'success',
            output: result
        }

    } catch (e) {
        return {
            status: 'failed',
            output: e.message,
        }
    }
}


export const uploadFile = async (server, localFile, remoteDir, updateState) => {
    try {
        let sessionKey = await connectServer(server)
        let name = await basename(localFile)
        let remoteFile = remoteDir + '/' + name
        await invoke.uploadRemoteFile(sessionKey, localFile, remoteFile)
        updateState({
            content: <>
                <p>上传文件：{localFile}</p>
                <p>上传到：{remoteFile}</p>
            </>,
            status: 'transferring'
        })

        let finished = false
        do {
            let query = await invoke.getTransferProgress()

            if (query.status != 'transferring') {
                finished = true
            }
            let percent = (parseInt(query.current) / parseInt(query.total) * 100).toFixed(2)
            updateState({
                percent: percent,
                status: query.status,
            })
            await sleep(300)
        } while (!finished)

        return {
            status: 'success',
            message: '上传成功',
        }
    } catch (e) {
        console.log('uploadFile', e)
        return {
            status: 'failed',
            message: e.message,
        }
    }
}

export const downloadFile = async (server, remoteFile, localDir, updateState) => {
    try {
        let sessionKey = await connectServer(server)
        let parts = remoteFile.split('/')
        let name = parts[parts.length - 1]
        let localFile = await join(localDir, server.title, name)
        await invoke.downloadRemoteFile(sessionKey, localFile, remoteFile)
        updateState({
            content: <>
                <p>下载文件：{remoteFile}</p>
                <p>下载到：{localFile}</p>
            </>,
            status: 'transferring',
        })

        let finished = false
        do {
            let query = await invoke.getTransferProgress()

            if (query.status != 'transferring') {
                finished = true
            }
            let percent = (parseInt(query.current) / parseInt(query.total) * 100).toFixed(2)
            updateState({
                percent: percent,
                status: query.status,
            })
            await sleep(300)
        } while (!finished)

        return {
            status: 'success',
            message: '下载成功',
        }
    } catch (e) {
        console.log('downloadFile', e)
        return {
            status: 'failed',
            message: e.message,
        }
    }
}


export const getFileList = async (server, dir) => {
    try {
        let sessionKey = await connectServer(server)
        let result = await invoke.sshListFiles(sessionKey, dir)
        return {
            status: 'success',
            message: '获取文件列表成功',
            output: result
        }
    } catch (e) {
        console.log('getFileList', e)
        return {
            status: 'failed',
            message: e.message,
            output: []
        }
    }
}

export const deleteFile = async (server, file) => {
    try {
        let sessionKey = await connectServer(server)
        let result = await invoke.deleteRemoteFile(sessionKey, file)
        return {
            status: 'success',
            message: '删除文件成功',
        }
    } catch (e) {
        return {
            status: 'failed',
            message: e.message,
        }
    }
}

export const createDir = async (server, dir) => {
    try {
        let sessionKey = await connectServer(server)
        let result = await invoke.createRemoteDir(sessionKey, dir)
        return {
            status: 'success',
            message: '创建文件夹成功',
        }
    } catch (e) {
        return {
            status: 'failed',
            message: e.message,
        }
    }
}

export const getK3sNamespaces = async (server) => {
    try {
        let sessionKey = await connectServer(server)
        let result = await invoke.sshExecuteCmd(sessionKey, "kubectl get ns")
        let lines = common.splitIntoArray(result, ['\n'])
        let list = common.formatCommandOutput(lines, 1, [
            'name', 'status', 'age'
        ])
        return list
    } catch (e) {
        console.log('getK3sNamespaces', e)
        return []
    }
}


export const getK3sDeploy = async (server, ns) => {
    try {
        let sessionKey = await connectServer(server)
        let result = await invoke.sshExecuteCmd(sessionKey, "kubectl get deploy -owide -n " + ns)
        let lines = common.splitIntoArray(result, ['\n'])
        let list = common.formatCommandOutput(lines, 1, [
            'name', 'ready', 'up-to-date', 'available', 'age', 'containers', 'images', 'selector'
        ])
        return list
    } catch (e) {
        console.log('getK3sDeploy', e)
        return []
    }
}

export const getK3sPods = async (server, ns) => {
    try {
        let sessionKey = await connectServer(server)
        let result = await invoke.sshExecuteCmd(sessionKey, "kubectl get pods -owide -n " + ns)
        let lines = common.splitIntoArray(result, ['\n'])
        let list = common.formatCommandOutput(lines, 1, [
            'name', 'ready', 'status', 'restarts', 'age', 'ip', 'node', 'NOMINATED_NOD', "READINESS_GATES"
        ])
        return list
    } catch (e) {
        console.log('getK3sPods', e)
        return []
    }
}
