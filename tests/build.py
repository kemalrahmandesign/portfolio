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
        '&family=Inter+Tight:wght@600;700;800&family=Kaushan+Script&display=swap" rel="stylesheet">')
assert html.count(link) == 1, 'the Google Fonts link changed: update tests/build.py'
html = html.replace(link, '''<style>
@font-face{font-family:Inter;font-weight:100 900;src:url(fonts/inter.woff2) format('woff2')}
@font-face{font-family:'Inter Tight';font-weight:800;src:url(fonts/inter-tight-800.woff2) format('woff2')}
@font-face{font-family:'Kaushan Script';font-weight:400;src:url(fonts/kaushan-script.woff2) format('woff2')}
</style>''')
n = html.count(".mp4'")
html = html.replace(".mp4'", ".webm'")

os.makedirs(MEDIA, exist_ok=True)
open(os.path.join(SITE, 'index.html'), 'w').write(html)
shutil.copytree(os.path.join(ROOT, 'tests', 'fonts'), os.path.join(SITE, 'fonts'), dirs_exist_ok=True)
for f in os.listdir(os.path.join(ROOT, 'media')):
    if not f.endswith('.md'):
        shutil.copy(os.path.join(ROOT, 'media', f), MEDIA)
if not os.path.exists(os.path.join(MEDIA, 'wave.webm')):
    subprocess.run(['node', os.path.join(ROOT, 'tests', 'stubs.js'), MEDIA], check=True)
print(f'built {SITE} ({n} clip refs rewritten)')
