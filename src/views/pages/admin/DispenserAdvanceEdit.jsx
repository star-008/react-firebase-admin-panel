import React from "react";
import NotificationAlert from "react-notification-alert";
import Firebase from "firebase";
import LoadingOverlay from "react-loading-overlay";
import CopyToClipboard from "react-copy-to-clipboard";
import Select from "react-select";
import Switch from "react-bootstrap-switch";
import IconUpload from "../../../components/CustomUpload/IconUpload";

import {
    Col,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Label,
    Button,
    Input,
    Form,
    FormGroup
} from "reactstrap";
import config from "../../../config";

class DispenserAdvanceEdit extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            customer_id: '',
            max_height: 0,
            max_width: 0,
            sub_location_id: '',
            current_time: '',

            show_location_icon: true,
            footer_text: '',
            button_layout_format: 'full',
            enable_print_logo: true,
            print_logo_image_url: '',
            print_type: null,
            print_type_list: [
                {
                    value: 'normal',
                    label: 'Normal Thermal Printer'
                },
                {
                    value: 'v001',
                    label: 'Standard Dispenser V001'
                }
            ],

            dispenser_id: '',
            dispenser_name: '',
            dispenser_nameState: 'has-success',
            height: 0,
            width: 0,
            invalid_height: false,
            invalid_width: false,
            pin: '',
            pinState: 'has-success',
            pin_type: 'password',
            location_image_url: '',
            location_name: '',
            location_address: '',
            service_list: []
        };
    }
    componentWillMount() {
        let id = this.props.match.params.id;
        if (id !== "" && id !== null && id !== undefined) {
            this.setState({dispenser_id: id});
            this.loadData(id);
        }
    }
    componentDidMount() {
        this.getCurrentTime();
    }
    loadData(id) {
        let _this = this;
        _this.setState({loading: true});
        // ---------- Load Max Height and Width ---------- //
        Firebase.firestore().collection('System_Config').doc('Dispensor_Settings').get().then(function (dispenser_setting) {
            if (dispenser_setting.exists) {
                _this.setState({max_height: dispenser_setting.data().Dispensor_Max_Height});
                _this.setState({max_width: dispenser_setting.data().Dispensor_Max_Width});
                // ---------- Load Dispenser Data ---------- //
                Firebase.firestore().collection('Dispensers').doc(id).get().then(function (doc) {
                    if (doc.exists) {
                        _this.setState({sub_location_id: doc.data().Sub_Location_ID});
                        _this.setState({show_location_icon: doc.data().Show_Location_Icon});
                        _this.setState({footer_text: doc.data().Footer_Text});
                        _this.setState({button_layout_format: doc.data().Button_Layout_Format});
                        _this.setState({enable_print_logo: doc.data().Enable_Print_Logo});
                        _this.setState({print_logo_image_url: doc.data().Print_Logo_Image_Url});
                        _this.refs.printLogo.handleSetUrl(_this.state.print_logo_image_url);
                        let one = _this.state.print_type_list.find(item => item.value === doc.data().Print_Type);
                        _this.setState({print_type: one});
                        _this.setState({dispenser_name: doc.data().Name});
                        _this.setState({height: doc.data().Layout_Height});
                        _this.setState({width: doc.data().Layout_Width});
                        _this.setState({pin: doc.data().Pin});
                        // ---------- Load Sub Location Data ---------- //
                        Firebase.firestore().collection('Sub_Locations').doc(doc.data().Sub_Location_ID).get().then(function (sub_location) {
                            if (sub_location.exists) {
                                _this.setState({ location_image_url : sub_location.data().Icon });
                                _this.setState({ location_name : sub_location.data().Name });
                                _this.setState({ location_address : sub_location.data().Address });
                                _this.loadServiceListBySub(doc.data().Sub_Location_ID);
                            } else {
                                _this.setState({loading: false});
                                _this.notifyMessage("tc", 3, "Network error!");
                            }
                        }).catch(function (err) {
                            _this.setState({loading: false});
                            _this.notifyMessage("tc", 3, "Network error!");
                        });
                    } else {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "Network error!");
                    }
                }).catch(function (err) {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Network error!");
                });
            } else {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Network error!");
            }
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    loadServiceListBySub(sub_id) {
        let _this = this;
        _this.setState({loading: true});
        let services = [];
        Firebase.firestore().collection('Services').where('Sub_Location_ID', '==', sub_id).get().then(function (response) {
            response.docs.forEach(function (doc) {
                services.push({service_id: doc.id, service_name: doc.data().Name, service_details: doc.data().Details});
            });

            _this.setState({service_list: services});
            _this.setState({loading: false});
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
    getCurrentTime() {
        let _this = this;
        let now = new Date();
        _this.setState({current_time: now.toLocaleString()});
        window.setTimeout(function() { _this.getCurrentTime() }, 500);
    }
    handleSave() {
        if (this.state.dispenser_nameState === "") {
            this.setState({ dispenser_nameState: "has-danger" });
        }

        if (this.state.pinState === "") {
            this.setState({ pinState: "has-danger" });
        }

        if (this.state.dispenser_nameState === "has-success" && this.state.pinState === "has-success" && !this.state.invalid_height && !this.state.invalid_width) {
            let _this = this;

            let now = new Date();
            _this.setState({loading: true});

            if (_this.state.enable_print_logo) {
                if (_this.state.print_logo_image_url === '') {
                    let file = this.refs.printLogo.state.file;
                    if (file !== null) {
                        var storageRef = Firebase.storage().ref();
                        var image_name = "dispenser_print_logo_" + _this.state.dispenser_id;
                        var subLocationRef = storageRef.child(image_name);
                        subLocationRef.put(file).then(function (snapshot) {
                            subLocationRef.getDownloadURL().then(function (res) {
                                let update_dispenser_data = {
                                    Show_Location_Icon: _this.state.show_location_icon,
                                    Footer_Text: _this.state.footer_text,
                                    Button_Layout_Format: _this.state.button_layout_format,
                                    Enable_Print_Logo: _this.state.enable_print_logo,
                                    Print_Logo_Image_Url: res,
                                    Print_Type: _this.state.print_type.value,
                                    Name: _this.state.dispenser_name,
                                    Layout_Height: _this.state.height,
                                    Layout_Width: _this.state.width,
                                    Pin: parseInt(_this.state.pin),
                                    Updated_Date: now
                                };

                                Firebase.firestore().collection('Dispensers').doc(_this.state.dispenser_id).update(update_dispenser_data).then(function() {
                                    _this.setState({loading: false});
                                    _this.notifyMessage("tc", 2, "Save Dispenser Success!");
                                    window.setTimeout(function() { _this.props.history.push("/dispensers") }, 2000);
                                }).catch(function (error) {
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
                    } else {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "You must upload the print logo image.");
                    }
                } else {
                    let update_dispenser_data = {
                        Show_Location_Icon: _this.state.show_location_icon,
                        Footer_Text: _this.state.footer_text,
                        Button_Layout_Format: _this.state.button_layout_format,
                        Enable_Print_Logo: _this.state.enable_print_logo,
                        Print_Type: _this.state.print_type.value,
                        Name: _this.state.dispenser_name,
                        Layout_Height: _this.state.height,
                        Layout_Width: _this.state.width,
                        Pin: parseInt(_this.state.pin),
                        Updated_Date: now
                    };

                    Firebase.firestore().collection('Dispensers').doc(_this.state.dispenser_id).update(update_dispenser_data).then(function() {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 2, "Save Dispenser Success!");
                        window.setTimeout(function() { _this.props.history.push("/dispensers") }, 2000);
                    }).catch(function (error) {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "Network error!");
                    });
                }
            } else {
                if (_this.state.print_logo_image_url !== '') {
                    let update_dispenser_data = {
                        Show_Location_Icon: _this.state.show_location_icon,
                        Footer_Text: _this.state.footer_text,
                        Button_Layout_Format: _this.state.button_layout_format,
                        Enable_Print_Logo: _this.state.enable_print_logo,
                        Print_Logo_Image_Url: '',
                        Print_Type: _this.state.print_type.value,
                        Name: _this.state.dispenser_name,
                        Layout_Height: _this.state.height,
                        Layout_Width: _this.state.width,
                        Pin: parseInt(_this.state.pin),
                        Updated_Date: now
                    };

                    Firebase.firestore().collection('Dispensers').doc(_this.state.dispenser_id).update(update_dispenser_data).then(function() {
                        let storageRef = Firebase.storage().ref();
                        let image_name = "dispenser_print_logo_" + _this.state.dispenser_id;
                        let customerRef = storageRef.child(image_name);
                        customerRef.delete().then(function () {
                            _this.setState({loading: false});
                            _this.notifyMessage("tc", 2, "Save Dispenser Success!");
                            window.setTimeout(function() { _this.props.history.push("/dispensers") }, 2000);
                        }).catch(function (err) {
                            _this.setState({loading: false});
                            _this.notifyMessage("tc", 3, "Network error!");
                        });
                    }).catch(function (error) {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "Network error!");
                    });
                } else {
                    let update_dispenser_data = {
                        Show_Location_Icon: _this.state.show_location_icon,
                        Footer_Text: _this.state.footer_text,
                        Button_Layout_Format: _this.state.button_layout_format,
                        Enable_Print_Logo: _this.state.enable_print_logo,
                        Print_Type: _this.state.print_type.value,
                        Name: _this.state.dispenser_name,
                        Layout_Height: _this.state.height,
                        Layout_Width: _this.state.width,
                        Pin: parseInt(_this.state.pin),
                        Updated_Date: now
                    };

                    Firebase.firestore().collection('Dispensers').doc(_this.state.dispenser_id).update(update_dispenser_data).then(function() {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 2, "Save Dispenser Success!");
                        window.setTimeout(function() { _this.props.history.push("/dispensers") }, 2000);
                    }).catch(function (error) {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "Network error!");
                    });
                }
            }
        }
    }
    change = (event, stateName, type, stateNameEqualTo) => {
        switch(type) {
            case "length":
                if (this.verifyLength(event.target.value, stateNameEqualTo)) {
                    this.setState({ [stateName + "State"]: "has-success" });
                } else {
                    this.setState({ [stateName + "State"]: "has-danger" });
                }

                this.setState({ [stateName]: event.target.value });
                break;
            case 'pin':
                if (this.verifyLength(event.target.value, stateNameEqualTo) && this.verifyNumber(event.target.value)) {
                    this.setState({ [stateName + "State"]: "has-success" });
                } else {
                    this.setState({ [stateName + "State"]: "has-danger" });
                }

                if (this.verifyNumber(event.target.value) || event.target.value.length===0) {
                    this.setState({[stateName]: event.target.value});
                }

                break;
            default:
                break;
        }
    };
    getServices() {
        let format = this.state.button_layout_format;
        return this.state.service_list.map(function (prop, key) {
            return (
                <div key={key} className={format==="full"?"col-lg-12 col-sm-12 col-xs-12":"col-lg-6 col-sm-6 col-xs-6" + " text-center"}>
                    <button className="btn btn-secondary text-capitalize btn-block" onClick={e => e.preventDefault()}>
                        <span className="overflow-ellipsis font-weight-bold fs-15">{prop.service_name}</span>
                        <br/>
                        <span className="overflow-ellipsis">{prop.service_details}</span>
                    </button>
                </div>
            );
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
    verifyLength = (value, length) => {
        return value.length >= length;
    };
    verifyNumber = value => {
        var numberRex = new RegExp("^[0-9]+$");
        if (numberRex.test(value)) {
            return true;
        }
        return false;
    };
    render() {
        let {
            dispenser_nameState,
            pinState
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
                            <Card>
                                <CardHeader>
                                    <CardTitle tag="h4">Dispenser Advance Edit</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    <Row>
                                        <Col lg="4" md="12" className="border-right">
                                            <Card className="border">
                                                <CardBody>
                                                    <Row>
                                                        <Col md="8" xs="8">
                                                            <h6>General Screen Settings</h6>
                                                        </Col>
                                                        <Col md="4" xs="4" className="text-right">
                                                            <Switch
                                                                className="left-margin-30"
                                                                defaultValue={this.state.show_location_icon}
                                                                value={this.state.show_location_icon}
                                                                offColor="success"
                                                                offText="OFF"
                                                                onColor="success"
                                                                onText="ON"
                                                                onChange={event => this.setState({show_location_icon: event.state.value})}
                                                            />
                                                        </Col>
                                                    </Row>
                                                </CardBody>
                                            </Card>
                                            <Card className="border">
                                                <CardBody>
                                                    <Row>
                                                        <Col lg="12" xs="12">
                                                            <h6>Selected Button Layout</h6>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label lg="2" xs="2"/>
                                                        <Col lg="4" xs="4">
                                                            <div className="form-check-radio">
                                                                <Label check className="left-margin-10">
                                                                    <Input
                                                                        checked={this.state.button_layout_format==='full'}
                                                                        name="buttonLayoutRadio"
                                                                        type="radio"
                                                                        onChange={e => {this.setState({button_layout_format: 'full'})}}
                                                                    />
                                                                    <span className="form-check-sign" />
                                                                </Label>
                                                            </div>
                                                        </Col>
                                                        <Label lg="1" xs="1"/>
                                                        <Col lg="4" xs="4">
                                                            <div className="form-check-radio">
                                                                <Label check className="left-margin-10">
                                                                    <Input
                                                                        checked={this.state.button_layout_format==='half'}
                                                                        name="buttonLayoutRadio"
                                                                        type="radio"
                                                                        onChange={e => {this.setState({button_layout_format: 'half'})}}
                                                                    />
                                                                    <span className="form-check-sign" />
                                                                </Label>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label lg="1" xs="1"/>
                                                        <Col lg="4" xs="4" className="padding-left-0">
                                                            <Button
                                                                color='secondary'
                                                                block
                                                            />
                                                        </Col>
                                                        <Label lg="1" xs="1"/>
                                                        <Col lg="2" xs="2" className="padding-left-0">
                                                            <Button
                                                                color='black'
                                                                block
                                                            />
                                                        </Col>
                                                        <Col lg="2" xs="2" className="padding-left-0">
                                                            <Button
                                                                color='black'
                                                                block
                                                            />
                                                        </Col>
                                                        <Label lg="2" xs="2"/>
                                                    </Row>
                                                    <Row>
                                                        <Label lg="1" xs="1"/>
                                                        <Col lg="4" xs="4" className="padding-left-0">
                                                            <Button
                                                                color='secondary'
                                                                block
                                                            />
                                                        </Col>
                                                        <Label lg="1" xs="1"/>
                                                        <Col lg="2" xs="2" className="padding-left-0">
                                                            <Button
                                                                color='black'
                                                                block
                                                            />
                                                        </Col>
                                                        <Col lg="2" xs="2" className="padding-left-0">
                                                            <Button
                                                                color='black'
                                                                block
                                                            />
                                                        </Col>
                                                        <Label lg="2" xs="2"/>
                                                    </Row>
                                                    <Row>
                                                        <Label lg="1" xs="1"/>
                                                        <Col lg="4" xs="4" className="padding-left-0">
                                                            <Button
                                                                color='secondary'
                                                                block
                                                            />
                                                        </Col>
                                                        <Label lg="1" xs="1"/>
                                                        <Col lg="2" xs="2" className="padding-left-0">
                                                            <Button
                                                                color='black'
                                                                block
                                                            />
                                                        </Col>
                                                        <Col lg="2" xs="2" className="padding-left-0">
                                                            <Button
                                                                color='black'
                                                                block
                                                            />
                                                        </Col>
                                                        <Label lg="2" xs="2"/>
                                                    </Row>
                                                </CardBody>
                                            </Card>
                                            <Card className="border">
                                                <CardBody>
                                                    <Row>
                                                        <Col lg="12">
                                                            <h6>Footer</h6>
                                                        </Col>
                                                        <Label lg="3" xs="3">Text</Label>
                                                        <Col lg="9" xs="9">
                                                            <FormGroup>
                                                                <Input
                                                                    value={this.state.footer_text}
                                                                    type="text"
                                                                    onChange={e => {this.setState({footer_text: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                </CardBody>
                                            </Card>
                                            <Card className="border">
                                                <CardBody>
                                                    <Row>
                                                        <Col lg="12">
                                                            <h6>Logo and Printer</h6>
                                                        </Col>
                                                        <Col md="8" xs="8" hidden={!this.state.enable_print_logo}>
                                                            <IconUpload ref="printLogo" />
                                                        </Col>
                                                        <Col md="8" xs="8" hidden={this.state.enable_print_logo}/>
                                                        <Col md="4" xs="4"className="text-right">
                                                            <Switch
                                                                className="left-margin-30"
                                                                defaultValue={this.state.enable_print_logo}
                                                                value={this.state.enable_print_logo}
                                                                offColor="success"
                                                                offText="OFF"
                                                                onColor="success"
                                                                onText="ON"
                                                                onChange={event => this.setState({enable_print_logo: event.state.value})}
                                                            />
                                                        </Col>
                                                        <Col lg="12" className="top-margin-10"/>
                                                        <Label lg="3" xs="3">Printer Type</Label>
                                                        <Col lg="9" xs="9">
                                                            <FormGroup>
                                                                <Select
                                                                    className="react-select info"
                                                                    classNamePrefix="react-select"
                                                                    placeholder="Select Print Type"
                                                                    name="selectPrintType"
                                                                    value={this.state.print_type}
                                                                    onChange={e =>
                                                                        this.setState({print_type: e})
                                                                    }
                                                                    options={this.state.print_type_list}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col lg="8" xs="12">
                                            <Card className="border">
                                                <CardBody>
                                                    <Row>
                                                        <Col lg="1" xs="1">
                                                        </Col>
                                                        <Col lg="2" xs="4">
                                                            <Button
                                                                color="success"
                                                                onClick={e => this.handleSave()}
                                                                block
                                                            >
                                                                Save
                                                            </Button>
                                                        </Col>
                                                        <Col lg="2" xs="4">
                                                            <Button
                                                                color="youtube"
                                                                onClick={e => this.props.history.push("/dispensers")}
                                                                block
                                                            >
                                                                Close
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                    <Form className="form-horizontal">
                                                        <Row className="top-margin-10">
                                                            <Label lg="4" xs="3">Dispenser ID</Label>
                                                            <Col lg="8" xs="9">
                                                                <FormGroup>
                                                                    <Row>
                                                                        <Col lg="8" xs="8">
                                                                            <Input
                                                                                value={this.state.dispenser_id}
                                                                                disabled
                                                                            />
                                                                        </Col>
                                                                        <Col lg="2" xs="3">
                                                                            <CopyToClipboard
                                                                                text={this.state.dispenser_id}
                                                                                onCopy={e => this.notifyMessage("tc", 2, "Copied to clipboard")}
                                                                            >
                                                                                <Button className="margin-0 btn btn-primary text-capitalize" block>Copy</Button>
                                                                            </CopyToClipboard>
                                                                        </Col>
                                                                    </Row>
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <Label lg="4" xs="3">Dispenser Name</Label>
                                                            <Col lg="8" xs="9">
                                                                <FormGroup className={`has-label ${dispenser_nameState}`}>
                                                                    <Row>
                                                                        <Col lg="12" xs="12">
                                                                            <Input
                                                                                value={this.state.dispenser_name}
                                                                                type="text"
                                                                                onChange={e => this.change(e, "dispenser_name", "length", 1)}
                                                                            />
                                                                        </Col>
                                                                        {this.state.dispenser_nameState === "has-danger" ? (
                                                                            <label className="error">This field is required.</label>
                                                                        ) : null}
                                                                    </Row>
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <Label lg="4" xs="3">Screen Size(pixels)</Label>
                                                            <Label lg="1" xs="1">Height</Label>
                                                            <Col lg="2" xs="2">
                                                                <FormGroup>
                                                                    <Input
                                                                        value={this.state.height}
                                                                        type="number"
                                                                        min={0}
                                                                        max={this.state.max_height}
                                                                        invalid={this.state.invalid_height}
                                                                        onChange={e =>
                                                                        {
                                                                            if (e.target.value > this.state.max_height)
                                                                                this.setState({invalid_height: true});
                                                                            else
                                                                                this.setState({invalid_height: false});

                                                                            this.setState({height: e.target.value===''?0:parseInt(e.target.value)})
                                                                        }
                                                                        }
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                            <Label lg="1" xs="1">Width</Label>
                                                            <Col lg="2" xs="2">
                                                                <FormGroup>
                                                                    <Input
                                                                        value={this.state.width}
                                                                        type="number"
                                                                        min={0}
                                                                        max={this.state.max_width}
                                                                        invalid={this.state.invalid_width}
                                                                        onChange={e =>
                                                                        {
                                                                            if (e.target.value > this.state.max_width)
                                                                                this.setState({invalid_width: true});
                                                                            else
                                                                                this.setState({invalid_width: false});

                                                                            this.setState({width: e.target.value===''?0:parseInt(e.target.value)})
                                                                        }
                                                                        }
                                                                    />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <Label lg="4" xs="3">Unlock Pin</Label>
                                                            <Col lg="8" xs="9">
                                                                <FormGroup className={`has-label ${pinState}`}>
                                                                    <Row>
                                                                        <Col lg="3" xs="4">
                                                                            <Input
                                                                                value={this.state.pin}
                                                                                type={this.state.pin_type}
                                                                                maxLength={4}
                                                                                onChange={e => this.change(e, "pin", "pin", 4)}
                                                                            />
                                                                        </Col>
                                                                        <Col lg="2" xs="3">
                                                                            <Button
                                                                                className="margin-0 btn btn-info text-capitalize"
                                                                                onClick={e =>
                                                                                    this.state.pin_type==='password'?this.setState({pin_type: 'text'}):this.setState({pin_type: 'password'})
                                                                                }
                                                                                block
                                                                            >
                                                                                Show
                                                                            </Button>
                                                                        </Col>
                                                                        <Col lg="7" xs="5"/>
                                                                        {this.state.pinState === "has-danger" ? (
                                                                            <label className="error">this field is required to 4 digit number.</label>
                                                                        ) : null}
                                                                    </Row>
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                        <Row>
                                                            <Col lg="2" xs="2"/>
                                                            <Col lg="8" xs="8">
                                                                <div className="border card">
                                                                    <div style={{paddingBottom: '174%'}}>
                                                                        <div className="padding-10 fixed-div">
                                                                            <div className="row">
                                                                                <div className="col-lg-12 col-xs-12 text-center">
                                                                                    <img src={this.state.location_image_url} alt="..." className="width-20" />
                                                                                </div>
                                                                                <div className="col-lg-12 col-xs-12 text-center top-margin-12">
                                                                                    <h5>{this.state.location_name}</h5>
                                                                                    <label>{this.state.location_address}</label>
                                                                                </div>
                                                                                <div className="col-lg-12 col-xs-12">
                                                                                    <hr/>
                                                                                </div>
                                                                                {this.getServices()}
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-lg-12 col-xs-12 custom-footer-2">
                                                                            <button className="btn btn-block btn-lg text-center" disabled>
                                                                                <span className="text-capitalize">{this.state.current_time}</span>
                                                                            </button>
                                                                        </div>
                                                                        <div className="col-lg-12 col-xs-12 custom-footer-1">
                                                                            <button className="btn btn-block btn-lg text-center" disabled>
                                                                                <span className="text-capitalize">{this.state.footer_text===""?'\u00A0':this.state.footer_text}</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </LoadingOverlay>
            </>
        );
    }
}

export default DispenserAdvanceEdit;
