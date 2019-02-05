import React from "react";
import ReactDOM from "react-dom";
import Layout from "./Layout";
import { BrowserRouter } from 'react-router-dom';
ReactDOM.render(<BrowserRouter><Layout csrfValue={document.getElementById('csrf_value').value} /></BrowserRouter>, document.getElementById("content"));
