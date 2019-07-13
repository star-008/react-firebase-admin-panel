import React from "react";
import LoadingOverlay from "react-loading-overlay";
import Firebase from "firebase";
import NotificationAlert from "react-notification-alert";
import config from '../../../config';

import {
    Col,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Button,
    Form,
    FormGroup,
    Input
} from "reactstrap";

class SubLocationAddRequestQuotation extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            name: '',
            email: '',
            contact: '',
            detail: '',
            receiver_email: '',
            thank_message: '',

            nameState: '',
            emailState: '',
            contactState: '',
            detailState: ''
        };
    }
    componentWillMount() {
        let _this = this;
        _this.setState({loading: true});
        Firebase.firestore().collection('System_Config').doc('Custom_Requirement_Request').get().then(function (response) {
            if (response.exists) {
                _this.setState({receiver_email: response.data().Email});
                _this.setState({thank_message: response.data().Customer_Message});
                _this.setState({loading: false});
            } else {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Network Error.");
            }
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network Error.");
        });
    }
    handleSend() {
        if (this.state.nameState === "") {
            this.setState({ nameState: "has-danger" });
        }
        if (this.state.emailState === "") {
            this.setState({ emailState: "has-danger" });
        }
        if (this.state.contactState === "") {
            this.setState({ contactState: "has-danger" });
        }
        if (this.state.detailState === "") {
            this.setState({ detailState: "has-danger" });
        }

        if (this.state.nameState === "has-success" && this.state.emailState === "has-success"
            && this.state.contactState === "has-success" && this.state.detailState === "has-success") {
            let _this = this;
            _this.setState({loading: true});
            let text = "Name : " + this.state.name + "<br/>" + "Email : " + this.state.email + "<br/>"
                + "Contact : " + this.state.contact + "<br/>" + "Detail : " + this.state.detail;

            Firebase.functions().httpsCallable('sendMail')({email: this.state.receiver_email, subject: 'Request for quotation.', text: text}).then(function(result) {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 2, _this.state.thank_message);
                window.setTimeout(function() { _this.props.history.goBack() }, 2000);
            }).catch(function (err) {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Network Error.");
            });
        }
    }
    verifyEmail = value => {
        var emailRex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return emailRex.test(value);
    };
    verifyLength = (value, length) => {
        return value.length >= length;
    };
    change = (event, stateName, type, stateNameEqualTo) => {
        switch (type) {
            case "email":
                if (this.verifyEmail(event.target.value)) {
                    this.setState({ [stateName + "State"]: "has-success" });
                } else {
                    this.setState({ [stateName + "State"]: "has-danger" });
                }
                break;
            case "length":
                if (this.verifyLength(event.target.value, stateNameEqualTo)) {
                    this.setState({ [stateName + "State"]: "has-success" });
                } else {
                    this.setState({ [stateName + "State"]: "has-danger" });
                }
                break;
            default:
                break;
        }
        this.setState({ [stateName]: event.target.value });
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
    render() {
        let {
            nameState,
            emailState,
            contactState,
            detailState
        } = this.state;
        return (
            <>
                <LoadingOverlay
                  active={this.state.loading}
                  spinner
                  text='Loading'
                  className='content'
                >
                    <NotificationAlert ref="notificationAlert" />
                    <Row>
                        <Col md="12">
                            <Card className="full-size">
                                <CardHeader>
                                    <CardTitle tag="h4">SubLocation Add / Request for Quotation</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    <Col className="ml-auto mr-auto" lg="8">
                                        <Row>
                                            <Col md="3">
                                                <Button
                                                    color="primary"
                                                    onClick={e => this.handleSend()}
                                                    block
                                                >
                                                    Send
                                                </Button>
                                            </Col>
                                            <Col md="3">
                                                <Button
                                                    color="youtube"
                                                    onClick={e => this.props.history.goBack()}
                                                    block
                                                >
                                                    Close
                                                </Button>
                                            </Col>
                                        </Row>
                                        <Row className="top-margin-10"/>
                                        <Row>
                                            <Col md="8">
                                                <Form>
                                                    <FormGroup className={`has-label ${nameState}`}>
                                                        <label>Name</label>
                                                        <Input
                                                            type="text"
                                                            onChange={e =>
                                                                this.change(e, "name", "length", 1)
                                                            }
                                                        />
                                                        {this.state.nameState === "has-danger" ? (
                                                            <label className="error">This field is required.</label>
                                                        ) : null}
                                                    </FormGroup>
                                                    <FormGroup className={`has-label ${emailState}`}>
                                                        <label>Email Address *</label>
                                                        <Input
                                                            name="email"
                                                            type="email"
                                                            onChange={e => this.change(e, "email", "email")}
                                                        />
                                                        {this.state.emailState === "has-danger" ? (
                                                            <label className="error">
                                                                Please enter a valid email address.
                                                            </label>
                                                        ) : null}
                                                    </FormGroup>
                                                    <FormGroup className={`has-label ${contactState}`}>
                                                        <label>Contact</label>
                                                        <Input
                                                            type="text"
                                                            onChange={e =>
                                                                this.change(e, "contact", "length", 1)
                                                            }
                                                        />
                                                        {this.state.contactState === "has-danger" ? (
                                                            <label className="error">This field is required.</label>
                                                        ) : null}
                                                    </FormGroup>
                                                </Form>
                                            </Col>
                                            <Col md="12">
                                                <Form>
                                                    <FormGroup className={`has-label ${detailState}`}>
                                                        <label>Details</label>
                                                        <Input
                                                            type="textarea"
                                                            rows="14"
                                                            onChange={e =>
                                                                this.change(e, "detail", "length", 1)
                                                            }
                                                        />
                                                        {this.state.detailState === "has-danger" ? (
                                                            <label className="error">This field is required.</label>
                                                        ) : null}
                                                    </FormGroup>
                                                </Form>
                                            </Col>
                                        </Row>
                                    </Col>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </LoadingOverlay>
            </>
        );
    }
}

export default SubLocationAddRequestQuotation;
