from playwright.sync_api import sync_playwright
from pathlib import Path
import os
ROOT = Path(__file__).resolve().parents[2]

URL = 'http://127.0.0.1:4173/?e2e=1'
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True, args=['--no-sandbox'],
        **({'executable_path': os.environ['CHROMIUM_EXECUTABLE']} if 'CHROMIUM_EXECUTABLE' in os.environ else {})
    )
    page = browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(URL)
    page.wait_for_timeout(150)
    print('TITLE:', page.title())
    print('INIT modal:', page.locator('#planModal').is_visible())
    page.screenshot(path=str(ROOT / 'tests/e2e/home.png'), full_page=True)
    page.locator('#acceptPlan').click()
    assert page.locator('#setupModal').is_visible()
    page.locator('#beginDemo').click()
    page.locator('#actionBtn').wait_for(state='visible')
    page.wait_for_function("document.getElementById('statusTag').textContent === '训练中'",timeout=6000)
    print('CHOP initially',page.locator('#chopValue').text_content(), 'actionDisabled',page.locator('#actionBtn').is_disabled())
    for i in range(15):
        page.locator('#actionBtn').click()
        page.wait_for_timeout(95)
    print('CHOP final',page.locator('#chopValue').text_content(), 'tree',page.locator('#treeValue').text_content())
    assert page.locator('#chopValue').text_content() == '15/15'
    page.wait_for_function("document.getElementById('missionTitle').textContent === '把木材装上手推车' && document.getElementById('statusTag').textContent === '训练中'", timeout=6000)
    print('LOAD initial',page.locator('#loadValue').text_content())
    for i in range(15):
        page.locator('#actionBtn').click()
        page.wait_for_timeout(105)
    print('LOAD final',page.locator('#loadValue').text_content())
    assert page.locator('#loadValue').text_content() == '15/15'
    page.wait_for_function("document.getElementById('missionTitle').textContent === '推车返回农场' && document.getElementById('statusTag').textContent === '训练中'", timeout=6000)
    print('CARRY initial',page.locator('#carryValue').text_content())
    page.keyboard.down('Space')
    page.wait_for_timeout(1650)
    page.keyboard.up('Space')
    page.wait_for_timeout(250)
    print('RESULT vis',page.locator('#resultsModal').is_visible())
    assert page.locator('#resultsModal').is_visible()
    print('CARRY final',page.locator('#carryValue').text_content())
    print('REWARD wood',page.locator('#rewardLogs').text_content())
    assert page.locator('#rewardLogs').text_content() == '15'
    page.screenshot(path=str(ROOT / 'tests/e2e/results.png'),full_page=True)
    if page.locator('#resultsModal').is_visible():
        page.locator('#resultsHome').click()
        print('RESET plan vis',page.locator('#planModal').is_visible())
    print('ERRORS:',errors)
    assert not errors
    browser.close()
