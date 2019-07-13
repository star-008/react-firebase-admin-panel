import React from "react";
import LoadingOverlay from "react-loading-overlay";
import Firebase from "firebase";
import NotificationAlert from "react-notification-alert";
import Switch from "react-bootstrap-switch";
import config from "../../../config";
import IconUpload from "../../../components/CustomUpload/IconUpload";

import {
    Col,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Collapse,
    Row,
    Button,
    Form,
    FormGroup,
    Label,
    Input
} from "reactstrap";

class MainLocationEdit extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            id: '',
            icon_max_limit: 0,

            main_location_key: '',
            name: '',
            icon: '',
            remark: '',
            enable_mobile: false,
            active: false,
            nameState: 'has-success',

            openedCollapses: [],
            created_date_time: '',
            stop_date_time: '',
            sub_location_cnt: '',
            customer_id: '',
            customer_name: ''
        };
    }
    componentWillMount() {
        let id = this.props.match.params.id;
        if (id !== "" && id !== null && id !== undefined) {
            this.setState({id: id});
            this.loadMainLocationData(id);
        }
    }
    loadMainLocationData(id) {
        let _this = this;
        _this.setState({loading: true});
        // ---------- Load Icon Max Size ---------- //
        Firebase.firestore().collection('System_Config').doc('Upload_Limits').get().then(function (upload_limit_info) {
            if (upload_limit_info.exists) {
                _this.setState({icon_max_limit: upload_limit_info.data().Max_Icon_size_in_MB});
                // ---------- Load Main Location Info ---------- //
                Firebase.firestore().collection('Main_Locations').doc(id).get().then(function (main_location_data) {
                    if (main_location_data.exists) {
                        _this.setState({main_location_key: main_location_data.id});
                        _this.setState({name: main_location_data.data().Name});
                        _this.setState({icon: main_location_data.data().Icon});
                        _this.refs.icon.handleSetUrl(_this.state.icon);
                        _this.setState({remark: main_location_data.data().Remarks});
                        _this.setState({enable_mobile: main_location_data.data().Show_On_Mobile_App});
                        _this.setState({active: main_location_data.data().Status});
                        _this.setState({created_date_time: main_location_data.data().Created_Date});
                        _this.setState({stop_date_time: main_location_data.data().Stop_Date});
                        _this.setState({sub_location_cnt: main_location_data.data().Sub_Locations_Count});
                        _this.setState({customer_id: main_location_data.data().Customer_ID});
                        _this.setState({customer_name: main_location_data.data().Customer_Name});
                        _this.setState({loading: false});
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
    handleSave() {
        if (this.state.nameState === "") {
            this.setState({ nameState: "has-danger" });
        }

        if (this.state.nameState === "has-success") {
            let _this = this;
            _this.setState({loading: true});
            var now = new Date();
            let file = this.refs.icon.state.file;
            if (file !== null) {
                // --------- Check Max Icon Size Limit --------- //
                let max_bytes = _this.state.icon_max_limit * 1024 * 1024;
                if (file.size > max_bytes) {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Icon file size exceeds maximum size.");
                } else {
                    var storageRef = Firebase.storage().ref();
                    var image_name = "main_location_icon_" + this.state.main_location_key;
                    var mainLocationRef = storageRef.child(image_name);
                    mainLocationRef.put(file).then(function (snapshot) {
                        mainLocationRef.getDownloadURL().then(function (res) {
                            let update_main_location_data = {
                                Icon: res,
                                Name: _this.state.name,
                                Remarks: _this.state.remark,
                                Show_On_Mobile_App: _this.state.enable_mobile,
                                Status: _this.state.active
                            };

                            Firebase.firestore().collection('Main_Locations').doc(_this.state.main_location_key).update(update_main_location_data)
                                .then(function() {
                                    _this.setState({loading: false});
                                    window.setTimeout(function() { _this.props.history.push("/locations") }, 2000);
                                    _this.notifyMessage("tc", 2, "Save Main Location Success!");
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
                }
            } else {
                let update_main_location_data = {
                    Name: _this.state.name,
                    Remarks: _this.state.remark,
                    Show_On_Mobile_App: _this.state.enable_mobile,
                    Status: _this.state.active
                };

                Firebase.firestore().collection('Main_Locations').doc(_this.state.main_location_key).update(update_main_location_data)
                    .then(function() {
                        _this.setState({loading: false});
                        window.setTimeout(function() { _this.props.history.push("/locations") }, 2000);
                        _this.notifyMessage("tc", 2, "Save Main Location Success!");
                    }).catch(function (error) {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Network error!");
                });
            }
        }
    }
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
    change = (event, stateName, type, stateNameEqualTo) => {
        switch (type) {
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
    static getTimeString(time) {
        if (time === null || time === undefined)
            return "";

        if (time.seconds === null || time.seconds === undefined)
            return "";

        let date = new Date(time.seconds*1000);
        let time_string = date.toLocaleString();
        return time_string;
    };
    render() {
        let {
            nameState
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
                                    <CardTitle tag="h4">Main Location Add</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    <Col className="ml-auto mr-auto" lg="8">
                                        <Row>
                                            <Col md="3">
                                                <Button
                                                    color="success"
                                                    onClick={e => this.handleSave()}
                                                    block
                                                >
                                                    Save Changes
                                                </Button>
                                            </Col>
                                            <Col md="3">
                                                <Button
                                                    color="youtube"
                                                    onClick={e => this.props.history.push("/locations")}
                                                    block
                                                >
                                                    Close
                                                </Button>
                                            </Col>
                                        </Row>
                                        <Row className="top-margin-10">
                                        </Row>
                                        <Row>
                                            <Col md="8">
                                                <Form className="form-horizontal">
                                                    <Row>
                                                        <Label md="4">Main Location Key</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Input
                                                                    type="text"
                                                                    defaultValue={this.state.main_location_key}
                                                                    disabled
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Main Location Name</Label>
                                                        <Col md="8">
                                                            <FormGroup className={`has-label ${nameState}`}>
                                                                <Input
                                                                    defaultValue={this.state.name}
                                                                    type="text"
                                                                    onChange={e =>
                                                                        this.change(e, "name", "length", 1)
                                                                    }
                                                                />
                                                                {this.state.nameState === "has-danger" ? (
                                                                    <label className="error">This field is required.</label>
                                                                ) : null}
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Icon</Label>
                                                        <Col md="8">
                                                            <IconUpload ref="icon" />
                                                        </Col>
                                                    </Row>
                                                    <Row className="top-margin-10">
                                                        <Label md="4">Remarks</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Input
                                                                    value={this.state.remark}
                                                                    type="textarea"
                                                                    onChange={e => {this.setState({remark: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Enable on mobile app</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Row className="top-margin-7"/>
                                                                <Switch
                                                                    offColor="success"
                                                                    offText={<i className="nc-icon nc-simple-remove" />}
                                                                    onColor="success"
                                                                    onText={<i className="nc-icon nc-check-2" />}
                                                                    defaultValue={this.state.enable_mobile}
                                                                    value={this.state.enable_mobile}
                                                                    onChange={e => {this.setState({enable_mobile: e.state.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Inactive/Active</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Row className="top-margin-7"/>
                                                                <Switch
                                                                    offColor="success"
                                                                    offText={<i className="nc-icon nc-simple-remove" />}
                                                                    onColor="success"
                                                                    onText={<i className="nc-icon nc-check-2" />}
                                                                    defaultValue={this.state.active}
                                                                    value={this.state.active}
                                                                    onChange={e => {this.setState({active: e.state.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Card className="card-plain width-100">
                                                            <CardHeader role="tab">
                                                                <a
                                                                    aria-expanded={this.state.openedCollapses.includes(
                                                                        "show-more"
                                                                    )}
                                                                    href="#"
                                                                    data-parent="#accordion"
                                                                    data-toggle="collapse"
                                                                    onClick={e => {e.preventDefault(); this.collapsesToggle("show-more")}}
                                                                >
                                                                    Show More...{" "}
                                                                </a>
                                                            </CardHeader>
                                                            <Collapse
                                                                role="tabpanel"
                                                                isOpen={this.state.openedCollapses.includes(
                                                                    "show-more"
                                                                )}
                                                            >
                                                                <CardBody>
                                                                    <Row>
                                                                        <Label md="4">Created Datetime</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={MainLocationEdit.getTimeString(this.state.created_date_time)}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Stop Datetime</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={MainLocationEdit.getTimeString(this.state.stop_date_time)}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Sub Location Count</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    defaultValue={this.state.sub_location_cnt}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Customer ID</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    defaultValue={this.state.customer_id}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Customer Name</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    defaultValue={this.state.customer_name}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                </CardBody>
                                                            </Collapse>
                                                        </Card>
                                                    </Row>
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

export default MainLocationEdit;
