import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { result } from "lodash";

const invoke = async (...args) => {
    try {
        return await tauriInvoke(...args)
    } catch (e) {
        console.log('invoke exception', e)
    }
}

var goLastPage = async () => {
    let result = await invoke("go_last_page");
    return result;
}

var isDev = async () => {
    return await invoke('is_dev')
}

var writeFile = async (file, content) => {
    let Result = await invoke("write_file", {
        name: file,
        content: content,
    });
    return Result;
};

var readFile = async (file) => {
    let result = await invoke("get_file_content", {
        name: file,
    });
    return result;
};

var readDir = async (dir, ext) => {
    let list = await invoke("get_file_list", {
        dir,
        ext,
    });
    return list;
};

var simpleReadDir = async (dir) => {
    let list = await invoke("list_folder", {
        filePath: dir,
    });
    return list;
};

var setWindowTitle = async (title) => {
    let result = await invoke("set_window_title", {
        title,
    });
    return result;
};

var uploadBlobFile = async (file, content) => {
    let result = await invoke("write_blob_file", {
        filePath: file,
        content: content,
    });
    return result;
};

var createFile = async (file_path) => {
    let result = await invoke("create_file", {
        filePath: file_path,
    });
    return result;
};

var deleteFile = async (file_path) => {
    let result = await invoke("delete_file", {
        filePath: file_path,
    });
    return result;
};

var deleteFolder = async (file_path) => {
    let result = await invoke("delete_folder", {
        filePath: file_path,
    });
    return result;
};

var createDir = async (file_path) => {
    let result = await invoke("create_dir", {
        filePath: file_path,
    });
    return result;
};

var renameFile = async (filePath, newFilePath) => {
    let result = await invoke("rename_file", {
        filePath: filePath,
        newFilePath: newFilePath,
    });
    return result;
};

var fileExists = async (filePath) => {
    let result = await invoke("file_exists", {
        filePath: filePath,
    });
    return result;
};


var parseJSCode = async (url) => {
    let result = await invoke("parse_js_code", {
        url,
    });
    return result;
};

var parseHTMLTitle = async (url) => {
    let result = await invoke("parse_html_title", {
        url,
    });
    return result;
};




var sshListFiles = async (sessionKey, path) => {
    let result = await invoke("remote_list_files", {
        sessionKey,
        path,
    });
    return result;
};

var downloadRemoteFile = async (sessionKey, localFile, remoteFile) => {
    let result = await invoke("download_remote_file", {
        sessionKey,
        localFile,
        remoteFile,
    });
    return result;
};

var sshConnectByPassword = async (host, port, username, password, key) => {
    if (key.length > 0)
        try {
            let result = await invoke("exist_ssh_session", {
                sessionKey: key
            })
            if (result) {
                return key
            }
        } catch (error) {

        }

    return await invoke("ssh_connect_by_password", {
        host,
        port,
        user: username,
        password,
        key,
    });
};

var uploadRemoteFile = async (sessionKey, localFile, remoteFile) => {
    let result = await invoke("upload_remote_file", {
        sessionKey,
        localFile,
        remoteFile
    });
    return result;
};

var uploadRemoteFileSync = async (sessionKey, localFile, remoteFile) => {
    let result = await invoke("upload_remote_file_sync", {
        sessionKey,
        localFile,
        remoteFile
    });
    return result;
};

var getTransferProgress = async () => {
    let result = await invoke("get_transfer_remote_progress");
    return result;
};


var sshExecuteCmd = async (sessionKey, command) => {
    let result = await invoke("remote_exec_command", {
        sessionKey,
        cmdString: command,
    });
    return result;
};


var deleteRemoteFile = async (sessionKey, file) => {
    console.log('deleteRemoteFile', sessionKey, file)
    let result = await invoke("remote_exec_command", {
        sessionKey,
        cmdString: "rm -rf " + file,
    });
    return result;
};

var createRemoteDir = async (sessionKey, path) => {
    let result = await invoke("remote_exec_command", {
        sessionKey,
        cmdString: "mkdir -p " + path,
    });
    return result;
};

var startHTTPServer = async (staticPath, port) => {
    return await invoke("start_static_server", { staticPath, port });
};

var stopHTTPServer = async () => {
    return await invoke("stop_static_server", {});
};

var httpServerStatus = async () => {
    return await invoke("static_server_status", {});
};

var getLocalAddr = async () => {
    return await invoke("get_local_addr", {});
};

var runJsCode = async (nodePath, code) => {
    return await invoke("run_js_code", {
        nodePath,
        code,
    });
};

var runQuickJsCode = async (code) => {
    return await invoke("run_quick_js_code", {
        scriptCode : code
    });
};

var connectFTPServer = async (host, port, username, password) => {
    return await invoke("connect_ftp", {
        host,
        port,
        username,
        password,
    });
};

var disconnectFTPServer = async (connectKey) => {
    return await invoke("disconnect_ftp", {
        key: connectKey,
    });
};

var listFTPFiles = async (connectKey, path) => {
    return await invoke("ftp_list", {
        key: connectKey,
        path: path,
    });
};

var ftpUploadFile = async (connectKey, path, localFile) => {
    return await invoke("ftp_upload_file", {
        key: connectKey,
        path: path,
        localFile: localFile,
    });
};

var ftpDeleteFile = async (connectKey, path) => {
    return await invoke("ftp_delete_file", {
        key: connectKey,
        path: path,
    });
};

var ftpDeleteDir = async (connectKey, path) => {
    return await invoke("ftp_delete_dir", {
        key: connectKey,
        path: path,
    });
};

var httpDownloadFile = async (url, dest) => {
    return await invoke("http_download_file", {
        url: url,
        savePath: dest,
    });
};

var httpDownloadFileV2 = async (url, dest) => {
    console.log(url, dest);
    return await invoke("http_download_file_v2", {
        url: url,
        savePath: dest,
    });
};

var evalJsOnPage = async (url, scripts) => {
    return await invoke("eval_js_on_page", {
        url: url,
        scripts: scripts,
    });
};

var createJSONPFile = async (src, dest, hash) => {
    return await invoke("create_jsonp_file", {
        srcFile: src,
        destFile: dest,
        hashCode: hash,
    });
};

var writeRsvrJsonpAsset = async (dir) => {
    return await invoke("write_rsvr_jsonp_asset", {
        dir,
    });
};

var openPath = async (path) => {
    return await invoke("open_path", {
        path,
    });
};

export {
    goLastPage,
    writeFile,
    readFile,
    readDir,
    simpleReadDir,
    setWindowTitle,
    uploadBlobFile,
    createFile,
    createDir,
    deleteFile,
    deleteFolder,
    renameFile,
    fileExists,
    parseJSCode,
    parseHTMLTitle,
    sshListFiles,
    downloadRemoteFile,
    uploadRemoteFile,
    deleteRemoteFile,
    createRemoteDir,
    startHTTPServer,
    stopHTTPServer,
    httpServerStatus,
    getLocalAddr,
    runJsCode,
    connectFTPServer,
    disconnectFTPServer,
    listFTPFiles,
    httpDownloadFile,
    httpDownloadFileV2,
    ftpUploadFile,
    ftpDeleteFile,
    ftpDeleteDir,
    evalJsOnPage,
    createJSONPFile,
    writeRsvrJsonpAsset,
    openPath,
    sshConnectByPassword,
    getTransferProgress,
    sshExecuteCmd,
    uploadRemoteFileSync,
    isDev,
    runQuickJsCode,
};

export default {
    goLastPage,
    writeFile,
    readFile,
    readDir,
    simpleReadDir,
    setWindowTitle,
    uploadBlobFile,
    createFile,
    createDir,
    deleteFile,
    deleteFolder,
    renameFile,
    fileExists,
    parseJSCode,
    parseHTMLTitle,
    sshListFiles,
    downloadRemoteFile,
    uploadRemoteFile,
    deleteRemoteFile,
    createRemoteDir,
    startHTTPServer,
    stopHTTPServer,
    httpServerStatus,
    getLocalAddr,
    runJsCode,
    connectFTPServer,
    disconnectFTPServer,
    listFTPFiles,
    httpDownloadFile,
    httpDownloadFileV2,
    ftpUploadFile,
    ftpDeleteFile,
    ftpDeleteDir,
    evalJsOnPage,
    createJSONPFile,
    writeRsvrJsonpAsset,
    openPath,
    sshConnectByPassword,
    getTransferProgress,
    sshExecuteCmd,
    uploadRemoteFileSync,
    isDev,
    runQuickJsCode,
};
