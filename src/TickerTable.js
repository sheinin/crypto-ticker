import React, { Component } from "react";
import fontawesome from '@fortawesome/fontawesome'
import PropTypes from 'prop-types';
import { faNetworkWired, faFilter, faSearch } from '@fortawesome/free-solid-svg-icons'
import ReactDataGrid from "react-data-grid";
import { Button, UncontrolledButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import './App.css';
import './bootstrap.min.css';
import "./bootstrap2-toggle.css";
import Toggle from 'react-bootstrap-toggle';

fontawesome.library.add(faNetworkWired, faFilter, faSearch);

export default class TickerTable extends Component {

  constructor(props) {

    super(props)

    this.state = {

      columns: [],
      markets: [],
      tickers: this.props.tickers,
      mkt: '',
      sub: '',
      connected: this.props.connected

    }

  }


  componentDidMount() {
    
    const e = document.getElementById('defaultCol')
    e && e.click()

  }


  static getDerivedStateFromProps = (nextProps, prevState) => ({
    
    tickers : nextProps.tickers,
    connected: nextProps.connected,
    markets: prevState.markets
  
  })
 

  componentDidUpdate() {

    if (!this.state.markets.length && Object.keys(this.props.markets).length)

      this.getMarkets(this.props.markets)

    else if (this.state.connected !== this.props.connected)

      this.setState({connected: this.props.connected})

  }


  changeGridCol = e => {

    let col = e.currentTarget.value

    this.setState({

      columns: [
        { 
          key: "pair",
          name: "Pair",
          editable: false,
          sortable: true,
          formatter: props => (<div style={{ textAlign:'left' }}>{props.value}</div>)
        },
        {
          key: "last_price",
          name: "Last Price",
          editable: false,
          sortable: true,
          formatter: props => (<div style={{ textAlign:'left' }}>{((+Number(props.value)).toFixed(6)).replace(/0+$/g,'').replace(/\.$/,'')}</div>)
        },
        {
          key: col.toLowerCase(),
          name: col,
          editable: false,
          sortable: true,
          formatter: props => {

            const val = Number(props.value)

            return col === 'Change' ?
              (<div style={{textAlign:'center', color: (val < 0 ? "red" : "green") }}>{val < 0 ? '' : '+' }{val.toFixed(4)}%</div>) :
              (<div style={{textAlign:'left'}}>{((+val).toFixed(6)).replace(/0+$/,'').replace(/\.$/,'')}</div>)

          }
        }
      ]
    })

  }


  changeFilter = e => {
   
    const filter = e.currentTarget.value.toUpperCase()
    this.setState({tickers:[]}, () => this.props.changeFilter(filter))

  }

  changeMarket = e => {

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

    this.setState({ sub: '', mkt: mkt, tickers:[]}, () => this.props.changeMarket(mkt))

  }


  changeSubMarket = e => {

    const sub = e.currentTarget.id

    this.setState({ sub: sub , tickers:[]}, () => this.props.changeSubMarket(sub))

  }


  getMarkets = mkt => {

    let markets = []

    for (let m in mkt)

      if (mkt[m].length === 1)

        markets.push(

          <Button
            key={m}
            size="sm"
            id={m}
            className="btn-light"
            onClick={this.changeMarket}
          >
            {m}
          </Button>

        )

      else
        markets.push(

          <UncontrolledButtonDropdown key={m}>
            <DropdownToggle
              caret
              className="btn-light"
              id={m}
              onClick={this.changeMarket}
              size="sm">
                {m}
            </DropdownToggle>
            <DropdownMenu>
              {
                mkt[m].map(pn =>
                  <DropdownItem
                    id={pn}
                    key={pn}
                    onClick={this.changeSubMarket}>
                    {pn}
                  </DropdownItem>)
              }
            </DropdownMenu>
          </UncontrolledButtonDropdown>
          
        )

        this.setState({
          markets: markets
        }, () => document.getElementById(markets[0].props.id).click())
        
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
              onClick={this.props.connectWS}
            />
            <div></div>
          </div>
          <div className="filterMkt">
              <div>
                <div className="input-group">
                  <span className="input-group-append">
                      <div className="input-group-text border-0"><i className="fa fa-filter"></i></div>
                  </span>
                  <span className="form-control py-2 border-0">:</span>
                  <div
                    type="search" id="market-filter">
                      {this.state.mkt + (this.state.sub ? '/' + this.state.sub : '')}
                  </div>
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
                <input
                  className="form-control py-2 border-left-0 border"
                  type="search"
                  onChange={this.changeFilter}></input>
              </div>
            </div>
            <div>
              <div>
                <div>
                  <label><input type="radio" name="gridCol" value="Change" onChange={this.changeGridCol}></input>Change</label>
                </div>
                <div>
                <label><input type="radio" name="gridCol" value="Volume" onChange={this.changeGridCol} id="defaultCol"></input>Volume</label>
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
            onGridSort={(sortColumn, sortDirection) => this.props.changeSort(sortColumn, sortDirection)}
          />

        </div>
      </div>
    );
  }
}


TickerTable.propTypes = {

  connected: PropTypes.bool.isRequired,
  markets: PropTypes.object.isRequired,
  tickers: PropTypes.array.isRequired,
  changeMarket: PropTypes.func.isRequired,
  changeSubMarket: PropTypes.func.isRequired,
  getTickers: PropTypes.func.isRequired,
  connectWS: PropTypes.func.isRequired,
  changeFilter: PropTypes.func.isRequired,
  changeSort: PropTypes.func.isRequired

}
