use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::path::{BaseDirectory, PathResolver};
use tauri::{Manager};
use std::fs;
use toml;
use std::error::Error;
use std::sync::OnceLock;

#[derive(Deserialize, Serialize)]
pub struct Config {
    pub menu: Vec<Menu>,
}

#[derive(Deserialize, Serialize)]
pub struct MenuItem {
    pub id: String,
    pub name: String,
    pub path: String,
}

#[derive(Deserialize, Serialize)]
pub struct Menu {
    pub name: String,
    pub children: Vec<MenuItem>,
}

lazy_static! {
    pub static ref CONFIG: Config = {
        let content = include_str!("config.toml");
        let config: Config = toml::from_str(content).unwrap();
        config
    };
    pub static ref MENU_MAP: HashMap<String, &'static MenuItem> = {
        let mut map = HashMap::new();
        for menu in &CONFIG.menu {
            for item in &menu.children {
                map.insert(item.id.clone(), item as &'static MenuItem);
            }
        }
        map
    };
}

static MENU_CONFIG_PATH: OnceLock<String> = OnceLock::new();

pub fn set_menu_config_path(app: &tauri::App) {
    let path = app.path()
        .resolve("last_menu", BaseDirectory::Config)
        .unwrap();
    MENU_CONFIG_PATH.get_or_init(||  path.to_string_lossy().to_string());
}


pub fn get_last_menu() -> Result<MenuItem, String> {
    let tmp_file = MENU_CONFIG_PATH.get().unwrap().clone();
    let content = fs::read_to_string(tmp_file).map_err(|e| e.to_string())?;
    let item: MenuItem = serde_json::from_str(content.as_str()).map_err(|e| e.to_string())?;
    Ok(item)
}

pub fn set_last_menu(menu_item: &MenuItem) {
    let tmp_file = MENU_CONFIG_PATH.get().unwrap().clone();
    let content = serde_json::to_string(menu_item).unwrap();
    _ = fs::write(tmp_file, content).unwrap();
}
