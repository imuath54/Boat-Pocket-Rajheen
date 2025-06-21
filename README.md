# Pocket Option Trading Bot

This is an automated trading bot for Pocket Option, built with Node.js, Puppeteer, and Tesseract.js.

## Features
- Automated trading every minute.
- Real-time RSI reading using OCR (Tesseract.js).
- Simulated EMA and Bollinger Bands signals.
- Logs all trade details to a CSV file (`trades.csv`).

## Setup and Installation

1.  **Navigate to the project directory:**
    ```bash
    cd pocket-bot-full
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Update your credentials:**
    Open `pocket-bot-full.js` and replace `'بريدك@example.com'` and `'كلمة_المرور'` with your Pocket Option email and password.

    ```javascript
    const EMAIL = 'your_email@example.com';
    const PASSWORD = 'your_password';
    ```

## Running the Bot

To start the bot, run the following command in your terminal from the project directory:

```bash
node pocket-bot-full.js
```

The bot will open a browser window, log in to Pocket Option, and start executing trades based on the defined strategy. Trade details will be logged to `trades.csv` in the same directory.

## Important Notes
-   **RSI Reading:** The bot uses OCR to read RSI values from the screen. You might need to adjust the `clipRegion` coordinates in `pocket-bot-full.js` if the RSI is not being read accurately on your screen resolution.
-   **Market:** You can switch between Real and OTC markets by changing the `USE_OTC` variable in `pocket-bot-full.js`.
-   **Stopping the Bot:** To stop the bot, press `Ctrl + C` in your terminal.
-   **Disclaimer:** Automated trading carries significant risks. Use this bot at your own risk and consider testing it on a demo account first. This script is for educational purposes and does not guarantee profits. Using automated tools might violate the terms of service of the trading platform.


