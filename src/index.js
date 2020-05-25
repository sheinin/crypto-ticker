import React from "react";
import ReactDOM from "react-dom";
import TickerTable from './App';
import './index.css';
import "./material-icons.css";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <div>
      <div className="App">
        <TickerTable />
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
rootElement && ReactDOM.render(<App />, rootElement);
