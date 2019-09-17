import React from "react";
import PasswordHash from 'password-hash';
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';
import Firebase from "firebase";
import config from "../../config";

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

class ChangePassword extends React.Component {
    constructor(props) {
        super(props);

        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            email: '',
            newPass: '',
            confirmPass: '',
            newPassState: 'has-success',
            confirmPassState: 'has-success'
        };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.notifyMessage = this.notifyMessage.bind(this);
    }
    componentDidMount() {
        var search = window.location.search;
        var token = search.slice(1, search.length);
        var _this = this;
        _this.setState({loading: true});
        console.log(search, token);
        Firebase.firestore().collection('Web_App_Users').where('token',"==" ,token).get().then(function (doc) {
            if (doc.docs.length === 1) {
                var mine = doc.docs[0];
                _this.setState({email : mine.id.toLowerCase()});
                _this.setState({loading: false});
            } else {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Please check your url again.");
                window.setTimeout(function() { _this.props.history.push("/") }, 2000);
            }
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Please check your url again.");
        });
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
    handleSubmit = () => {
        if ((this.state.newPass !== this.state.confirmPass) || this.state.newPass === "") {
            this.setState({newPassState: 'has-danger'});
            this.setState({confirmPassState: 'has-danger'});
        } else {
            this.setState({newPassState: 'has-success'});
            this.setState({confirmPassState: 'has-success'});
            var _this = this;
            _this.setState({loading: true});
            var update_data = {
                Password: PasswordHash.generate(_this.state.newPass),
                token: ""
            };

            Firebase.firestore().collection('Web_App_Users').doc(_this.state.email.toLowerCase()).update(update_data).then(function () {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 2, "Change password successfully.");
                window.setTimeout(function() { _this.props.history.push("/") }, 2000);
            }).catch(function (error) {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Please confirm email again!");
            });
        }
    };
    render() {
        let {
            newPassState, confirmPassState
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
                                            <h3 className="header text-center">Change Password</h3>
                                        </CardHeader>
                                        <span className="login-form-answer"><a href="" onClick={e => this.props.history.push("/login")}>Go to login</a></span>
                                    </CardHeader>
                                    <CardBody>
                                        <label>New Password</label>
                                        <InputGroup className={`has-label ${newPassState}`}>
                                            <InputGroupAddon addonType="prepend">
                                                <InputGroupText>
                                                    <i className="nc-icon nc-key-25" />
                                                </InputGroupText>
                                            </InputGroupAddon>
                                            <Input
                                                placeholder="New Password"
                                                name="newPass"
                                                type="password"
                                                defaultValue={this.state.newPass}
                                                onChange={e => this.setState({ newPass: e.target.value })}
                                                onKeyDown={e => {
                                                    if (e.keyCode === 13){
                                                        this.handleSubmit();
                                                    }
                                                }}
                                            />
                                            {this.state.newPassState === "has-danger" ? (
                                                <label className="error">
                                                    Please enter the not empty and same values.
                                                </label>
                                            ) : null}
                                        </InputGroup>
                                        <label>Confirm Password</label>
                                        <InputGroup className={`has-label ${confirmPassState}`}>
                                            <InputGroupAddon addonType="prepend">
                                                <InputGroupText>
                                                    <i className="nc-icon nc-key-25" />
                                                </InputGroupText>
                                            </InputGroupAddon>
                                            <Input
                                                placeholder="Confirm Password"
                                                name="confirmPass"
                                                type="password"
                                                defaultValue={this.state.confirmPass}
                                                onChange={e => this.setState({ confirmPass: e.target.value })}
                                                onKeyDown={e => {
                                                    if (e.keyCode === 13){
                                                        this.handleSubmit();
                                                    }
                                                }}
                                            />
                                            {this.state.confirmPassState === "has-danger" ? (
                                                <label className="error">
                                                    Please enter the not empty and same values.
                                                </label>
                                            ) : null}
                                        </InputGroup>
                                        <Button
                                            color="primary"
                                            href="#"
                                            block
                                            onClick={this.handleSubmit}
                                        >
                                            Change Password
                                        </Button>
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

export default ChangePassword;
