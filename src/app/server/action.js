import invoke from "@/util/invoke";
import { basename } from '@tauri-apps/api/path'

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
            status : 'executing'
        })
        let result = await invoke.sshExecuteCmd(sessionKey, "bash " + scriptName)
        return {
            status: 'success',
            output: result
        }

    } catch(e) {
        return {
            status : 'failed',
            output: e.message,
        }
    }
}
