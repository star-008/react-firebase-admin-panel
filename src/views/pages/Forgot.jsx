import React from "react";
import info from '../../info'
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';

// reactstrap components
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Input,
    InputGroupAddon,
    InputGroupText,
    InputGroup,
    Container,
    Col,
    Row
} from "reactstrap";
import Firebase from "firebase";
import config from "../../config";


class Forgot extends React.Component {
    constructor(props) {
        super(props);

        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            email: '',
            emailState: ""
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.notifyMessage = this.notifyMessage.bind(this);
    }
    componentDidMount() {
        document.body.classList.toggle("login-page");
    }
    componentWillUnmount() {
        document.body.classList.toggle("login-page");
    }

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
            default:
                break;
        }
        this.setState({ [stateName]: event.target.value });
    };

    verifyEmail = value => {
        var emailRex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (emailRex.test(value)) {
            return true;
        }
        return false;
    };
    handleSubmit = () => {
        if (this.state.emailState === "") {
            this.setState({ emailState: "has-danger" });
        }

        if (this.state.emailState === "has-success") {
            var _this = this;
            _this.setState({loading: true});
            let ref = Firebase.firestore().collection('Web_App_Users').doc(_this.state.email.toLowerCase());
            ref.get().then(function(doc) {
                if (doc.exists) {
                    var token = _this.generatePass(50);
                    var text = "Password Change Url : <a href='" + info.changePassUrl + "?" + token + "' target='_blank'>Click here</a>";
                    Firebase.firestore().collection('Web_App_Users').doc(_this.state.email.toLowerCase()).set({token: token}, {merge: true}).then(function () {
                        Firebase.functions().httpsCallable('sendMail')({email: _this.state.email.toLowerCase(), subject: 'Password Reset', text: text}).then(function(result) {
                            _this.setState({loading: false});
                            _this.notifyMessage("tc", 2, "Message has been sent to your email address.");
                            window.setTimeout(function() { _this.props.history.push("/") }, 2000);
                        }).catch(function (err) {
                            _this.setState({loading: false});
                            _this.notifyMessage("tc", 3, "Network error!");
                        });
                    }).catch(function (err) {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "Network error!");
                    });
                } else {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "This email does not exist!");
                }
            }).catch(function(error) {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Network error!");
            });
        }
    };
    generatePass(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    render() {
        let {
            emailState
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
                    <Container>
                        <Row>
                            <Col className="ml-auto mr-auto" lg="5" md="6">
                                <Card className="card-login">
                                    <CardHeader>
                                        <CardHeader>
                                            <h3 className="header text-center">Forgot Password</h3>
                                        </CardHeader>
                                        <span className="login-form-answer"><a href="#" onClick={e => {e.preventDefault(); this.props.history.push("/login");}}>{'< Go to login'}</a></span>
                                    </CardHeader>
                                    <CardBody>
                                        <div>
                                            <label>Email Address</label>
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
                                                            this.handleSubmit();
                                                        }
                                                    }}
                                                />
                                                {this.state.emailState === "has-danger" ? (
                                                    <label className="error">
                                                        Please enter a valid email address.
                                                    </label>
                                                ) : null}
                                            </InputGroup>
                                        </div>
                                        <div>
                                            <Button
                                                color="primary"
                                                href="#"
                                                block
                                                onClick={this.handleSubmit}
                                            >
                                                Reset Password
                                            </Button>
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
    }
}

export default Forgot;
