import React from "react";
import Select from "react-select";
import PasswordHash from 'password-hash';
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from "react-loading-overlay";
import Switch from "react-bootstrap-switch";
import Firebase from 'firebase';
import config from '../../../config';
import {roles} from "../../../utils/utils"

// reactstrap components
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    CardFooter,
    Button,
    FormGroup,
    InputGroup,
    Row,
    Col,
    Input,
    InputGroupAddon,
    InputGroupText,
    Form,
    Collapse,
    Label
} from "reactstrap";

class UserEdit extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            roles: [],
            locations: [],

            name: '',
            email: '',
            past_email: '',
            designation: '',
            role: '',
            access_locations: [],
            activated: true,
            otp_enabled: true,

            openedCollapses: [],

            nameState: 'has-success',
            emailState: 'has-success'
        };

        this.handleChange = this.handleChange.bind(this);
        this.getLocations = this.getLocations.bind(this);
        this.loadLocations = this.loadLocations.bind(this);
        this.notifyMessage = this.notifyMessage.bind(this);
        this.loadData = this.loadData.bind(this);
        this.handleReset = this.handleReset.bind(this);
    }
    componentWillMount() {
        this.setState({loading: true});
        var id = this.props.match.params.id;
        var customer_role = JSON.parse(localStorage.getItem('auth_info')).role;
        var role_list = [];
        if (customer_role === "Site_Admin") {
            roles.forEach(function (role) {
                if (role.value !== "Site_Admin")
                    role_list.push(role);
            });

            this.setState({roles: role_list});
        } else {
            roles.forEach(function (role) {
                if (role.value !== "Site_Admin" && role.value !== "System_Admin" && role.value !== "Location_Admin")
                    role_list.push(role);
            });

            this.setState({roles: role_list});
        }
        this.loadLocations();
        this.loadData(id);
    }
    loadLocations() {
        var _this = this;
        var customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;
        var location_list = [];
        Firebase.firestore().collection('Main_Locations').where('Customer_ID', '==', customer_id).get().then(function (locations) {
            locations.docs.forEach(function (location) {
                var one = {
                    name: location.data().Name,
                    sub_locations: []
                };
                Firebase.firestore().collection('Sub_Locations').where('Main_Location_ID', '==', location.id).get().then(function (sub_locations) {
                    sub_locations.docs.forEach(function (sub_location) {
                        var one_sub = {
                            name: sub_location.data().Name,
                            id: sub_location.id
                        };
                        one.sub_locations.push(one_sub);
                    });
                    location_list.push(one);
                    _this.setState({locations: location_list});
                }).catch(function (err) {
                    console.log(err);
                });

            });
        }).catch(function (err) {
            console.log(err);
        });
    }
    loadData(id) {
        var _this = this;
        Firebase.firestore().collection('Web_App_Users').doc(id).get().then(function (app_info) {
            if (app_info.exists) {
                _this.setState({activated: app_info.data().Activated});
                _this.setState({email: app_info.id});
                _this.setState({past_email: app_info.id});
                _this.setState({name: app_info.data().Name});
                _this.setState({designation: app_info.data().Designation});
                var role = '';
                var find = roles.filter(item=>item.value===app_info.data().Role);
                if (find.length > 0) {
                    role = {
                        label: find[0].name,
                        value: find[0].value
                    };
                }

                _this.setState({role: role});
                _this.setState({access_locations: app_info.data().Accessible_Locations});
                _this.setState({otp_enabled: app_info.data().OTP_Enabled});
                _this.setState({loading: false});
            } else {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "NetWork Error.");
            }
        }).catch(function (error) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "NetWork Error.");
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
    collapsesToggle = collapse => {
        let openedCollapses = this.state.openedCollapses;
        if (openedCollapses.includes(collapse)) {
            this.setState({
                openedCollapses: openedCollapses.filter(item => item !== collapse)
            });
        } else {
            openedCollapses.push(collapse);
            this.setState({
                openedCollapses: openedCollapses
            });
        }
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
            case "name":
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
            case "location" :
                var access_locations = this.state.access_locations;
                if (event.target.checked === true) {
                    access_locations.push(stateName);
                    this.setState({access_locations: access_locations});
                } else {
                    var index = access_locations.indexOf(stateName);
                    if (index !== -1) access_locations.splice(index, 1);
                    this.setState({access_locations: access_locations});
                }
                break;
            default:
                break;
        }
        // this.setState({ [stateName]: event.target.value });
    };
    verifyEmail = value => {
        var emailRex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (emailRex.test(value)) {
            return true;
        }
        return false;
    };
    verifyLength = (value, length) => {
        if (value.length >= length) {
            return true;
        }
        return false;
    };
    handleSave = () => {
        if (this.state.nameState === "") {
            this.setState({ nameState: "has-danger" });
        }

        if (this.state.emailState === "") {
            this.setState({ emailState: "has-danger" });
        }
        var _this = this;
        if (this.state.nameState === "has-success" && this.state.nameState === "has-success") {
            _this.setState({loading: true});
            var now = new Date();
            var customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;

            var save_app_data = {
                Activated: _this.state.activated,
                Accessible_Locations: _this.state.access_locations,
                Designation: _this.state.designation,
                Last_Updated_Date: now,
                Last_Updated_User_ID: customer_id,
                Name: _this.state.name,
                OTP_Enabled: _this.state.otp_enabled,
                Role: _this.state.role.value
            };

            Firebase.firestore().collection('Web_App_Users').doc(_this.state.past_email).get().then(function (app_info) {
                if (app_info.exists) {
                    var otp_code = "";
                    if (_this.state.otp_enabled && app_info.data().OTP_Code === "")
                        otp_code = _this.generateId(6);
                    else if (_this.state.otp_enabled && app_info.data().OTP_Code !== "")
                        otp_code = app_info.data().OTP_Code;

                    if (app_info.data().Role === "System_Admin" || app_info.data().Role === "Location_Admin") {

                    }

                    save_app_data['OTP_Code'] = otp_code;
                    save_app_data['What_Sup'] = app_info.data().What_Sup;
                    save_app_data['Viber'] = app_info.data().Viber;
                    save_app_data['Telegram'] = app_info.data().Telegram;
                    save_app_data['Line'] = app_info.data().Line;
                    save_app_data['Image_Url'] = app_info.data().Image_Url;
                    save_app_data['Customer_ID'] = app_info.data().Customer_ID;
                    save_app_data['Created_Date'] = app_info.data().Created_Date;
                    save_app_data['Last_Activity_Date'] = app_info.data().Last_Activity_Date;
                    save_app_data['Password'] = app_info.data().Password;
                    save_app_data['Notification'] = app_info.data().Notification;
                    save_app_data['token'] = app_info.data().token;
                    save_app_data['Google_Token'] = app_info.data().Google_Token;
                    save_app_data['Facebook_Token'] = app_info.data().Facebook_Token;
                    Firebase.firestore().collection('Web_App_Users').doc(_this.state.past_email).delete().then(function (res) {
                        Firebase.firestore().collection('Web_App_Users').doc(_this.state.email.toLowerCase()).set(save_app_data)
                            .then(function() {
                                if (_this.state.otp_enabled && app_info.data().OTP_Code === "") {
                                    var text = "Your otp code has been set.<br/>" +
                                        "Otp code : <b>" + otp_code + "</b>";
                                    Firebase.functions().httpsCallable('sendMail')({email: _this.state.email.toLowerCase(), subject: 'New OTP Code', text: text}).then(function(error, result) {
                                        console.log(error, result);
                                    });
                                }
                                _this.setState({loading: false});
                                _this.notifyMessage("tc", 2, "Save user information success!");
                                window.setTimeout(function() { _this.props.history.push("/users") }, 2000);
                            }).catch(function (err) {
                            _this.setState({loading: false});
                                _this.notifyMessage("tc", 3, "NetWork Error.");
                            });
                    }).catch(function (err) {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "NetWork Error.");
                    });
                } else {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "NetWork Error.");
                }
            }).catch(function (error) {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "NetWork Error.");
            });
        }
    }
    getLocations() {
        var _this = this;
        return this.state.locations.map((prop, toggle_key) => {
            return (
                <div key={toggle_key}>
                    <a href="#" className="custom-nav"><i className={this.state.openedCollapses.includes(toggle_key)?"nc-icon nc-minimal-up":"nc-icon nc-minimal-down"}/></a>
                    <a
                        aria-expanded={this.state.openedCollapses.includes(
                            toggle_key
                        )}
                        href="#"
                        data-parent="#accordion"
                        data-toggle="collapse"
                        onClick={() => this.collapsesToggle(toggle_key)}
                    >
                        {prop.name}
                    </a>
                    <Collapse
                        role="tabpanel"
                        isOpen={this.state.openedCollapses.includes(
                            toggle_key
                        )}
                    >
                        {prop.sub_locations.map((prop, key) => {
                            return (
                                <Label key={key} className="custom-nav-left">
                                    <Input
                                        name={prop.id}
                                        type="checkbox"
                                        checked={
                                            _this.state.access_locations.filter(item => item === prop.id).length > 0
                                        }
                                        onChange={e => this.handleChange(e, prop.id, "location")}
                                    />
                                    <span className="form-check-sign" />
                                    {prop.name}
                                </Label>
                            );
                        })}
                    </Collapse>
                </div>
            );
        });
    }
    handleReset() {
        var _this = this;
        var pass =  _this.generatePass(8);
        var save_data = {
            Password: PasswordHash.generate(pass)
        };
        var text = "Your password : <b>" + pass + "</b>";
        Firebase.firestore().collection('Web_App_Users').doc(_this.state.past_email).update(save_data)
            .then(function() {
                Firebase.functions().httpsCallable('sendMail')({email: _this.state.past_email, subject: 'Password Reset', text: text}).then(function(result) {
                    _this.notifyMessage("tc", 2, "User password has been reset.");
                });
            })
            .catch(function(error) {
                console.error("Error writing document: ", error);
                _this.notifyMessage("tc", 3, "User password reset error!");
            });
    }
    generateId(length) {
        var result           = '';
        var characters       = '0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
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
            // register form
            nameState,
            emailState
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
                    <div className="content">
                        <Row>
                            <Col md="12">
                                <Card className="full-height-page">
                                    <CardHeader>
                                        <CardTitle tag="h4">User Edit</CardTitle>
                                    </CardHeader>
                                    <CardHeader>
                                    </CardHeader>
                                    <CardBody>
                                        <Form action="#" method="#">
                                            <Col className="ml-auto mr-auto" lg="8">
                                                <div className="row">
                                                    <div className="col-md-7">
                                                        <div className="row">
                                                            <div className="col-md-3">
                                                                <Button
                                                                    color="success"
                                                                    onClick={this.handleSave}
                                                                    block
                                                                >
                                                                    Save
                                                                </Button>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <Button
                                                                    color="youtube"
                                                                    onClick={e => this.props.history.push("/users")}
                                                                    block
                                                                >
                                                                    Close
                                                                </Button>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <Button
                                                                    color="warning"
                                                                    href="#"
                                                                    onClick={this.handleReset}
                                                                    block
                                                                >
                                                                    Reset Password
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span>Name</span>
                                                            <InputGroup className={`has-label ${nameState}`}>
                                                                <InputGroupAddon addonType="prepend">
                                                                    <InputGroupText>
                                                                        <i className="nc-icon nc-single-02" />
                                                                    </InputGroupText>
                                                                </InputGroupAddon>
                                                                <Input
                                                                    placeholder="User Name"
                                                                    defaultValue={this.state.name}
                                                                    type="text"
                                                                    name="name"
                                                                    onChange={e => this.handleChange(e, "name", "name")}
                                                                />
                                                                {this.state.nameState === "has-danger" ? (
                                                                    <label className="error">This field is required.</label>
                                                                ) : null}
                                                            </InputGroup>
                                                        </div>
                                                        <div>
                                                            <span>Email Address</span>
                                                            <InputGroup className={`has-label ${emailState}`}>
                                                                <InputGroupAddon addonType="prepend">
                                                                    <InputGroupText>
                                                                        <i className="nc-icon nc-single-02" />
                                                                    </InputGroupText>
                                                                </InputGroupAddon>
                                                                <Input
                                                                    placeholder="Email Address"
                                                                    defaultValue={this.state.email}
                                                                    type="email"
                                                                    name="email"
                                                                    onChange={e => this.handleChange(e, "email", "email")}
                                                                />
                                                                {this.state.emailState === "has-danger" ? (
                                                                    <label className="error">
                                                                        Please enter a valid email address.
                                                                    </label>
                                                                ) : null}
                                                            </InputGroup>
                                                        </div>
                                                        <div>
                                                            <span>Designation</span>
                                                            <InputGroup>
                                                                <InputGroupAddon addonType="prepend">
                                                                    <InputGroupText>
                                                                        <i className="nc-icon nc-single-02" />
                                                                    </InputGroupText>
                                                                </InputGroupAddon>
                                                                <Input
                                                                    placeholder="Designation"
                                                                    defaultValue={this.state.designation}
                                                                    type="text"
                                                                    name="designation"
                                                                    onChange={e =>this.setState({ designation: e.target.value })}
                                                                />
                                                            </InputGroup>
                                                        </div>
                                                        <div>
                                                            <span>Role</span>
                                                            <Select
                                                                className="react-select info"
                                                                classNamePrefix="react-select"
                                                                placeholder="Select Role"
                                                                name="role"
                                                                defaultValue={this.state.role}
                                                                value={this.state.role}
                                                                onChange={value =>
                                                                    this.setState({ role: value })
                                                                }
                                                                options={
                                                                    this.state.roles.map(function (val) {
                                                                        return { value: val.value, label: val.name };
                                                                    })
                                                                }
                                                            />
                                                        </div>
                                                        <br/>
                                                        <div>
                                                            <span>Select Accessible Locations</span>
                                                            <div className="blockquote">
                                                                <div
                                                                    aria-multiselectable={true}
                                                                    className="card-collapse col-md-6"
                                                                    id="accordion"
                                                                    role="tablist"
                                                                >
                                                                    {this.getLocations()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-5 text-md-center top-margin-section">
                                                        <Row>
                                                            <Col md="2">
                                                            </Col>
                                                            <Col md="4">
                                                                <span>User Enabled</span>
                                                            </Col>
                                                            <Col md="4">
                                                                <FormGroup>
                                                                    <Switch
                                                                        defaultValue={this.state.activated}
                                                                        value={this.state.activated}
                                                                        offColor="success"
                                                                        offText=""
                                                                        onColor="success"
                                                                        onText=""
                                                                        onChange={event => this.setState({activated: event.state.value})}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <Col md="2">
                                                            </Col>
                                                            <Col md="4">
                                                                <span>OTP Enabled</span>
                                                            </Col>
                                                            <Col md="4">
                                                                <FormGroup>
                                                                    <Switch
                                                                        defaultValue={this.state.otp_enabled}
                                                                        value={this.state.otp_enabled}
                                                                        offColor="success"
                                                                        offText=""
                                                                        onColor="success"
                                                                        onText=""
                                                                        onChange={event => this.setState({otp_enabled: event.state.value})}
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Form>
                                    </CardBody>
                                    <CardFooter>
                                    </CardFooter>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </LoadingOverlay>
            </>
        );
    }
}

export default UserEdit;