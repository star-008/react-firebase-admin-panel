import React from "react";
import ReactDOM from "react-dom";
import { createBrowserHistory } from "history";
import { Router, Route, Switch, Redirect } from "react-router-dom";
import AdminLayout from "./views/layouts/Admin/Admin.jsx";

import Login from "./views/pages/Login.jsx"
import Register from "./views/pages/Register.jsx"
import Forgot from "./views/pages/Forgot.jsx"
import ChangePassword from "./views/pages/ChangePassword";

import "bootstrap/dist/css/bootstrap.css";
import "./assets/scss/paper-dashboard.scss";
import "./assets/demo/demo.css";
import info from "./info"

const hist = createBrowserHistory();

document.title = info.app_name;

ReactDOM.render(
    <Router history={hist}>
        <Switch>
            <Route path="/login" render={props => <Login {...props} />} />
            <Route path="/register" render={props => <Register {...props} />} />
            <Route path="/forgot_password" render={props => <Forgot {...props} />} />
            <Route path="/change_password" render={props => <ChangePassword {...props} />} />
            <Redirect from="/logout" to="/login" />
            <Route path="/" render={props => <AdminLayout {...props} />} />
        </Switch>
    </Router>,
    document.getElementById("root")
);
