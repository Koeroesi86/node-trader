const moment = require('moment');
const Websocket = require('ws');
const axios = require('axios');
const { URL } = require('url');

require('dotenv').config();

const productId = 'BTC-GBP';
const endpoint = 'https://api.pro.coinbase.com';
// const endpoint = 'https://api-public.sandbox.pro.coinbase.com';
// const { API_KEY, API_SECRET, API_PASS } = process.env;

(async () => {
  const url = new URL(`${endpoint}/products/${productId}/candles`);
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const args = {
    start: moment().add(-1, 'days').toISOString(),
    end: moment().toISOString(),
    granularity: 300, // 60, 300, 900, 3600, 21600, 86400
  };
  Object.keys(args).forEach(key => url.searchParams.set(key, args[key]));

  const history = await axios.get(url.toString(), { headers });
  console.log(history.data.map(row => ({
    time: row[0], //bucket start time
    low: row[1], //lowest price during the bucket interval
    high: row[2], //highest price during the bucket interval
    open: row[3], //opening price (first trade) in the bucket interval
    close: row[4], //closing price (last trade) in the bucket interval
    volume: row[5], //volume of trading activity during the bucket interval
  })));

  const websocket = new Websocket('wss://ws-feed.pro.coinbase.com');
  websocket.on('open', () => {
    websocket.send(JSON.stringify({
      type: 'subscribe',
      product_ids: ['BTC-GBP'],
      channels: ['ticker'],
    }));
  });
  websocket.on('message', async (message) => {
    const data = JSON.parse(message);
    try {
      if (data.type === 'ticker') {
        const recorded = {
          time: moment(data.time).valueOf(),
          price: Number(data.price),
          side: data.side,
        };
        // console.log('ticker', data);
        console.log('recorded ticker', recorded);
      }
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
})();
