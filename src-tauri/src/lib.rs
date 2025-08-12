pub mod config;
use tauri_plugin_sql::{Migration, MigrationKind};
#[macro_use]
extern crate rust_box;
use rust_box::tauri::command::network::get_local_addr;
use rust_box::tauri::command::ssh::{
    download_remote_file, exist_ssh_session, get_transfer_remote_progress, remote_exec_command,
    remote_list_files, ssh_connect_by_password, upload_remote_file, upload_remote_file_sync,
};
use rust_box::tauri::command::{
    ftp::{
        connect_ftp, disconnect_ftp, ftp_delete_dir, ftp_delete_file, ftp_download_file, ftp_list,
        ftp_upload_file,
    },
    http_request::{
        do_http_request, http_download_file, http_download_file_v2, parse_github_ip,
        parse_html_title, parse_js_code,
    },
    http_server::{start_static_server, static_server_status, stop_static_server},
};

use rust_box::tauri::command::file::{
    create_dir, create_file, create_jsonp_file, delete_dir, delete_file, file_exists,
    get_file_content, list_folder, rename_file, write_blob_file, write_file,
};
use rust_box::tauri::command::webview::eval_js_on_page;
use rust_box::tauri::command::work::write_rsvr_jsonp_asset;

use rust_box::tauri::command::js::run_js_code;
use rust_box::tauri::command::opener::open_path;
use tauri::menu::{CheckMenuItem, MenuBuilder, MenuEvent, MenuId, MenuItem, SubmenuBuilder};
use tauri::{Manager, WebviewWindow, Window};
#[cfg_attr(mobile, tauri::mobile_entry_point)]

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
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
            go_last_page,
            write_blob_file,
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
            upload_remote_file_sync,
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
            ssh_connect_by_password,
            get_transfer_remote_progress,
            exist_ssh_session,
            is_dev,
        ])
        .setup(app_set_up)
        .on_menu_event(window_menu_event)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn go_last_page(window: Window) -> bool {
    let mut menu_item_id = String::from("json");
    if let Ok(item) = config::get_last_menu() {
        menu_item_id = item.id;
    }
    println!("go_last_page: {:?}", menu_item_id);
    if let Some(item) = config::MENU_MAP.get(menu_item_id.as_str()) {
        let webview_window = window.get_webview_window("main").unwrap();
        jump_menu(&webview_window, &item);
    }
    true
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

fn app_set_up(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let mut menu_builder = MenuBuilder::new(app);
    let first_menu = SubmenuBuilder::new(app, "defaut")
        .text("quit", "退出")
        .cut_with_text("剪切")
        .copy_with_text("复制")
        .paste_with_text("粘贴")
        .select_all_with_text("全选")
        .undo_with_text("撤销")
        .redo_with_text("恢复")
        .build()?;
    menu_builder = menu_builder.item(&first_menu);
    for item in &config::CONFIG.menu {
        let mut submenu = SubmenuBuilder::new(app, item.name.as_str());
        for item in &item.children {
            submenu = submenu.text(item.id.as_str(), item.name.as_str());
        }
        menu_builder = menu_builder.item(&submenu.build()?);
    }
    let menu = menu_builder.build()?;
    app.set_menu(menu.clone())?;
    config::set_menu_config_path(app);
    Ok(())
}

fn window_menu_event(app: &tauri::AppHandle, event: MenuEvent) {
    let menu_id = event.id().0.as_str();
    let window_webview = app.get_webview_window("main").unwrap();
    if config::MENU_MAP.contains_key(menu_id) {
        let menu_item = config::MENU_MAP.get(menu_id).unwrap();
        config::set_last_menu(menu_item);
        jump_menu(&window_webview, menu_item);
        return;
    }

    match event.id().0.as_str() {
        &_ => todo!(),
    }
}

fn jump_menu(webview: &WebviewWindow, meue_item: &config::MenuItem) {
    _ = webview.eval(format!("window.location.href = '{}';", meue_item.path));
    _ = webview.set_title(meue_item.name.as_str());
}

#[tauri::command]
fn is_dev() -> bool {
    cfg!(debug_assertions) // 开发环境为 true，生产环境为 false
}
