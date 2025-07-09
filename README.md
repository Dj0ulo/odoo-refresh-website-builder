# Odoo Redirect Extension

A simple Chrome extension to streamline the Odoo website development workflow.

## What it does

This extension automates the process of regenerating website assets and entering edit mode in Odoo. It's designed for developers who frequently work with Odoo's website builder and need to see their changes reflected quickly.

When triggered, the extension will:

1.  **Check Odoo's debug mode:** It first determines the current debug mode of the active Odoo tab.
2.  **Regenerate assets (if necessary):** If the debug mode is not set to `assets`, the extension will automatically trigger the `regenerate_assets_bundles` RPC call. This saves you the manual step of doing it yourself.
3.  **Redirect to the website preview page:** It then redirects you to the website preview page (`/odoo/action-website.website_preview`).
4.  **Enter Edit Mode:** Finally, it waits for the "Edit" button to appear and clicks it, putting you directly into edit mode.

## Installation

1.  Clone or download this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable "Developer mode" in the top right corner.
4.  Click "Load unpacked" and select the directory where you cloned/downloaded this repository.

## How to use

There are two ways to use the extension:

*   **Click the icon:** Simply click the extension's icon in your Chrome toolbar.
*   **Use the keyboard shortcut:** Press `Ctrl+Shift+E` (or `Cmd+Shift+E` on Mac).

## Icon Colors

The extension's icon changes color to indicate the Odoo debug mode of the active tab:

*   ![Blue Icon](icons/blue.png) **Blue:** `assets` mode is active.
*   ![Purple Icon](icons/purple.png) **Purple:** Debug mode is active.
*   ![Pale Icon](icons/pale.png) **Pale:** No debug mode is active.
*   ![Grey Icon](icons/grey.png) **Grey:** The current page is not a local Odoo instance, or the debug mode could not be determined.

## Important Note

This extension is designed to work with local Odoo instances running on `localhost` or `127.0.0.1`. It will not work on other domains.
