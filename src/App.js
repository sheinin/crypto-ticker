import React, { Component } from "react";
import TickerTable from './TickerTable.js'
import { w3cwebsocket as W3CWebSocket } from "websocket";

const urlWS = 'wss://stream.binance.com/stream?streams=!miniTicker@arr',
      urlREST = 'https://www.binance.com/exchange-api/v1/public/asset-service/product/get-products',
      URLLocal = './static-data.json',
      urlProxy = 'http://localhost:3001?' + encodeURIComponent(urlREST)

let client

export default class App extends Component {

  constructor(props) {

    super(props)

    this.state = {

      markets: {},
      tickers: [],
      mkt: '',
      sub: '',
      filter: '',
      connected: false

    }

    this.tickers = {}

  }
  

  _isMounted = false
  
  componentWillUnmount() {

    this._isMounted = false;

  }

  componentDidMount() {

    this._isMounted = true;

    const url = window.location.hostname === "localhost" ? urlProxy : URLLocal

    fetch(url, {

      method: "GET",
      crossDomain:true

    })
      .then(response => response.json())
      .then(data => {

        let tk = data.data,
            markets = {},
            tickers = {}

        for (let i = 0, ix = tk.length; i < ix; i += 1) {

          let pm = tk[i].pm,
              q = tk[i].q,
              s = tk[i].s,
              c = Number(tk[i].c),
              o = Number(tk[i].o),
              b = tk[i].b,
              v = Number(tk[i].v)

          if (!(pm in markets))

            markets[pm] = []

          if (!~markets[pm].indexOf(q))

            markets[pm].push(q)

          tickers[s] = {
            
            mkt: pm,
            sub: q,
            latest: c,
            open: o,
            stock: s,
            ticker: b,
            volume: v
          
          }

        }

        if (this._isMounted) {

          this.tickers = tickers
          this.setState({ markets: markets })

        }

      })

  }


  changeMarket(mkt) {

    this.setState({sub: '', mkt: mkt}, this.getTickers)

  }


  changeSubMarket(sub) {

    this.setState({sub: sub}, this.getTickers)

  }

  changeFilter(filter) {

    this.setState({filter: filter}, this.getTickers)

  }

  connectWS() {

    this.setState({connected: !this.state.connected},

      () => {

        if (this.state.connected) {

          client = new W3CWebSocket(urlWS)

          client.onopen = () => {

            console.log('WebSocket Client Connected')

          }

          client.onerror = () => {

            console.log('WebSocket error')
            this.setState({connected:false})

          }

          client.onmessage = (message) => {

            const data = JSON.parse(message.data).data

            let tickers = {...this.tickers}
            
            data.map(data => {

              if (data.s in this.tickers)

                tickers[data.s] = {

                  ...tickers[data.s],
                  latest: Number(data.c),
                  open: this.tickers[data.s].open,
                  volume: this.tickers[data.s].volume + Number(data.v)

                }

              return true

            })

            this.tickers = {...tickers}

            this.getTickers()

          }

        } else

          client.close()

      })

  }
  

  getTickers = () => {

    const tk = this.tickers
    let tickers = []

    for (let i in tk)

      if (this.state.mkt === tk[i].mkt &&
          (!this.state.sub || this.state.sub === tk[i].sub) &&
          (!this.state.filter || ~tk[i].ticker.toUpperCase().indexOf(this.state.filter)))

        tickers.push({

          pair: tk[i].ticker + '/' + tk[i].mkt + (tk[i].sub && tk[i].sub !== tk[i].mkt ? '/' + tk[i].sub : ''),
          last_price: Number(tk[i].latest),
          change: ((tk[i].latest - tk[i].open) / (tk[i].open * 100)),
          volume: tk[i].volume

        })

    this.setState({ tickers: tickers })

  }

  render() {

    return (

      <TickerTable
        connected={this.state.connected}
        markets={this.state.markets}
        tickers={this.state.tickers}
        changeMarket={this.changeMarket.bind(this)}
        changeSubMarket={this.changeSubMarket.bind(this)}
        getTickers={this.getTickers}
        connectWS={this.connectWS.bind(this)}
        changeFilter={this.changeFilter.bind(this)}
      />

    )
  }
}
