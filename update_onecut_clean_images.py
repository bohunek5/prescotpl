# -*- coding: utf-8 -*-
import re

pairs = [
    ("2e7f411c", "/wp-content/uploads/2026/03/12d018-010-10-wl_4-2.webp"),
    ("37085f3", "/wp-content/uploads/2026/03/OKLAD-112d018-010-10-wl_1-2.webp"),
    ("1d3d2544", "/wp-content/uploads/2026/03/12D018-010-10-_1212D018-010-10-.webp"),
    ("376d34f7", "/wp-content/uploads/2026/03/12D018-010-10-_1912D018-010-10-.webp"),
    ("d79d0aa", "/wp-content/uploads/2026/03/OKL-212d018-010-10-wl_612d018-010-10-wl.webp"),
    ("e966e83", "/wp-content/uploads/2026/03/12D018-010-10-_3112D018-010-10-.webp"),
    ("5fea4c7", "/wp-content/uploads/2026/03/12D018-010-10-_412D018-010-10-.webp"),
    ("fcf8d9d", "/wp-content/uploads/2026/03/12D018-010-10-_2012D018-010-10-.webp")
]

for filepath in ["/Users/karolbohdanowicz/safe_backup/tasmaled-local/public/onecut/index.html", "/Users/karolbohdanowicz/safe_backup/tasmaled-local/public/onecut.html"]:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    for widget_id, img_url in pairs:
        # Pattern to capture the entire image widget container
        pattern = rf'(data-id="{widget_id}"[^>]*>.*?<div class="elementor-widget-container">)(.*?)(<\/div>\s*<\/div>)'
        
        def make_repl(m, url=img_url):
            header = m.group(1)
            closer = m.group(3)
            new_img = f'''
<img src="{url}" data-src="{url}" alt="Prescot Delux OneCut" class="attachment-large size-large" loading="lazy" decoding="async" />
'''
            return header + new_img + closer

        content = re.sub(pattern, make_repl, content, flags=re.DOTALL)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Cleanly replaced image markup in:", filepath)
