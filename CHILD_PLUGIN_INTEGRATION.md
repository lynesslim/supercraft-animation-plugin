# Integration Guide: Connecting Child Plugins to the Supercraft Master License

This document guides developers of other child plugins on how to update their plugins to leverage the centralized validation system managed by the Supercraft Master Plugin.

---

## 1. What Changes?

Instead of each plugin managing its own independent license registration settings form and verifying its own license key, we are transitioning to a **centralized licensing hub** managed by the **Supercraft Master Plugin**.

To do this without breaking backwards compatibility (so plugins can still work in standalone mode without the Master Plugin installed), child plugins must use a shared **WordPress Filter Hook**.

---

## 2. Code Modifications Required in Child Plugins

Every child plugin needs to apply two main updates:

### Step 1: Update the Validation Helper Function
Locate the function in your plugin that determines if the plugin is validated (commonly `xxx_is_validated()`). Modify it to pass its local status through the filter hook `supercraft_is_plugin_validated` alongside its unique plugin slug identifier.

```php
function yourplugin_is_validated() {
    // 1. Allow local environment override constant
    if (defined('YOURPLUGIN_ALLOW_UNVALIDATED') && YOURPLUGIN_ALLOW_UNVALIDATED) {
        return true;
    }

    // 2. Fetch the local option status
    $local_status = get_option('yourplugin_validation_status', 'not_set') === 'valid';

    // 3. Pass through the global master filter hook (Recommended Slug: your-plugin-folder-name)
    return apply_filters('supercraft_is_plugin_validated', $local_status, 'your-plugin-slug');
}
```

---

### Step 2: Conditionalize the Admin Settings Page
To prevent users from seeing multiple duplicate license/embed code input fields on every plugin settings page when the Master Plugin is active, conditionalize your settings page UI using `has_filter()`.

Locate the function rendering your admin page settings (e.g., `yourplugin_render_admin_page()`):

```php
function yourplugin_render_admin_page() {
    $status = get_option('yourplugin_validation_status', 'not_set');
    $embed_code = get_option('yourplugin_embed_code', '');
    $is_master_active = has_filter('supercraft_is_plugin_validated');

    ?>
    <div class="wrap">
        <h1>Your Plugin Settings</h1>

        <!-- 1. Display Notice if Master License is handling verification -->
        <?php if ($is_master_active): ?>
            <div class="notice notice-info">
                <p>License validation is managed globally by the <strong>Supercraft Master Plugin</strong>.</p>
            </div>
        <?php endif; ?>

        <form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
            
            <table class="form-table">
                <!-- 2. Wrap license fields to hide them if Master Plugin is active -->
                <?php if (!$is_master_active): ?>
                    <tr>
                        <th scope="row"><label for="yourplugin_embed_code">Embed Code</label></th>
                        <td>
                            <input type="text" id="yourplugin_embed_code" name="yourplugin_embed_code" value="<?php echo esc_attr($embed_code); ?>" <?php echo ($status === 'valid') ? 'readonly' : ''; ?>>
                        </td>
                    </tr>
                <?php endif; ?>

                <!-- 3. Keep other plugin-specific settings visible at all times -->
                <tr>
                    <th scope="row">Other Settings</th>
                    <td>
                        <!-- Plugin-specific checkboxes, inputs, etc. remain here -->
                    </td>
                </tr>
            </table>

            <!-- 4. Handle Save button and conditional Save & Validate button -->
            <input type="submit" class="button button-primary" value="Save Settings">
            <?php if (!$is_master_active && $status !== 'valid'): ?>
                <?php submit_button('Save & Validate'); ?>
            <?php endif; ?>
        </form>
    </div>
    <?php
}
```

---

## 3. Summary of Slugs to Use
Ensure the second parameter in `apply_filters('supercraft_is_plugin_validated', $local_status, 'plugin-slug')` matches your plugin's official identifier. Examples:
* Supercraft Animations: `'supercraft-superanimation'`
* Supercraft Widget Studio: `'supercraft-widget-studio'`
* Other Child Plugin: `'supercraft-your-slug'`
