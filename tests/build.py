"""Build the test site from the real index.html.

Three substitutions, each for a limitation of this container rather than of
the site:

1. Google Fonts cannot be fetched from here, and Chromium falls back silently
   to a different face, which made every headline-width measurement early in
   the project meaningless. The committed woff2 files in tests/fonts/ are
   declared in its place.
2. Playwright's Chromium cannot decode H.264, so clip paths are rewritten from
   .mp4 to the .webm stubs that stubs.js writes.
3. The committed media (face.webp) is copied in; everything else is a stub.

Usage: python3 tests/build.py            -> writes tests/.site/
"""
import os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'tests', '.site')
MEDIA = os.path.join(SITE, 'media')

html = open(os.path.join(ROOT, 'index.html')).read()
link = ('<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800'
        '&family=Inter+Tight:wght@600;700;800&family=Instrument+Serif:ital@1'
        '&family=JetBrains+Mono:wght@400;500;700&family=Kaushan+Script&display=swap" rel="stylesheet">')
assert html.count(link) == 1, 'the Google Fonts link changed: update tests/build.py'
html = html.replace(link, '''<style>
@font-face{font-family:Inter;font-weight:100 900;src:url(fonts/inter.woff2) format('woff2')}
@font-face{font-family:'Inter Tight';font-weight:800;src:url(fonts/inter-tight-800.woff2) format('woff2')}
@font-face{font-family:'Instrument Serif';font-style:italic;font-weight:400;src:url(fonts/instrument-serif-italic.woff2) format('woff2')}
@font-face{font-family:'JetBrains Mono';font-weight:400;src:url(fonts/jetbrains-mono-400.woff2) format('woff2')}
@font-face{font-family:'JetBrains Mono';font-weight:500;src:url(fonts/jetbrains-mono-500.woff2) format('woff2')}
@font-face{font-family:'JetBrains Mono';font-weight:700;src:url(fonts/jetbrains-mono-700.woff2) format('woff2')}
@font-face{font-family:'Kaushan Script';font-weight:400;src:url(fonts/kaushan-script.woff2) format('woff2')}
</style>''')
n = html.count(".mp4'")
html = html.replace(".mp4'", ".webm'")

os.makedirs(MEDIA, exist_ok=True)
shutil.copy(os.path.join(ROOT, 'favicon.ico'), SITE)
open(os.path.join(SITE, 'index.html'), 'w').write(html)
shutil.copytree(os.path.join(ROOT, 'tests', 'fonts'), os.path.join(SITE, 'fonts'), dirs_exist_ok=True)
shutil.copytree(os.path.join(ROOT, 'vendor'), os.path.join(SITE, 'vendor'), dirs_exist_ok=True)
for f in os.listdir(os.path.join(ROOT, 'media')):
    src = os.path.join(ROOT, 'media', f)
    if os.path.isdir(src):
        shutil.copytree(src, os.path.join(MEDIA, f), dirs_exist_ok=True)
    elif not f.endswith('.md'):
        shutil.copy(src, MEDIA)
# The case study pages, with the same font swap pointed one folder up.
WORK = os.path.join(SITE, 'work')
os.makedirs(WORK, exist_ok=True)
wlink = ('<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800'
         '&family=Inter+Tight:wght@600;700;800&family=Kaushan+Script&display=swap" rel="stylesheet">')
for f in os.listdir(os.path.join(ROOT, 'work')):
    src = os.path.join(ROOT, 'work', f)
    if f.endswith('.html'):
        page = open(src).read()
        assert page.count(wlink) == 1, f'the Google Fonts link in work/{f} changed: update tests/build.py'
        page = page.replace(wlink, '''<style>
@font-face{font-family:Inter;font-weight:100 900;src:url(../fonts/inter.woff2) format('woff2')}
@font-face{font-family:'Inter Tight';font-weight:800;src:url(../fonts/inter-tight-800.woff2) format('woff2')}
@font-face{font-family:'Kaushan Script';font-weight:400;src:url(../fonts/kaushan-script.woff2) format('woff2')}
</style>''')
        open(os.path.join(WORK, f), 'w').write(page)
    else:
        shutil.copy(src, WORK)
if not os.path.exists(os.path.join(MEDIA, 'wave.webm')):
    subprocess.run(['node', os.path.join(ROOT, 'tests', 'stubs.js'), MEDIA], check=True)
print(f'built {SITE} ({n} clip refs rewritten)')
