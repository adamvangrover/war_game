import sys
import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to app...")
            page.goto("http://localhost:4173")

            # Wait for hydration/load
            page.wait_for_selector("#main-menu")

            # Test War
            print("Testing War...")
            page.click("#btn-war")
            page.wait_for_selector("#draw-btn", state="visible")
            page.click("#btn-back-menu")
            page.wait_for_selector("#main-menu", state="visible")

            # Test Blackjack
            print("Testing Blackjack...")
            page.click("#btn-blackjack")
            page.wait_for_selector("#btn-deal", state="visible")
            page.click("#btn-back-menu")
            page.wait_for_selector("#main-menu", state="visible")

            # Test Baccarat
            print("Testing Baccarat...")
            page.click("#btn-baccarat")
            page.wait_for_selector("#btn-bac-deal", state="visible")
            page.click("#btn-back-menu")
            page.wait_for_selector("#main-menu", state="visible")

            # Test High-Low
            print("Testing High-Low...")
            page.click("#btn-highlow")
            # Logic Update: HighLow auto-starts, so look for gameplay buttons
            page.wait_for_selector("#btn-higher", state="visible")
            page.click("#btn-back-menu")
            page.wait_for_selector("#main-menu", state="visible")

            print("SUCCESS: All Game Modes Verified!")

        except Exception as e:
            print(f"FAILURE: {e}")
            page.screenshot(path="verification_failure.png")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    run()
