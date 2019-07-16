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
    Col,
    Row
} from "reactstrap";

const publicIp = require('public-ip');
class Login extends React.Component {
    static propTypes = {
        cookies: instanceOf(Cookies).isRequired
    };
    constructor(props) {
        super(props);
        if (props.location.hash !== "") {
            console.log("ddd", props);
        }

        const { cookies } = props;
        cookies.remove('auth_info');
        localStorage.removeItem('auth_info');
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            cookies: cookies,
            email: '',
            password: '',
            rememberMe: '0',

            registerEmailState: "",
            registerPasswordState: "",

            alert: null,
            address_info: null,

            google_token: '',
            facebook_token: '',
            social_email: ''
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSignIn = this.handleSignIn.bind(this);
        this.signIn = this.signIn.bind(this);
        this.notifyMessage = this.notifyMessage.bind(this);
        this.focusElement = this.focusElement.bind(this);
        this.loadAddressInfo = this.loadAddressInfo.bind(this);
        this.onClickSocial = this.onClickSocial.bind(this);
    };
    componentDidMount() {
        document.body.classList.toggle("login-page");
        this.loadAddressInfo();
    };
    componentWillUnmount() {
        document.body.classList.toggle("login-page");
    };
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
            case "password":
                if (this.verifyLength(event.target.value, 1)) {
                    this.setState({ [stateName + "State"]: "has-success" });
                    const {name, value} = event.target;
                    this.setState({[name]: value});
                } else {
                    this.setState({ [stateName + "State"]: "has-danger" });
                }
                break;
            case "remember" :
                if (this.state.rememberMe === "1") {
                    this.setState({"rememberMe": "0"});
                } else {
                    const {name} = event.target;
                    this.setState({[name]: "1"});
                }
                break;
            default:
                break;
        }
        this.setState({ [stateName]: event.target.value });
    };
    handleSignIn = () => {
        if (this.state.registerEmailState === "") {
            this.setState({ registerEmailState: "has-danger" });
        }

        if (
            this.state.registerPasswordState === ""
        // || this.state.registerConfirmPasswordState === ""
        ) {
            this.setState({ registerPasswordState: "has-danger" });
            // this.setState({ registerConfirmPasswordState: "has-danger" });
        }

        if (this.state.registerEmailState === "has-success" && this.state.registerPasswordState === "has-success") {
            var loginData = {
                email: this.state.email.toLowerCase(),
                password: this.state.password,
                rememberMe: this.state.rememberMe
            };

            this.signIn(loginData);
        }
    };
    focusElement(input) {
        // input.focus(input);
    };
    responseGoogle = (response) => {
        var _this = this;
        var now = new Date();
        console.log(response);
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
                    if (doc.data().OTP_Enabled) {
                        _this.setState({loading: false});
                        _this.setState({social_email: doc.id});
                        _this.setState({google_token: response.accessToken});
                        _this.inputAlert();
                    } else {
                        var auth_info = {
                            customer_id: doc.data().Customer_ID,
                            email: doc.id,
                            role: doc.data().Role
                        };
                        var update_data = {
                            Last_Activity_Date: now,
                            Google_Token: response.accessToken
                        };
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
                    }
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
                            Web_Site: ""
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
                    if (doc.data().OTP_Enabled) {
                        _this.setState({loading: false});
                        _this.setState({social_email: doc.id});
                        _this.setState({facebook_token: profile.accessToken});
                        _this.inputAlert();
                    } else {
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
                            _this.notifyMessage("tc", 3, "Network error!");
                        });
                    }
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
                            Web_Site: ""
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
                        _this.notifyMessage("tc", 3, "Network error!");
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
    signIn = (loginData) => {
        let ref = Firebase.firestore().collection('Web_App_Users').doc(loginData.email.toLowerCase());
        var _this = this;
        _this.setState({loading: true});
        var now = new Date();
        var last_activity_date = now;
        ref.get().then(function(app_user) {
            if (app_user.exists) {
                var password = loginData.password;
                if (PasswordHash.verify(password, app_user.data().Password)) {
                    if (app_user.data().Activated) {
                        if (app_user.data().OTP_Enabled) {
                            _this.setState({loading: false});
                            _this.inputAlert();
                        } else {
                            var auth_info = {
                                customer_id: app_user.data().Customer_ID,
                                email: app_user.id,
                                role: app_user.data().Role
                            };
                            Firebase.firestore().collection('Web_App_Users').doc(app_user.id).update({Last_Activity_Date: last_activity_date})
                                .then(function () {
                                    if (_this.state.rememberMe==="1")
                                        _this.state.cookies.set('auth_info', auth_info.email);

                                    localStorage.setItem("auth_info", JSON.stringify(auth_info));
                                    window.setTimeout(function() { _this.props.history.push("/") }, 2000);
                                    _this.setState({loading: false});
                                    _this.notifyMessage("tc", 2, "Login success!");
                                }).catch(function (err) {
                                _this.setState({loading: false});
                                _this.notifyMessage("tc", 3, "Network error!");
                            });
                        }
                    } else {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "User disabled!");
                    }
                } else {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Incorrect password!");
                }
            } else {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Incorrect email!");
            }
        }).catch(function(error) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    };
    sendEmail(email, text) {
        Firebase.functions().httpsCallable('sendMail')({email: email, subject: 'Welcome to My App Dev1!', text: text}).then(function(result) {
            console.log(result);
        });
    };
    inputAlert = () => {
        this.setState({
            alert: (
                <ReactBSAlert
                    input
                    showCancel
                    style={{ display: "block", marginTop: "-100px" }}
                    title="Input your otp code."
                    onConfirm={e => this.inputConfirm(e)}
                    onCancel={() => this.hideAlert()}
                    confirmBtnBsStyle="info"
                    cancelBtnBsStyle="danger"
                />
            )
        });
    };
    inputConfirm = e => {
        var _this = this;
        _this.setState({loading: true});
        var user_email = _this.state.email.toLowerCase();
        if (_this.state.social_email !== "") {
            user_email = _this.state.social_email.toLowerCase();
        }

        var now  = new Date();
        Firebase.firestore().collection('Web_App_Users').doc(user_email).get().then(function (doc) {
            if (doc.exists) {
                if (doc.data().OTP_Code === e) {
                    var auth_info = {
                        customer_id: doc.data().Customer_ID,
                        email: doc.id,
                        role: doc.data().Role
                    };
                    var otp_code = _this.generateId(6);
                    var update_otp_data = {
                        Last_Activity_Date: now,
                        OTP_Code: otp_code
                    };
                    if (_this.state.google_token !== "") {
                        update_otp_data['Google_Token'] = _this.state.google_token;
                        _this.setState({google_token: ""});
                        _this.setState({social_email: ""});
                    } else if (_this.state.facebook_token !== "") {
                        update_otp_data['Facebook_Token'] = _this.state.facebook_token;
                        _this.setState({facebook_token: ""});
                        _this.setState({social_email: ""});
                    }

                    Firebase.firestore().collection('Web_App_Users').doc(user_email).update(update_otp_data)
                        .then(function () {
                            var text = "Your otp code is changed.<br/>" +
                                "Otp code : <b>" + otp_code + "</b>";
                            Firebase.functions().httpsCallable('sendMail')({email: user_email, subject: 'New OTP Code', text: text}).then(function(result) {
                                if (_this.state.rememberMe==="1")
                                    _this.state.cookies.set('auth_info', auth_info.email);

                                localStorage.setItem("auth_info", JSON.stringify(auth_info));
                                _this.notifyMessage("tc", 2, "Login success!");
                                _this.setState({loading: false});
                                _this.hideAlert();
                                window.setTimeout(function() { _this.props.history.push("/") }, 2000);
                            }).catch(function (err) {
                                _this.setState({loading: false});
                                _this.hideAlert();
                                _this.notifyMessage("tc", 3, "Network error!");
                            });
                        });
                } else {
                    _this.setState({loading: false});
                    _this.hideAlert();
                    _this.notifyMessage("tc", 3, "Incorrect otp code!");
                }
            } else {
                _this.setState({loading: false});
                _this.hideAlert();
                _this.notifyMessage("tc", 3, "Network error!");
            }
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.hideAlert();
            _this.notifyMessage("tc", 3, "Network error!");
        });
    };
    hideAlert = () => {
        this.setState({
            alert: null
        });
    };
    verifyEmail = value => {
        var emailRex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (emailRex.test(value)) {
            return true;
        }
        return false;
    };
    // function that verifies if a string has a given length or not
    verifyLength = (value, length) => {
        if (value.length >= length) {
            return true;
        }
        return false;
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
    generateId(length) {
        var result           = '';
        var characters       = '0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    };
    generatePass(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,./<>?:{}[]-=_+)(*&^%$#@!~`';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    };
    render() {
        let {
            registerEmailState,
            registerPasswordState
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
                    <div className="login-page">
                        {this.state.alert}
                        <Container>
                            <Row>
                                <Col className="ml-auto mr-auto" lg="7" md="6">
                                    <Card className="card-login">
                                            <CardHeader>
                                                <CardHeader>
                                                    <h3 className="header text-center">Test App Login</h3>
                                                </CardHeader>
                                                <span className="login-form-answer">Are you new member? <a href="#" onClick={e => {e.preventDefault(); this.props.history.push("/register");}}>Please Signup.</a></span>
                                            </CardHeader>
                                            <CardBody>
                                                <div className="row">
                                                    <div className="col-md-7">
                                                        <label>Email Address</label>
                                                        <InputGroup className={`has-label ${registerEmailState}`}>
                                                            <InputGroupAddon addonType="prepend">
                                                                <InputGroupText>
                                                                    <i className="nc-icon nc-email-85" />
                                                                </InputGroupText>
                                                            </InputGroupAddon>
                                                            <Input
                                                                placeholder="Email Address"
                                                                name="email"
                                                                type="email"
                                                                onChange={e => this.handleChange(e, "registerEmail", "email")}
                                                                onKeyDown={e => {
                                                                    if (e.keyCode === 13){
                                                                        this.focusElement(this.refs['password']);
                                                                    }
                                                                }}
                                                            />
                                                            {this.state.registerEmailState === "has-danger" ? (
                                                                <label className="error">
                                                                    Please enter a valid email address.
                                                                </label>
                                                            ) : null}
                                                        </InputGroup>
                                                        <label>Password</label>
                                                        <InputGroup className={`has-label ${registerPasswordState}`}>
                                                            <InputGroupAddon addonType="prepend">
                                                                <InputGroupText>
                                                                    <i className="nc-icon nc-key-25" />
                                                                </InputGroupText>
                                                            </InputGroupAddon>
                                                            <Input
                                                                placeholder="Password"
                                                                type="password"
                                                                name="password"
                                                                ref="password"
                                                                autoComplete="off"
                                                                onChange={e =>
                                                                    this.handleChange(e, "registerPassword", "password")
                                                                }
                                                                onKeyDown={e => {
                                                                    if (e.keyCode === 13){
                                                                        this.handleSignIn();
                                                                    }
                                                                }}
                                                            />
                                                            {this.state.registerPasswordState === "has-danger" ? (
                                                                <label className="error">This field is required.</label>
                                                            ) : null}
                                                        </InputGroup>
                                                        <br />
                                                        <FormGroup>
                                                            <FormGroup check>
                                                                <Label check>
                                                                    <Input
                                                                        type="checkbox"
                                                                        name="rememberMe"
                                                                        innerRef={this.state.rememberMe}
                                                                        onChange={e =>
                                                                            this.handleChange(e, "remember", "remember")
                                                                        }
                                                                    />
                                                                    <span className="form-check-sign" />
                                                                    Remember me.
                                                                </Label>
                                                            </FormGroup>
                                                        </FormGroup>
                                                        <div className="row">
                                                            <div className="col-md-5">
                                                                <Button
                                                                    color="success"
                                                                    onClick={this.handleSignIn}
                                                                    block
                                                                >
                                                                    Sign in
                                                                </Button>
                                                            </div>
                                                            <div className="col-md-7">
                                                                <Button
                                                                    color="primary"
                                                                    onClick={e => this.props.history.push("/forgot_password")}
                                                                    block
                                                                >
                                                                    Forgot Password
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
                                backgroundImage: `url(${require("../../assets/img/bg/soroush-karimi.jpg")})`
                            }}
                        />
                    </div>
                </div>
                </LoadingOverlay>
            </div>
        );
    };
}

export default withCookies(Login);
