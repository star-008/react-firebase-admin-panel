import React from "react";
import Firebase from 'firebase';
import PasswordHash from 'password-hash';
import config from '../../config';
import ReactBSAlert from "react-bootstrap-sweetalert";
import NotificationAlert from "react-notification-alert";
import {withCookies, Cookies} from 'react-cookie';
import {instanceOf} from "prop-types";
import GoogleLogin from 'react-google-login';
import FacebookLogin from 'react-facebook-login';
import info from '../../info'
import request from 'request';
import LoadingOverlay from 'react-loading-overlay';
// reactstrap components

import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Label,
  FormGroup,
  Input,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Container,
  Row,
  Col
} from "reactstrap";

require("firebase/functions");

var Recaptcha = require('react-recaptcha');

const publicIp = require('public-ip');
class Register extends React.Component {
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };
  constructor(props) {
    super(props);
      if (!Firebase.apps.length) {
          Firebase.initializeApp(config);
      }

      const { cookies } = props;
      this.state = {
          loading: false,
          cookies: cookies,
          email: '',
          agree: '0',
          interest: '0',

          emailState: "",
          agreeState: "",
          alert: null,
          enableRegister: false,
          address_info: null
      };

      this.handleChange = this.handleChange.bind(this);
      this.handleRegister = this.handleRegister.bind(this);
      this.SuccessAlert = this.SuccessAlert.bind(this);
      this.loadAddressInfo = this.loadAddressInfo.bind(this);
      this.loadCallback = this.loadCallback.bind(this);
      this.verifyCallback = this.verifyCallback.bind(this);
  }
  componentDidMount() {
    document.body.classList.toggle("register-page");
    this.loadAddressInfo();
  }
  componentWillUnmount() {
    document.body.classList.toggle("register-page");
  }
  loadAddressInfo() {
    var _this = this;
    _this.setState({loading: true});
    publicIp.v4().then(ip => {
        console.log("your public ip address", ip);
        let url = 'https://api.ipgeolocation.io/ipgeo?apiKey=' + info.ip_api_key + '&ip='+ip+'&lang=en';

        request.get(url, function(err,res,body){
            if(err){
                _this.setState({address_info: null});
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Network error!");
            }
            if(res.statusCode !== 200 ) {
                _this.setState({address_info: null});
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Load geolocation error!");
            }

            let result = JSON.parse(body);
                _this.setState({address_info: result});
                _this.setState({loading: false});
            });
        });
  }
  loadCallback () {
    this.setState({enableRegister: false});
  };
  verifyCallback () {
      this.setState({enableRegister: true});
  };
  SuccessAlert(text1, text2, text3) {
    this.setState({
        alert: (
            <ReactBSAlert
                style={{ display: "block", marginTop: "-300px" }}
                title="Registeration Successful"
                onConfirm={() => this.hideAlert()}
                confirmBtnBsStyle="success"
                confirmBtnText="Get Started"
            >
                <div style={{ color:"black" }}><h6>{text1}</h6><div className="text-md-left">{text2}<br/>{text3}<br/></div></div>
            </ReactBSAlert>
        )
    });
  };
  hideAlert = () => {
    this.setState({
        alert: null
    });

    this.props.history.push("/login");
  };
  notifyMessage = (place, color, text) => {
        var type;
        switch (color) {
            case 1:
                type = "primary";
                break;
            case 2:
                type = "success";
                break;
            case 3:
                type = "danger";
                break;
            case 4:
                type = "warning";
                break;
            case 5:
                type = "info";
                break;
            default:
                break;
        }

        var options = {};
        options = {
            place: place,
            message: (
                <div className="text-md-center">
                    <div>
                        <b>{text}</b>
                    </div>
                </div>
            ),
            type: type,
            icon: "now-ui-icons ui-1_bell-53",
            autoDismiss: 3
        };
        this.refs.notificationAlert.notificationAlert(options);
    };
  handleChange = (event, stateName, type) => {
    switch (type) {
        case "email":
            if (this.verifyEmail(event.target.value)) {
                this.setState({ [stateName + "State"]: "has-success" });
                const {name, value} = event.target;
                this.setState({[name]: value});
            } else {
                this.setState({ [stateName + "State"]: "has-danger" });
            }
            break;
        case "interest" :
            if (this.state.interest === "0") {
                this.setState({"interest": "1"});
            } else {
                this.setState({"interest": "0"});
            }
            break;
        case "agree" :
            if (this.state.agree === "0") {
                this.setState({ [stateName + "State"]: "has-success" });
                this.setState({"agree": "1"});
            } else {
                this.setState({"agree": "0"});
                this.setState({ [stateName + "State"]: "has-danger" });
            }
            break;
        default:
            break;
    }
  };
  verifyEmail = value => {
    var emailRex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (emailRex.test(value)) {
        return true;
    }
    return false;
  };
  handleRegister = () => {
    if (this.state.emailState === "") {
        this.setState({ emailState: "has-danger" });
    }

    if (
        this.state.agreeState === ""
    // || this.state.registerConfirmPasswordState === ""
    ) {
        this.setState({ agreeState: "has-danger" });
        // this.setState({ registerConfirmPasswordState: "has-danger" });
    }

    if (this.state.emailState === "has-success" && this.state.agreeState === "has-success") {
        var email = this.state.email.toLowerCase();
        let ref = Firebase.firestore().collection('Web_App_Users').doc(email);
        var _this = this;
        _this.setState({loading: true});
        ref.get().then(function(doc) {
            if (doc.exists) {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "This email is already exist!");
            } else {
                Firebase.firestore().collection('Customers').get().then(function (res) {
                    var last_id = "000000000000";
                    var next_id = "000000000001";
                    if (res.docs.length > 0) {
                        last_id = res.docs[res.docs.length - 1].id;
                        var str = (parseInt(last_id) + 1).toString();
                        var pad = "000000000000";
                        next_id = pad.substring(0, pad.length - str.length) + str;
                    }

                    var random_pass = _this.generatePass(8);
                    var customer_id = next_id;
                    var now = new Date();
                    var reg_data1 = {
                        API_Key: "",
                        Company_Name: "",
                        Country: _this.state.address_info===null?"":_this.state.address_info.country_name.toLowerCase(),
                        Email: email,
                        Name: "",
                        Partner_Interest: _this.state.interest===0?false:true,
                        Image_Url: "",
                        Phone_Number: "",
                        Web_Site: "",
                        Customer_Category: 'Cat002'
                    };
                    Firebase.firestore().collection('Customers').doc(customer_id.toString()).set(reg_data1)
                        .then(function() {
                            var reg_data2 = {
                                Activated: true,
                                Accessible_Locations: [],
                                Created_Date: now,
                                Customer_ID: customer_id,
                                Designation: "",
                                Last_Activity_Date: "",
                                Last_Updated_Date: now,
                                Last_Updated_User_ID: "",
                                Name: "",
                                OTP_Code: "",
                                OTP_Enabled: false,
                                Password: PasswordHash.generate(random_pass),
                                Role: "System_Admin",
                                Google_Token: "",
                                Facebook_Token: "",
                                token: "",
                                What_Sup: "",
                                Viber: "",
                                Telegram: "",
                                Line: "",
                                Image_Url: "",
                                Notification: false
                            };
                            Firebase.firestore().collection('Web_App_Users').doc(email).set(reg_data2)
                                .then(function() {
                                    /////// Register success code ////////
                                    // _this.notifyMessage("tc", 2, "Register success!");
                                    var message_text =
                                        "<b>Dear Customer.</b><br /><br>" +
                                        "Your registration is successfully done.<br /><br />" +
                                        "Please check your email for login details.<br/>" +
                                        "Your login information:<br/>" +
                                        "Username: " + email + "<br/>" +
                                        "Password: " + random_pass + "<br>" +
                                        "<a target='_blank' href='" + info.loginUrl + "'>Get Start</a><br/><br/>" +
                                        "<a href='#'>Watch xxx software video manual >></a><br/><br/>" +
                                        "Best Regards.<br/>" +
                                        "xxx International Team<br/>" +
                                        "Web: http://www.xxx.com<br/>" +
                                        "Youtube: https://goo.gl/XcOqb8<br/>" +
                                        "Forum: https://forum.xxx.com<br/>" +
                                        "Twitter: https://twitter.com/xxx company<br/>" +
                                        "Facebook: https://www.facebook.com/xxx company<br/><br/>" +
                                        "Best Regards.";

                                    _this.sendEmail(email, message_text);
                                    var message_text1 = "Congratulation.";
                                    var message_text2 = "Your registration is successfully done.";
                                    var message_text3 = "Please check your email for login details.";
                                    _this.setState({loading: false});
                                    _this.SuccessAlert(message_text1, message_text2, message_text3);
                                }).catch(function(error) {
                                    _this.setState({loading: false});
                                    _this.notifyMessage("tc", 3, "Register error!");
                                });
                        }).catch(function(error) {
                            _this.setState({loading: false});
                            _this.notifyMessage("tc", 3, "Register Failed!");
                        });
                }).catch(function (err) {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Network error!");
                });
            }
        }).catch(function(error) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
  };
  sendEmail(email, text) {
      Firebase.functions().httpsCallable('sendMail')({email: email, subject: 'Welcome to My App Dev1!', text: text}).then(function(result) {
          console.log(result);
      });
  };
  responseGoogle = (response) => {
    var _this = this;
    var now = new Date();
    if (response.error === "popup_closed_by_user") {
        _this.setState({loading: false});
        _this.notifyMessage("tc", 3, "Popup closed by user.");
        return;
    } else if (response.error === "idpiframe_initialization_failed") {
        _this.setState({loading: false});
        return
    }

    var profile = response.profileObj;
    if (profile == null) {
        _this.setState({loading: false});
        _this.notifyMessage("tc", 3, "Network error!");
    } else {
        Firebase.firestore().collection('Web_App_Users').doc(profile.email.toLowerCase()).get().then(function (doc) {
            if (doc.exists) {
                var auth_info = {
                    customer_id: doc.data().Customer_ID,
                    email: doc.id,
                    role: doc.data().Role
                };
                var update_data = {
                    Last_Activity_Date: now,
                    Google_Token: response.accessToken
                }
                Firebase.firestore().collection('Web_App_Users').doc(profile.email.toLowerCase()).update(update_data).then(function () {
                    _this.state.cookies.set('auth_info', doc.id);
                    localStorage.setItem('auth_info', JSON.stringify(auth_info));
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 2, "Login success!");
                    window.setTimeout(function() { _this.props.history.push("/") }, 2000);
                }).catch(function (err) {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Network error!");
                });
            } else {
                Firebase.firestore().collection('Customers').get().then(function (res) {
                    var last_id = "000000000000";
                    var next_id = "000000000001";
                    if (res.docs.length > 0) {
                        last_id = res.docs[res.docs.length - 1].id;
                        var str = (parseInt(last_id) + 1).toString();
                        var pad = "000000000000";
                        next_id = pad.substring(0, pad.length - str.length) + str;
                    }
                    var customer_id = next_id;

                    var register_customer_data = {
                        API_Key: "",
                        Company_Name: "",
                        Country: _this.state.address_info===null?"":_this.state.address_info.country_name.toLowerCase(),
                        Email: profile.email,
                        Name: profile.givenName + profile.familyName,
                        Partner_Interest: false,
                        Image_Url: "",
                        Phone_Number: "",
                        Web_Site: "",
                        Customer_Category: 'Cat002'
                    };

                    Firebase.firestore().collection('Customers').doc(customer_id).set(register_customer_data).then(function () {
                        var random_pass = _this.generatePass(8);
                        var register_app_data = {
                            Activated: true,
                            Accessible_Locations: [],
                            Created_Date: now,
                            Customer_ID: customer_id,
                            Designation: "",
                            Last_Activity_Date: "",
                            Last_Updated_Date: now,
                            Last_Updated_User_ID: "",
                            Name: register_customer_data.Name,
                            OTP_Code: "",
                            OTP_Enabled: false,
                            Password: PasswordHash.generate(random_pass),
                            Role: "System_Admin",
                            Google_Token: response.accessToken,
                            Facebook_Token: "",
                            token: "",
                            What_Sup: "",
                            Viber: "",
                            Telegram: "",
                            Line: "",
                            Image_Url: "",
                            Notification: false
                        };

                        Firebase.firestore().collection('Web_App_Users').doc(register_customer_data.Email.toLowerCase()).set(register_app_data).then(function () {
                                _this.state.cookies.set('auth_info', doc.id);
                                localStorage.setItem('auth_info', JSON.stringify({customer_id: register_app_data.Customer_ID, email: doc.id, role: register_app_data.Role}));
                                _this.setState({loading: false});
                                _this.notifyMessage("tc", 2, "Login success!");
                                window.setTimeout(function () {
                                    _this.props.history.push("/")
                                }, 2000);
                            }).catch(function (err) {
                                _this.setState({loading: false});
                                _this.notifyMessage("tc", 3, "Network error!");
                            });

                        }).catch(function (err) {
                            _this.setState({loading: false});
                            _this.notifyMessage("tc", 3, "Network error!");
                        });
                    });
                }
            }).catch(function (err) {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Network error!");
            });
    }
  };
  responseFacebook = (response) => {
    var now_date = new Date();
    var _this = this;
    if (response.accessToken != null) {
        var profile = response;
        Firebase.firestore().collection('Web_App_Users').doc(profile.email.toLowerCase()).get().then(function (doc) {
            if (doc.exists) {
                var auth_info = {
                    customer_id: doc.data().Customer_ID,
                    email: doc.id,
                    role: doc.data().Role
                };
                var update_data = {
                    Last_Activity_Date: now_date,
                    Facebook_Token: profile.accessToken
                };
                Firebase.firestore().collection('Web_App_Users').doc(profile.email.toLowerCase()).update(update_data).then(function () {
                    _this.notifyMessage("tc", 2, "Login success!");
                    _this.state.cookies.set('auth_info', doc.id);
                    localStorage.setItem('auth_info', JSON.stringify(auth_info));
                    _this.setState({loading: false});
                    window.setTimeout(function() { _this.props.history.push("/") }, 2000);
                }).catch(function (err) {
                    _this.setState({loading: false});
                });
            } else {
                Firebase.firestore().collection('Customers').get().then(function (res) {
                    var last_id = "000000000000";
                    var next_id = "000000000001";
                    if (res.docs.length > 0) {
                        last_id = res.docs[res.docs.length - 1].id;
                        var str = (parseInt(last_id) + 1).toString();
                        var pad = "000000000000";
                        next_id = pad.substring(0, pad.length - str.length) + str;
                    }
                    var customer_id = next_id;
                    var register_customer_data = {
                        API_Key: "",
                        Activated: true,
                        Company_Name: "",
                        Country: _this.state.address_info===null?"":_this.state.address_info.country_name.toLowerCase(),
                        Email: profile.email,
                        Name: profile.name,
                        Partner_Interest: false,
                        Registered_Date: now_date,
                        Phone_Number: "",
                        Web_Site: "",
                        Customer_Category: 'Cat002'
                    };

                    Firebase.firestore().collection('Customers').doc(customer_id).set(register_customer_data).then(function () {
                        var random_pass = _this.generatePass(8);
                        var register_app_data = {
                            Activated: true,
                            Accessible_Locations: [],
                            Created_Date: now_date,
                            Customer_ID: customer_id,
                            Designation: "",
                            Last_Activity_Date: "",
                            Last_Updated_Date: now_date,
                            Last_Updated_User_ID: "",
                            Name: register_customer_data.Name,
                            OTP_Code: "",
                            OTP_Enabled: false,
                            Password: PasswordHash.generate(random_pass),
                            Role: "System_Admin",
                            Facebook_Token: profile.accessToken,
                            Google_Token: "",
                            token: "",
                            What_Sup: "",
                            Viber: "",
                            Telegram: "",
                            Line: "",
                            Image_Url: "",
                            Notification: false
                        };

                        Firebase.firestore().collection('Web_App_Users').doc(register_customer_data.Email.toLowerCase()).set(register_app_data).then(function () {
                            _this.state.cookies.set('auth_info', doc.id);
                            localStorage.setItem('auth_info', JSON.stringify({customer_id: register_app_data.Customer_ID, email: doc.id, role: register_app_data.Role}));
                            _this.notifyMessage("tc", 2, "Login success!");
                            _this.setState({loading: false});
                            window.setTimeout(function() { _this.props.history.push("/") }, 2000);
                        }).catch(function (err) {
                            _this.setState({loading: false});
                            _this.notifyMessage("tc", 3, "Network error!");
                        });

                    }).catch(function (err) {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "Network error!");
                    });
                }).catch(function (err) {
                    _this.setState({loading: false});
                });
            }
        }).catch(function (err) {
            console.log(err);
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    } else {
        _this.setState({loading: false});
        _this.notifyMessage("tc", 3, "Network error!");
    }
  };
  onClickSocial = (e) => {
    this.setState({loading: true});
  };
  generatePass(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,./<>?:{}[]-=_+)(*&^%$#@!~`';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  render() {
    let {
      emailState,
      agreeState
    } = this.state;

    return (
        <div className="wrapper wrapper-full-page" ref="fullPages">
            <LoadingOverlay
                active={this.state.loading}
                spinner
                text='Loading'
            >
            <div className="full-page section-image">
                <NotificationAlert ref="notificationAlert" />
                <div className="register-page">
                {this.state.alert}
                  <Container>
                      <Row>
                          <Col className="ml-auto mr-auto" lg="7" md="6">
                              <Card>
                                  <CardHeader>
                                      <CardHeader>
                                          <h3 className="header text-center">Test App Registeration</h3>
                                      </CardHeader>
                                      <span className="login-form-answer"><a href="#" onClick={e => {e.preventDefault(); this.props.history.push("/login");}}>{'< Go to login'}</a></span>
                                  </CardHeader>
                                  <CardBody>
                                      <div className="row">
                                          <div className="col-md-7">
                                              <span>Email Address</span>
                                              <InputGroup className={`has-label ${emailState}`}>
                                                  <InputGroupAddon addonType="prepend">
                                                      <InputGroupText>
                                                          <i className="nc-icon nc-email-85" />
                                                      </InputGroupText>
                                                  </InputGroupAddon>
                                                  <Input
                                                      placeholder="Email Address"
                                                      name="email"
                                                      type="email"
                                                      onChange={e => this.handleChange(e, "email", "email")}
                                                      onKeyDown={e => {
                                                          if (e.keyCode === 13){
                                                              if (!this.refs['btn_register'].props.disabled) {
                                                                  this.refs['btn_register'].onClick();
                                                              }
                                                          }
                                                      }}
                                                  />
                                                  {this.state.emailState === "has-danger" ? (
                                                      <label className="error">
                                                          Please enter a valid email address.
                                                      </label>
                                                  ) : null}
                                              </InputGroup>
                                              <br/>
                                              <FormGroup>
                                                  <FormGroup check>
                                                      <Label check>
                                                          <Input
                                                              defaultValue=""
                                                              type="checkbox"
                                                              name="interest"
                                                              onChange={e =>
                                                                  this.handleChange(e, "interest", "interest")
                                                              }
                                                          />
                                                          <span className="form-check-sign" />
                                                          Interested in becoming a partner
                                                      </Label>
                                                  </FormGroup>
                                              </FormGroup>
                                              <FormGroup className={`has-label ${agreeState}`}>
                                                  <FormGroup check>
                                                      <Label check>
                                                          <Input
                                                              defaultValue=""
                                                              type="checkbox"
                                                              name="agree"
                                                              onChange={e =>
                                                                  this.handleChange(e, "agree", "agree")
                                                              }
                                                          />
                                                          <span className="form-check-sign" />
                                                          Yes, I agree to the <a href="#" onClick={e => {e.preventDefault();}}>terms and conditions</a>
                                                      </Label>
                                                      {this.state.agreeState === "has-danger" ? (
                                                          <label className="error">
                                                              Please check a agree to the terms and conditions.
                                                          </label>
                                                      ) : null}
                                                  </FormGroup>
                                              </FormGroup>
                                              <Recaptcha
                                                  sitekey={info.site_key}
                                                  render="explicit"
                                                  onloadCallback={this.loadCallback}
                                                  verifyCallback={this.verifyCallback}
                                              />
                                              <div className="row">
                                                  <div className="col-md-7">

                                                  </div>
                                                  <div className="col-md-5">
                                                      <Button
                                                          disabled={!this.state.enableRegister}
                                                          ref="btn_register"
                                                          color="success"
                                                          onClick={this.handleRegister}
                                                          block
                                                      >
                                                          Sign up
                                                      </Button>
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="col-md-5">
                                              <div className="site-link-button">
                                                  <GoogleLogin
                                                      clientId={info.google_client_id}
                                                      buttonText="Login"
                                                      onSuccess={this.responseGoogle}
                                                      onFailure={this.responseGoogle}
                                                      onRequest={this.onClickSocial}
                                                      cookiePolicy={'single_host_origin'}
                                                      render={renderProps => (
                                                          <Button color="google" onClick={renderProps.onClick} disabled={renderProps.disabled} block>
                                                              <i className="fa fa-google-plus" />
                                                              Sign in with Google+
                                                          </Button>
                                                      )}
                                                  />
                                              </div>
                                              <div className="site-link-button">
                                                  <FacebookLogin
                                                      appId={info.facebook_app_id}
                                                      fields="name,email,picture"
                                                      onClick={this.onClickSocial}
                                                      callback={this.responseFacebook}
                                                      cssClass="btn btn-facebook btn-block"
                                                      icon="fa fa-facebook-square"
                                                  />
                                              </div>
                                          </div>
                                      </div>
                                  </CardBody>
                                  <CardFooter></CardFooter>
                              </Card>
                          </Col>
                      </Row>
                  </Container>
                  <div
                      className="full-page-background"
                      style={{
                          backgroundColor: "lightGrey"
                      }}
                  />
                </div>
            </div>
            </LoadingOverlay>
        </div>
    );
  }
}

export default withCookies(Register);
