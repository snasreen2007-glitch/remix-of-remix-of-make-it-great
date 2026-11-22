import os
import base64
from PIL import Image, ImageDraw
import numpy as np

src_path = 'C:/Users/ayubh/.gemini/antigravity/brain/b16240c9-8a23-4f63-b009-2f988f0613b2/.user_uploaded/media_1795346276491_07e4ed14.jpg'
orig_img = Image.open(src_path).convert('RGB')
arr = np.array(orig_img, dtype=float)

# 1. Sample background color
bg_rgb = np.median(arr[:30, :30, :3], axis=(0, 1))
bg_hex = '#{:02x}{:02x}{:02x}'.format(int(bg_rgb[0]), int(bg_rgb[1]), int(bg_rgb[2]))
print('Background RGB:', bg_rgb, 'Hex:', bg_hex)

# 2. Extract Alpha Channel with clean edge feathering
dist = np.sqrt(np.sum((arr[:, :, :3] - bg_rgb) ** 2, axis=2))
t_low = 14.0
t_high = 32.0
alpha = np.clip((dist - t_low) / (t_high - t_low), 0.0, 1.0) * 255.0

rgba_arr = np.dstack([arr[:, :, :3], alpha]).astype(np.uint8)
transparent_full = Image.fromarray(rgba_arr, mode='RGBA')

# 3. Content bounds
mask = alpha > 10
coords = np.argwhere(mask)
y0, x0 = coords.min(axis=0)
y1, x1 = coords.max(axis=0)

pad = 16
x0_c = max(0, x0 - pad)
y0_c = max(0, y0 - pad)
x1_c = min(orig_img.width, x1 + pad)
y1_c = min(orig_img.height, y1 + pad)

# Cropped full transparent logo
cropped_trans = transparent_full.crop((x0_c, y0_c, x1_c, y1_c))
cropped_trans.save('public/logo.png', 'PNG')
cropped_trans.save('public/logo-transparent.png', 'PNG')

# Cropped cream background logo
cropped_cream = orig_img.crop((x0_c, y0_c, x1_c, y1_c))
cropped_cream.save('public/logo-cream.png', 'PNG')

# 4. Crop the wheat stalk emblem specifically
x_split = 405
emblem_mask = mask[:, :x_split]
ey0, ex0 = np.argwhere(emblem_mask).min(axis=0)
ey1, ex1 = np.argwhere(emblem_mask).max(axis=0)

ep = 12
ex0_c = max(0, ex0 - ep)
ey0_c = max(0, ey0 - ep)
ex1_c = min(orig_img.width, ex1 + ep)
ey1_c = min(orig_img.height, ey1 + ep)

emblem_trans = transparent_full.crop((ex0_c, ey0_c, ex1_c, ey1_c))
ew, eh = emblem_trans.size

# Function to build a square icon (size x size) with padding
def make_square_icon(target_size, bg_color=None, circular=False):
    icon = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    if bg_color:
        draw = ImageDraw.Draw(icon)
        if circular:
            draw.ellipse((0, 0, target_size - 1, target_size - 1), fill=bg_color)
        else:
            r = int(target_size * 0.22)
            draw.rounded_rectangle((0, 0, target_size - 1, target_size - 1), radius=r, fill=bg_color)
    
    inner_target = int(target_size * 0.72)
    scale = inner_target / max(ew, eh)
    nw = max(1, int(ew * scale))
    nh = max(1, int(eh * scale))
    resized_emblem = emblem_trans.resize((nw, nh), Image.Resampling.LANCZOS)
    
    ox = (target_size - nw) // 2
    oy = (target_size - nh) // 2
    icon.paste(resized_emblem, (ox, oy), resized_emblem)
    return icon

# Build standard icons
bg_tuple = (int(bg_rgb[0]), int(bg_rgb[1]), int(bg_rgb[2]), 255)

icon_512 = make_square_icon(512, bg_tuple)
icon_512.save('public/icon-512.png', 'PNG')

icon_192 = make_square_icon(192, bg_tuple)
icon_192.save('public/icon-192.png', 'PNG')

# Standard iOS Apple Touch Icon (180x180 px)
icon_180 = make_square_icon(180, bg_tuple)
icon_180.save('public/apple-touch-icon.png', 'PNG')

# Favicon ico (multi-size: 16, 32, 48)
icon_48 = make_square_icon(48, bg_tuple)
icon_48.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])

# Android Launcher Mipmaps
android_res = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

for folder, s in android_res.items():
    dir_path = os.path.join('android', 'app', 'src', 'main', 'res', folder)
    if os.path.exists(dir_path):
        square_ic = make_square_icon(s, bg_tuple, circular=False)
        square_ic.save(os.path.join(dir_path, 'ic_launcher.png'), 'PNG')
        
        round_ic = make_square_icon(s, bg_tuple, circular=True)
        round_ic.save(os.path.join(dir_path, 'ic_launcher_round.png'), 'PNG')
        print(f'Saved {folder} {s}x{s} icons')

# 5. Create SVGs with embedded high-res assets
with open('public/logo.png', 'rb') as f:
    logo_b64 = base64.b64encode(f.read()).decode('utf-8')

with open('public/icon-512.png', 'rb') as f:
    icon_b64 = base64.b64encode(f.read()).decode('utf-8')

w, h = cropped_trans.size
svg_logo = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%">
  <image href="data:image/png;base64,{logo_b64}" width="{w}" height="{h}" />
</svg>'''

with open('public/logo.svg', 'w', encoding='utf-8') as f:
    f.write(svg_logo)

iw, ih = icon_512.size
svg_favicon = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {iw} {ih}" width="100%" height="100%">
  <image href="data:image/png;base64,{icon_b64}" width="{iw}" height="{ih}" />
</svg>'''

with open('public/favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_favicon)

print('All branding assets generated successfully!')

