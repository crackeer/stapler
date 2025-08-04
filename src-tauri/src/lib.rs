use tauri_plugin_sql::{Migration, MigrationKind};
#[macro_use]
extern crate rust_box;
use rust_box::tauri::command::network::get_local_addr;
use rust_box::tauri::command::ssh::{
    connect_server, download_remote_file, remote_exec_command, remote_list_files, upload_remote_file, get_upload_remote_progress,
};
use rust_box::tauri::command::{
    ftp::{connect_ftp, disconnect_ftp, ftp_delete_file, ftp_delete_dir, ftp_download_file, ftp_list, ftp_upload_file},
    http_request::{
        do_http_request, http_download_file, http_download_file_v2, parse_github_ip,
        parse_html_title, parse_js_code,
    },
    http_server::{start_static_server, static_server_status, stop_static_server},
};

use rust_box::tauri::command::file::{
    create_dir, create_file, delete_dir, delete_file, file_exists, get_file_content, list_folder,
    rename_file, write_file, write_media_file, create_jsonp_file,
};
use rust_box::tauri::command::webview::eval_js_on_page;
use rust_box::tauri::command::work::write_rsvr_jsonp_asset;

use rust_box::tauri::command::js::run_js_code;
use rust_box::tauri::command::opener::open_path;
use tauri::Window;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:json.db", get_sqlite_migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            get_file_content,
            write_file,
            list_folder,
            set_window_title,
            write_media_file,
            create_dir,
            create_file,
            delete_file,
            delete_dir,
            rename_file,
            file_exists,
            parse_js_code,
            parse_html_title,
            remote_list_files,
            download_remote_file,
            upload_remote_file,
            remote_exec_command,
            static_server_status,
            start_static_server,
            stop_static_server,
            do_http_request,
            get_local_addr,
            parse_github_ip,
            run_js_code,
            connect_ftp,
            disconnect_ftp,
            ftp_list,
            ftp_delete_file,
            ftp_delete_dir,
            ftp_upload_file,
            ftp_download_file,
            http_download_file,
            http_download_file_v2,
            eval_js_on_page,
            create_jsonp_file,
            write_rsvr_jsonp_asset,
            open_path,
            connect_server,
            get_upload_remote_progress,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn set_window_title(window: Window, title: String) -> String {
    _ = window.set_title(title.as_str());
    String::from("ok")
}

fn get_sqlite_migrations() -> Vec<Migration> {
    vec![
        // Define your migrations here
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "CREATE TABLE content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                content_type TEXT NOT NULL,
                tag TEXT NOT NULL,
                create_at INTEGER DEFAULT '0',
                modify_at INTEGER DEFAULT '0'
            );",
            kind: MigrationKind::Up,
        },
    ]
}
