// Pairs with "visible": false in tauri.conf.json (core/tauri-hidden-launch).
// The window opens invisible, setup positions and sizes it, then it is shown —
// no white first frame, no size jump.
.setup(|app| {
    let window = app.get_webview_window("main").expect("main window missing");
    window.set_min_size(None)?;
    window.center()?;
    window.show()?;
    Ok(())
})
