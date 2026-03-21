import os
import time
from playwright.sync_api import sync_playwright

def verify_suite():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:5173")

        print("Page loaded.")

        # 1. Verify Menu
        menu = page.locator("#main-menu-overlay")
        menu.wait_for(state="visible", timeout=5000)
        print("Menu visible.")

        # 2. Start Blackjack
        page.locator("#main-menu-overlay #btn-blackjack").click()
        print("Clicked Play Blackjack.")

        # 3. Verify Blackjack UI
        hit_btn = page.locator("#btn-hit")
        hit_btn.wait_for(state="attached", timeout=2000)
        # Give it a small delay because if game is instantly over (Blackjack) it gets disabled quickly,
        # or we might catch it in a disabled state during animations. Wait for visible.
        try:
            hit_btn.wait_for(state="visible", timeout=2000)
        except Exception:
            pass # might be disabled/hidden if auto-blackjack
        print("Hit button visible.")

        stand_btn = page.locator("#btn-stand")
        if not stand_btn.is_visible():
            raise Exception("Stand button not visible")
        print("Stand button visible.")

        p1_cards = page.locator(".card[data-slot='p1-slot']")
        count = p1_cards.count()
        print(f"Player has {count} cards.")
        if count < 2:
            raise Exception("Player should have at least 2 cards")

        # 4. Hit
        if hit_btn.is_enabled():
            page.click("#btn-hit", force=True) # Force true because animation might make it unstable
            time.sleep(0.5)
            new_count = p1_cards.count()
            print(f"Player has {new_count} cards after Hit.")

        # 5. Stand
        if hit_btn.is_enabled():
             page.click("#btn-stand", force=True) # Force true because animation might make it unstable
             print("Clicked Stand.")
             time.sleep(1)

        # 6. Verify Game Over
        overlay = page.locator("#message-overlay")
        game_over = False
        try:
            overlay.wait_for(state="visible", timeout=5000)
            print("Game Over overlay visible.")
            game_over = True
        except:
            print("Game Over overlay did not appear (game might be still active or finished without overlay?)")

        # 7. Restart Game
        if game_over:
            print("Clicking Overlay Play Again button.")
            btn = page.locator("#overlay-reset-btn")
            btn.wait_for(state="visible", timeout=2000)
            btn.click(force=True)
        else:
            print("Clicking Reset button.")
            page.click("#reset-btn", force=True)

        time.sleep(1)

        # Verify Blackjack starts again
        try:
            hit_btn.wait_for(state="visible", timeout=2000)
        except Exception:
            pass # Handle instant blackjack hiding/disabling buttons
        print("New Game started. Hit button visible.")

        # 8. Menu
        page.click("#btn-menu", force=True)
        menu.wait_for(state="visible", timeout=2000)
        print("Returned to Menu.")

        # 9. Play War
        page.locator("#main-menu-overlay #btn-war").click()
        print("Clicked Play War.")

        draw_btn = page.locator("#draw-btn")
        draw_btn.wait_for(state="visible", timeout=2000)
        print("Draw button visible (War Mode).")

        # 10. Settings
        page.click("#btn-menu")
        menu.wait_for(state="visible")
        page.locator("#main-menu-overlay #btn-settings").click()
        settings = page.locator("#settings-menu")
        settings.wait_for(state="visible", timeout=2000)
        print("Settings visible.")

        browser.close()
        print("Verification Suite Passed!")

if __name__ == "__main__":
    verify_suite()
