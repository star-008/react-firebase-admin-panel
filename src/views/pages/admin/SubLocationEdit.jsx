import React from "react";
import LoadingOverlay from "react-loading-overlay";
import Select from "react-select";
import Switch from "react-bootstrap-switch";
import Firebase from "firebase";
import NotificationAlert from "react-notification-alert";
import config from "../../../config";
import IconUpload from "../../../components/CustomUpload/IconUpload";
import CustomMap from "../../../components/CustomMap";
import info from "../../../info";


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

class SubLocationEdit extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            sub_location_id: '',
            customer_id: '',
            icon_max_limit: 0,
            map_zoom: 5,

            name: '',
            address: '',
            enable_mobile: false,
            active: false,
            package_id: '',
            package_name: '',
            time_zone: null,
            time_zone_list: [],
            position: null,
            remarks: '',
            nameState: 'has-success',

            openedCollapses: [],
            pending_count: '',
            created_date_time: '',
            stop_date_time: '',
            last_paid_date: '',
            notification_date: '',
            final_notification_date: '',
            next_payment_date: '',
            payment_due_date: ''
        };
    }
    componentWillMount() {
        let id = this.props.match.params.id;
        if (id !== "" && id !== null && id !== undefined) {
            this.setState({sub_location_id: id});
            this.loadSubLocationData(id);
        }
    }
    loadSubLocationData(id) {
        var _this = this;
        _this.setState({loading: true});
        // ---------- Start Load TimeZone List ---------- //
        var moment = require('moment-timezone');
        var timeZones = moment.tz.names();
        var offsetTmz=[];

        for(var i in timeZones)
        {
            offsetTmz.push("(UTC"+moment.tz(timeZones[i]).format('Z')+")" + timeZones[i]);
        }

        let sortTimezones = offsetTmz.sort().map(item => { return {'value': item, 'label': item}});
        _this.setState({time_zone_list: sortTimezones});
        // ---------- End Load TimeZone List ---------- //
        // ---------- Load Icon Max Size ---------- //
        Firebase.firestore().collection('System_Config').doc('Upload_Limits').get().then(function (upload_limit_info) {
            if (upload_limit_info.exists) {
                _this.setState({icon_max_limit: upload_limit_info.data().Max_Icon_size_in_MB});
                // ---------- Load Sub Location Info ---------- //
                Firebase.firestore().collection('Sub_Locations').doc(id).get().then(function (sub_location) {
                    if (sub_location.exists) {
                        _this.setState({address: sub_location.data().Address});
                        _this.setState({created_date_time: sub_location.data().Created_Date});
                        _this.setState({customer_id: sub_location.data().Customer_ID});
                        _this.setState({position: sub_location.data().Geolocation});
                        _this.setState({icon: sub_location.data().Icon});
                        _this.refs.icon.handleSetUrl(_this.state.icon);
                        _this.setState({name: sub_location.data().Name});
                        _this.setState({next_payment_date: sub_location.data().Next_Payment_Date});
                        _this.setState({last_paid_date: sub_location.data().Last_Paid_Date});
                        _this.setState({package_id: sub_location.data().Package_ID});
                        _this.setState({payment_due_date: sub_location.data().Payment_Due_Date});
                        _this.setState({pending_count: sub_location.data().Pending_Queue_Count});
                        _this.setState({remarks: sub_location.data().Remarks});
                        _this.setState({enable_mobile: sub_location.data().Show_On_Mobile_App});
                        _this.setState({active: sub_location.data().Status});
                        _this.setState({stop_date_time: sub_location.data().Stop_Date});
                        _this.setState({time_zone: {value:sub_location.data().TimeZone, label:sub_location.data().TimeZone}});
                        // -------- Get Package Name -------- //
                        Firebase.firestore().collection('Packages').doc(_this.state.package_id).get().then(function (package_info) {
                            if (package_info.exists) {
                                _this.setState({package_name: package_info.data().Name});
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
            } else {
                _this.setState({loading: false});
                _this.notifyMessage("tc", 3, "Network error!");
            }
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
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
    handleSave() {
        if (this.state.nameState === "") {
            this.setState({ nameState: "has-danger" });
        }

        if (this.state.nameState === "has-success") {
            let _this = this;
            _this.setState({loading: true});
            let file = this.refs.icon.state.file;
            if (file !== null) {
                // --------- Check Max Icon Size Limit --------- //
                let max_bytes = _this.state.icon_max_limit * 1024 * 1024;
                if (file.size > max_bytes) {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Icon file size exceeds maximum size.");
                } else {
                    var storageRef = Firebase.storage().ref();
                    var image_name = "sub_location_icon_" + this.state.sub_location_key;
                    var subLocationRef = storageRef.child(image_name);
                    subLocationRef.put(file).then(function (snapshot) {
                        subLocationRef.getDownloadURL().then(function (res) {
                            let update_sub_location_data = {
                                Address: _this.state.address,
                                // Geolocation: _this.state.position,
                                Icon: res,
                                Name: _this.state.name,
                                Remarks: _this.state.remarks,
                                Show_On_Mobile_App: _this.state.enable_mobile,
                                Status: _this.state.active,
                                TimeZone: _this.state.time_zone.value,
                                Geolocation: _this.state.position
                            };

                            Firebase.firestore().collection('Sub_Locations').doc(_this.state.sub_location_id).update(update_sub_location_data)
                                .then(function() {
                                    _this.setState({loading: false});
                                    _this.notifyMessage("tc", 2, "Save Sub Location Success!");
                                    window.setTimeout(function() { _this.props.history.push("/locations") }, 2000);
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
                let update_sub_location_data = {
                    Address: _this.state.address,
                    // Geolocation: _this.state.position,
                    Name: _this.state.name,
                    Remarks: _this.state.remarks,
                    Show_On_Mobile_App: _this.state.enable_mobile,
                    Status: _this.state.active,
                    TimeZone: _this.state.time_zone.value,
                    Geolocation: _this.state.position
                };

                Firebase.firestore().collection('Sub_Locations').doc(_this.state.sub_location_id).update(update_sub_location_data)
                    .then(function() {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 2, "Save Sub Location Success!");
                        window.setTimeout(function() { _this.props.history.push("/locations") }, 2000);
                    }).catch(function (error) {
                    _this.setState({loading: false});
                    _this.notifyMessage("tc", 3, "Network error!");
                });
            }
        }
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
    onChangePosition(e) {
        this.setState({position: { lat: e.latLng.lat(), lng: e.latLng.lng() }});
    }
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
                                    <CardTitle tag="h4">Sub Location Add</CardTitle>
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
                                                    Save
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
                                            <Col md="3">
                                                <Button
                                                    color="primary"
                                                    onClick={e => this.props.history.push("/sub_location/edit_upgrade_package/" + this.state.sub_location_id)}
                                                    block
                                                >
                                                    Upgrade
                                                </Button>
                                            </Col>
                                        </Row>
                                        <Row className="top-margin-10">
                                        </Row>
                                        <Row>
                                            <Col md="8">
                                                <Form className="form-horizontal">
                                                    <Row>
                                                        <Label md="4">Sub Location Key</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Input
                                                                    type="text"
                                                                    defaultValue={this.state.sub_location_id}
                                                                    disabled
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Sub Location Name</Label>
                                                        <Col md="8">
                                                            <FormGroup className={`has-label ${nameState}`}>
                                                                <Input
                                                                    placeholder="Enter Sub Location Name"
                                                                    type="text"
                                                                    defaultValue={this.state.name}
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
                                                    <Row className="top-margin-10"/>
                                                    <Row>
                                                        <Label md="4">Address</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Input
                                                                    type="text"
                                                                    defaultValue={this.state.address}
                                                                    onChange={e => {this.setState({address: e.target.value})}}
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
                                                        <Label md="4">Package</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Input
                                                                    defaultValue={this.state.package_name}
                                                                    type="text"
                                                                    disabled
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Time Zone</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Select
                                                                    className="react-select primary"
                                                                    classNamePrefix="react-select"
                                                                    name="timezoneSelect"
                                                                    value={this.state.time_zone}
                                                                    onChange={value =>
                                                                        this.setState({ time_zone: value })
                                                                    }
                                                                    options={this.state.time_zone_list}
                                                                    placeholder="Select time zone"
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Google Map</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <CustomMap
                                                                    ref="custom_map"
                                                                    api_key={info.google_map_api_key}
                                                                    center={this.state.position}
                                                                    zoom={this.state.map_zoom}
                                                                    onMarkerDragEnd={e => this.onChangePosition(e)}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row className="top-margin-10">
                                                        <Label md="4">Remarks</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Input
                                                                    value={this.state.remarks}
                                                                    type="textarea"
                                                                    onChange={e => {this.setState({remarks: e.target.value})}}
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
                                                                        <Label md="4">Pending Queue Count</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    defaultValue={this.state.pending_count}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Created Datetime</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={SubLocationEdit.getTimeString(this.state.created_date_time)}
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
                                                                                    value={SubLocationEdit.getTimeString(this.state.stop_date_time)}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Last Paid Date</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={SubLocationEdit.getTimeString(this.state.last_paid_date)}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Notification Date</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={SubLocationEdit.getTimeString(this.state.notification_date)}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Final Notification Date</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={SubLocationEdit.getTimeString(this.state.final_notification_date)}
                                                                                    type="text"
                                                                                    disabled
                                                                                />
                                                                            </FormGroup>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Label md="4">Next Payment Date</Label>
                                                                        <Col md="8">
                                                                            <FormGroup>
                                                                                <Input
                                                                                    value={SubLocationEdit.getTimeString(this.state.next_payment_date)}
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

export default SubLocationEdit;
