# This is an example of a simple Python backend service using Flask.
# You should run this script on your Google Cloud VM.
#
# INSTRUCTIONS:
# 1. SSH into your Google Cloud VM.
# 2. Make sure you have Python 3 installed.
# 3. Install the required libraries:
#    pip install Flask Flask-Cors breeze-connect
# 4. Copy this file to your VM (e.g., as `backend.py`).
# 5. Fill in your Breeze API credentials in the placeholders below.
# 6. Run the server:
#    python backend.py
# 7. Make sure your VM's firewall allows traffic on port 5000.
# 8. Whitelist your VM's static IP address in your ICICI Developer Portal.

from flask import Flask, jsonify, request
from flask_cors import CORS
from breeze_connect import BreezeConnect
import logging

# --- CONFIGURATION ---
# IMPORTANT: Fill in your actual credentials here
BREEZE_API_KEY = "YOUR_API_KEY"
BREEZE_API_SECRET = "YOUR_SECRET_KEY"
BREEZE_SESSION_TOKEN = "YOUR_SESSION_TOKEN"

# Setup logging
logging.basicConfig(level=logging.INFO)

# Initialize Flask app
app = Flask(__name__)
# Enable CORS to allow your frontend to connect to this backend
CORS(app)

# Map user-friendly symbols to Breeze API stock codes
BREEZE_STOCK_CODES = {
    'NIFTY 50': {'exchange': 'NSE', 'code': 'NIFTY'},
    'NIFTY BANK': {'exchange': 'NSE', 'code': 'BANKNIFTY'},
    'NIFTY IT': {'exchange': 'NSE', 'code': 'CNXIT'},
    'SENSEX': {'exchange': 'BSE', 'code': 'SENSEX'},
}

# Helper to get a connected Breeze instance
def get_breeze_instance():
    try:
        breeze = BreezeConnect(api_key=BREEZE_API_KEY)
        breeze.generate_session(api_secret=BREEZE_API_SECRET, session_token=BREEZE_SESSION_TOKEN)
        logging.info("Breeze session generated successfully.")
        return breeze
    except Exception as e:
        logging.error(f"Failed to generate Breeze session: {e}")
        return None

@app.route('/api/indices', methods=['GET'])
def get_indices():
    breeze = get_breeze_instance()
    if not breeze:
        return jsonify({"error": "Failed to connect to Breeze API"}), 500

    results = []
    for symbol, details in BREEZE_STOCK_CODES.items():
        try:
            quote = breeze.get_quotes(stockCode=details['code'], exchangeCode=details['exchange'])
            if quote.get('Success') and len(quote['Success']) > 0:
                data = quote['Success'][0]
                ltp = float(data.get('ltp', 0))
                prev_close = float(data.get('previous_close', ltp))
                change = ltp - prev_close
                change_percent = (change / prev_close * 100) if prev_close != 0 else 0
                
                results.append({
                    'symbol': symbol,
                    'name': data.get('stock_name', symbol),
                    'price': ltp,
                    'change': round(change, 2),
                    'changePercent': round(change_percent, 2),
                })
            else:
                 logging.warning(f"Could not fetch data for {symbol}. Response: {quote.get('Error', 'Empty success array')}")
        except Exception as e:
            logging.error(f"Error fetching quote for {symbol}: {e}")

    if not results:
        return jsonify({"error": "Failed to fetch any index data"}), 500
        
    return jsonify(results)

@app.route('/api/option-chain', methods=['GET'])
def get_option_chain():
    breeze = get_breeze_instance()
    if not breeze:
        return jsonify({"error": "Failed to connect to Breeze API"}), 500

    try:
        option_data = breeze.get_option_chain_quotes(
            stockCode="NIFTY",
            exchangeCode="NFO",
            productType="options",
            expiryDate="",  # Nearest expiry
            right="others",  # Both calls and puts
            strikePrice="" # All strikes
        )

        if not option_data.get('Success') or len(option_data['Success']) == 0:
            error_msg = option_data.get('Error', 'API response was empty')
            raise Exception(f"Breeze API Error: {error_msg}")

        def transform_option(breeze_option):
            return {
                'strike': float(breeze_option.get('strike_price', 0)),
                'ltp': float(breeze_option.get('ltp', 0)),
                'iv': float(breeze_option.get('iv', 0)),
                'chng': float(breeze_option.get('change', 0)),
                'chngInOI': float(breeze_option.get('open_interest_change', 0)),
                'oi': float(breeze_option.get('open_interest', 0)),
                'volume': float(breeze_option.get('total_traded_volume', 0)),
                'bid': float(breeze_option.get('best_bid_price', 0)),
                'ask': float(breeze_option.get('best_ask_price', 0)),
            }

        calls = [transform_option(o) for o in option_data['Success'] if o.get('right') == 'Call']
        puts = [transform_option(o) for o in option_data['Success'] if o.get('right') == 'Put']

        # Dummy underlying price, the frontend will override this.
        underlying_price = 0 
        
        data = {
            'calls': sorted(calls, key=lambda x: x['strike']),
            'puts': sorted(puts, key=lambda x: x['strike']),
            'underlyingPrice': underlying_price
        }
        return jsonify(data)

    except Exception as e:
        logging.error(f"Failed to fetch live option chain: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run the app on all available network interfaces
    app.run(host='0.0.0.0', port=5000)
