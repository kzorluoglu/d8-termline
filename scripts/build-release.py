#!/usr/bin/env python3
"""Build a submission ZIP containing runtime files and documentation only."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import re
root = Path(__file__).resolve().parents[1]
version = re.search(r' \* Version: (.+)', (root / 'd8terminalplugin.php').read_text())[1]
files = ['d8terminalplugin.php', 'includes/Plugin.php', 'css/style.css', 'js/script.js', 'readme.txt', 'readme.md', 'LICENSE']
output = root / 'dist' / f'd8-pardus-terminal-{version}.zip'
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(root / name, f'd8-pardus-terminal/{name}')
print(output)
