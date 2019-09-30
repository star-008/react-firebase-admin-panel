import React from "react";
import { instanceOf } from 'prop-types';
import { withCookies, Cookies } from 'react-cookie';
// javascript plugin used to create scrollbars on windows
// import PerfectScrollbar from "perfect-scrollbar";
import { Route, Switch } from "react-router-dom";

import AdminNavbar from "./AdminNavbar.jsx";
import Sidebar from "./Sidebar.jsx";
// import FixedPlugin from "../../../components/FixedPlugin/FixedPlugin.jsx";
import Firebase from 'firebase';
import config from '../../../config';
import routes from "../../../routes.js";

// var ps;

class Admin extends React.Component {
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };
  constructor(props) {
    super(props);
    const { cookies } = props;
    if (!Firebase.apps.length) {
        Firebase.initializeApp(config);
    }

    if (localStorage.getItem('auth_info')) {
        let running_dispenser = localStorage.getItem('running_dispenser');
        if (running_dispenser) {
            this.props.history.push('/dispenser/run/' + running_dispenser);
        } else if (this.props.history.action === "PUSH" || this.props.location.pathname === "/") {
            this.props.history.push('/welcome');
        }
    } else {
        if (cookies.get('auth_info')) {
            Firebase.firestore().collection('Customers').doc(cookies.get('auth_info')).get().then(function (customer) {
                if (customer.exists) {
                  localStorage.setItem('auth_info', JSON.stringify({customer_id:customer.id, role:customer.data().Role}));
                } else {
                  this.props.history.push('/login');
                }
            }).catch(function (error) {
                this.props.history.push('/login');
            });
        } else {
            this.props.history.push('/login');
        }
    }

    this.state = {
      backgroundColor: "black",
      activeColor: "success",
      sidebarMini: false
    };
  }
  componentDidMount() {
    // if (navigator.platform.indexOf("Win") > -1) {
    //   document.documentElement.className += " perfect-scrollbar-on";
    //   document.documentElement.classList.remove("perfect-scrollbar-off");
    //   ps = new PerfectScrollbar(this.refs.mainPanel);
    // }
  }
  componentWillUnmount() {
    // if (navigator.platform.indexOf("Win") > -1) {
    //   // ps.destroy();
    //   document.documentElement.className += " perfect-scrollbar-off";
    //   document.documentElement.classList.remove("perfect-scrollbar-on");
    // }
  }
  componentDidUpdate(e) {
    // if (e.history.action === "PUSH") {
    //   document.documentElement.scrollTop = 0;
    //   document.scrollingElement.scrollTop = 0;
    //   this.refs.mainPanel.scrollTop = 0;
    // }
  }
  getRoutes = routes => {
    return routes.map((prop, key) => {
      if (prop.collapse) {
        return this.getRoutes(prop.views);
      }
      if (prop.layout === "/admin") {
        return (
          <Route
            path={prop.path}
            component={prop.component}
            key={key}
          />
        );
      } else {
        return null;
      }
    });
  };
  handleActiveClick = color => {
      this.setState({ activeColor: color });
  };
  handleBgClick = color => {
      this.setState({ backgroundColor: color });
  };
  handleMiniClick = () => {
    if (document.body.classList.contains("sidebar-mini")) {
      this.setState({ sidebarMini: false });
    } else {
      this.setState({ sidebarMini: true });
    }
    document.body.classList.toggle("sidebar-mini");
  };
  render() {
    return (

      <div className="wrapper">
        <Sidebar
          {...this.props}
          routes={routes}
          bgColor={this.state.backgroundColor}
          activeColor={this.state.activeColor}
        />
        <div className="main-panel" ref="mainPanel">
          <AdminNavbar {...this.props} handleMiniClick={this.handleMiniClick} />
          <Switch>{this.getRoutes(routes)}</Switch>
        </div>
        {/*<FixedPlugin*/}
            {/*bgColor={this.state.backgroundColor}*/}
            {/*activeColor={this.state.activeColor}*/}
            {/*sidebarMini={this.state.sidebarMini}*/}
            {/*handleActiveClick={this.handleActiveClick}*/}
            {/*handleBgClick={this.handleBgClick}*/}
            {/*handleMiniClick={this.handleMiniClick}*/}
        {/*/>*/}
      </div>
    );
  }
}

export default withCookies(Admin);
