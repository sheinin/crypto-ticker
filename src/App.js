import React, { Component } from "react";
import fontawesome from '@fortawesome/fontawesome'
import { faNetworkWired, faFilter, faSearch } from '@fortawesome/free-solid-svg-icons'
import ReactDataGrid from "react-data-grid";
import { Button, UncontrolledButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import './App.css';
import './bootstrap.min.css';
import "./bootstrap2-toggle.css";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import Toggle from 'react-bootstrap-toggle';

const fetch = require('node-fetch'),
      urlWS = 'wss://stream.binance.com/stream?streams=!miniTicker@arr',
      urlREST = 'https://www.binance.com/exchange-api/v1/public/asset-service/product/get-products',
      URLLocal = './static-data.json',
      urlProxy = 'http://localhost:3001?' + encodeURIComponent(urlREST)

let client
fontawesome.library.add(faNetworkWired, faFilter, faSearch);

export default class TickerTable extends Component {

  _isMounted = false
  
  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    const e = document.getElementById('defaultCol')
    e && e.click()
  
    const url = window.location.hostname === "localhost" ? urlProxy : URLLocal
    fetch(url, {
      method: "GET",
        crossDomain:true})
      .then(response => response.json())
      .then(data => {
        let tk = data.data
        let markets = {}
        let alltickers = {}
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
          alltickers[s] = {mkt: pm, sub: q, latest: c, open: o, stock: s, ticker: b, volume: v}
        }
        if (this._isMounted) {
          this.setState({ alltickers: alltickers })
          this.generateMarkets(markets)
        }
      })
  }


  constructor(props) {
    super(props);
    this.state = {
      columns: [],
      alltickers: {},
      infoCol: '',
      markets: [],
      tickers: [],
      mkt: '',
      sub: '',
      filter: '',
      connected: false,
      sortColumn: '',
      sortDirection: 'NONE'
    };
  }


  changeGridCol(e){
    let col = e.currentTarget.value
    this.setState({
      tickers: [],
      infoCol: col,
      columns: [
        { 
          key: "pair",
          name: "Pair",
          editable: false,
          sortable: true,
          formatter: (props)=>(<div style={{ textAlign:'left' }}>{props.value}</div>)
        },
        {
          key: "last_price",
          name: "Last Price",
          editable: false,
          sortable: true,
          formatter: (props)=>(<div style={{ textAlign:'left' }}>{ ((+Number(props.value)).toFixed(6)).replace(/0+$/g,'').replace(/\.$/,'')  }</div>)
        },
        {
          key: "info",
          name: col,
          editable: false,
          sortable: true,
          formatter: (props)=>{
            const val = Number(props.value)
            if (col === 'Change')
              return (<div style={{textAlign:'center', color: (val < 0 ? "red" : "green") }}>{val < 0 ? '' : '+' }{val.toFixed(4)}%</div>)
            else
              return (<div style={{textAlign:'left'}}>{((+val).toFixed(6)).replace(/0+$/,'').replace(/\.$/,'')}</div>)
          }
        }
      ]
    }, this.generateTickets)
  }
  

  changeMarket(e) {
    let toggle = ''
    const mkt = e.currentTarget.id
    if (this.state.mkt) {
      let prev = document.getElementById(this.state.mkt)
      if (~prev.className.indexOf('dropdown-toggle'))
        toggle = ' dropdown-toggle'
      prev.className = 'btn-light btn btn-secondary btn-sm' + toggle
    }
    toggle = ''
    if (~e.currentTarget.className.indexOf('dropdown-toggle'))
      toggle = ' dropdown-toggle'
    e.currentTarget.className = 'btn-dark btn btn-secondary btn-sm' + toggle
    this.setState({ sub: '', mkt: mkt, tickers:[] }, this.generateTickets)
    document.getElementById('market-filter').innerHTML = mkt
  }


  changeSubMarket(e) {
    const mkt = e.currentTarget.id
    this.setState({ sub: mkt }, this.generateTickets)
    document.getElementById('market-filter').innerHTML = this.state.mkt + '/' + mkt
  }


  connectWS(e) {
    this.setState({ connected: !this.state.connected }, (()=>{
      if (this.state.connected) {
        client = new W3CWebSocket(urlWS);
        client.onopen = () => {
          console.log('WebSocket Client Connected');
        }
        client.onerror = () => {
          console.log('WebSocket error');
          this.setState({connected:false})
        }
        client.onmessage = (message) => {
          const data = JSON.parse(message.data).data
          let alltickers = {...this.state.alltickers}
          data.map(data => {
            if (!(data.s in this.state.alltickers))
              console.log('Unknown ticker:' + data.s)
            else
                alltickers[data.s] = {
                  ...alltickers[data.s],
                  latest: Number(data.c),
                  open: this.state.alltickers[data.s].open,
                  volume: this.state.alltickers[data.s].volume + Number(data.v)
                }
            return true
          })
          this.setState({ alltickers: alltickers }, this.generateTickets)
        }
      } else 
        client.close()
    }))
  }
  

  filterPair = (e) => {
    this.setState({ filter: e.currentTarget.value.toUpperCase() }, this.generateTickets)
  }

  generateMarkets = (mkt) => {
    const selectMkt = () => {
      document.getElementById(markets[0].props.id).click()
    }
    let markets = []
    for (let m in mkt)
      if (mkt[m].length === 1)
        markets.push(
          <Button
            key={m}
            size="sm"
            id={m}
            className="btn-light"
            onClick={this.changeMarket.bind(this)}
          >
          {m}
        </Button>)
      else
        markets.push(
          <UncontrolledButtonDropdown key={m}>
            <DropdownToggle className="btn-light" caret size="sm" id={m} onClick={this.changeMarket.bind(this)}>
              {m}
            </DropdownToggle>
            <DropdownMenu>
              {
                mkt[m].map(pn =>
                <DropdownItem key={pn} id={pn} onClick={this.changeSubMarket.bind(this)}>{pn}</DropdownItem>)
              }
            </DropdownMenu>
          </UncontrolledButtonDropdown>)
    this.setState({markets: markets}, selectMkt)
  }


  generateTickets = (sortColumn, sortDirection) => {    
    sortColumn = sortColumn ? sortColumn : this.state.sortColumn
    sortDirection = sortDirection ? sortDirection : this.state.sortDirection
    this.setState({
      sortColumn: sortColumn,
      sortDirection: sortDirection
    })
    const tk = this.state.alltickers
    let tickers = []
    for (let i in tk)
      if (this.state.mkt === tk[i].mkt && (!this.state.sub || this.state.sub === tk[i].sub) && (!this.state.filter || ~tk[i].ticker.toUpperCase().indexOf(this.state.filter)))
        tickers.push({
          pair: tk[i].ticker + '/' + tk[i].mkt + (tk[i].sub && tk[i].sub !== tk[i].mkt ? '/' + tk[i].sub : ''),
          last_price: Number(tk[i].latest),
          info: this.state.infoCol === 'Change' ? ((tk[i].latest - tk[i].open) / (tk[i].open * 100)) : tk[i].volume
        })
    const comparer = (a, b) => {
      if (sortDirection === "ASC") {
        return a[sortColumn] > b[sortColumn] ? 1 : -1;
      } else if (sortDirection === "DESC") {
        return a[sortColumn] < b[sortColumn] ? 1 : -1;
      }
    }
    this.setState({ tickers: sortDirection !== "NONE" ? [...tickers].sort(comparer) : tickers })
  }


  render() {
    return (
      <div className="display">
        <div className="filter">
          <div>
            <div style={{display:"inline-block", paddingRight: 20, paddingTop: 5}}>
            <i className="fa fa-network-wired"></i>
            </div>
            <Toggle
              active={this.state.connected}
              id='chkWS'
              on='ON'
              off='OFF'
              onstyle='success'
              offstyle='danger'
              width={68}
              height={30}
              onClick={this.connectWS.bind(this)}
            />
            <div></div>
          </div>
          <div className="filterMkt">
              <div>
                <div className="input-group">
                  <span className="input-group-append">
                      <div className="input-group-text border-0"><i className="fa fa-filter"></i></div>
                  </span>
                  <span style={{maxWidth:5, paddingLeft:'.5rem', paddingRight:0}} className="form-control py-2 border-0">:</span>
                  <div className="" style={{backgroundColor:'#ececec', color:'#444',borderColor:'#dadada',width:'9rem', height:'calc(1.5em + .75rem + 2px)',marginLeft:'10px',padding:'.5rem'}} type="search" id="market-filter"></div>
                </div>
              </div>
              <div>
                {this.state.markets}
              </div>
          </div>
          <div className="filterTk">
            <div>
              <div className="input-group">
                <span className="input-group-append">
                    <div className="input-group-text bg-transparent"><i className="fa fa-search"></i></div>
                </span>
                <input className="form-control py-2 border-left-0 border" type="search" id="example-search-input" onChange={this.filterPair.bind(this)}></input>
              </div>
            </div>
            <div>
              <div>
                <div>
                  <label><input type="radio" name="gridCol" value="Change" onChange={this.changeGridCol.bind(this)}></input>Change</label>
                </div>
                <div>
                <label><input type="radio" name="gridCol" value="Volume" onChange={this.changeGridCol.bind(this)} id="defaultCol"></input>Volume</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{width:"600px"}}>
          <ReactDataGrid
            columns={this.state.columns}
            rowGetter={i => this.state.tickers[i]}
            rowsCount={this.state.tickers.length}
            onGridRowsUpdated={this.onGridRowsUpdated}
            enableCellSelect={true}
            onGridSort={(sortColumn, sortDirection) => this.generateTickets(sortColumn,sortDirection)}
          />        
        </div>
      </div>
    );
  }
}
