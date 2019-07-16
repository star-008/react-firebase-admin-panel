import React from "react";
import LoadingOverlay from "react-loading-overlay";
import Select from "react-select";
import Switch from "react-bootstrap-switch";
import request from "request";
import Firebase from "firebase";
import NotificationAlert from "react-notification-alert";
import config from "../../../config";
import IconUpload from "../../../components/CustomUpload/IconUpload";
import CustomMap from "../../../components/CustomMap";
import info from '../../../info'

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

const uuidv1 = require('uuid/v1');
const publicIp = require('public-ip');
class SubLocationAdd extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            package_id: '',
            address_info: null,
            customer_id: '',
            icon_max_limit: 0,
            map_zoom: 5,

            sub_location_key: '',
            name: '',
            address: '',
            enable_mobile: false,
            active: false,
            package_name: '',
            time_zone: null,
            time_zone_list: [],
            position: null,
            remarks: '',
            nameState: '',
            selected_main_location: null,
            main_location_list: [],

            openedCollapses: [],
        };
    }
    componentWillMount() {
        let id = this.props.match.params.package_id;
        if (id !== "" && id !== null && id !== undefined) {
            this.setState({package_id: id});
            let sub_location_key = uuidv1();
            this.setState({sub_location_key: sub_location_key});
            this.loadAddressInfo();
        }
    }
    loadAddressInfo() {
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
        _this.setState({time_zone: sortTimezones[0]});
        // ---------- End Load TimeZone List ---------- //
        // ---------- Load Icon Max Size ---------- //
        Firebase.firestore().collection('System_Config').doc('Upload_Limits').get().then(function (upload_limit_info) {
            if (upload_limit_info.exists) {
                _this.setState({icon_max_limit: upload_limit_info.data().Max_Icon_size_in_MB});
                // ---------- Load Address Info ---------- //
                let customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;
                _this.setState({customer_id: customer_id});
                var main_location_list = [];
                publicIp.v4().then(ip => {
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
                        _this.setState({position: { lat: parseFloat(result.latitude), lng: parseFloat(result.longitude) }});
                        Firebase.firestore().collection('Packages').doc(_this.state.package_id).get().then(function (package_info) {
                            if (package_info.exists) {
                                _this.setState({package_name: package_info.data().Name});
                                // -------- Load Main Location List --------- //
                                Firebase.firestore().collection('Main_Locations').where('Customer_ID', '==', customer_id).get().then(function (locations) {
                                    locations.docs.forEach(function (location) {
                                        let one = {
                                            label: location.data().Name,
                                            value: location.id
                                        };
                                        main_location_list.push(one);
                                    });

                                    _this.setState({main_location_list: main_location_list});
                                    _this.setState({selected_main_location: main_location_list[0]});
                                    _this.setState({loading: false});
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
                    });
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
    handleAdd() {
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
                    var image_name = "sub_location_icon_" + this.state.sub_location_key;
                    var subLocationRef = storageRef.child(image_name);
                    subLocationRef.put(file).then(function (snapshot) {
                        subLocationRef.getDownloadURL().then(function (res) {
                            // --------- Check Max Sub Location Limit --------- //
                            Firebase.firestore().collection('Main_Locations').doc(_this.state.selected_main_location.value).get().then(function (main_location) {
                                if (main_location.exists) {
                                    let sub_location_count = main_location.data().Sub_Locations_Count;
                                    Firebase.firestore().collection('Customers').doc(_this.state.customer_id).get().then(function (own_customer_info) {
                                        if (own_customer_info.exists) {
                                            let customer_category = own_customer_info.data().Customer_Category;
                                            Firebase.firestore().collection('System_Config').doc('Customer_Cat_Settings').collection(customer_category).get().then(function (response) {
                                                if (response.docs.length === 1) {
                                                    let customer_category_data = response.docs[0].data();
                                                    let max_sub_limit = customer_category_data.Sub_Location_Per_Main_Location_Max_Limit;
                                                    if (sub_location_count < max_sub_limit) {
                                                        Firebase.firestore().collection('Main_Locations').doc(_this.state.selected_main_location.value).update({Sub_Locations_Count: sub_location_count+1}).then(function (response) {
                                                            let new_sub_location_data = {
                                                                Address: _this.state.address,
                                                                Created_Date: now,
                                                                Customer_ID: _this.state.customer_id,
                                                                Geolocation: _this.state.position,
                                                                Icon: res,
                                                                Last_Paid_Date: '',
                                                                Main_Location_ID: _this.state.selected_main_location.value,
                                                                Name: _this.state.name,
                                                                Next_Payment_Date: '',
                                                                Package_ID: _this.state.package_id,
                                                                Payment_Due_Date: '',
                                                                Pending_Queue_Count: '',
                                                                Remarks: _this.state.remarks,
                                                                Show_On_Mobile_App: _this.state.enable_mobile,
                                                                Status: _this.state.active,
                                                                Stop_Date: '',
                                                                TimeZone: _this.state.time_zone.value,
                                                                Notification_Date: '',
                                                                Final_Notification_Date: ''
                                                            };

                                                            Firebase.firestore().collection('Sub_Locations').doc(_this.state.sub_location_key).set(new_sub_location_data)
                                                                .then(function() {
                                                                    _this.setState({loading: false});
                                                                    _this.notifyMessage("tc", 2, "Add Sub Location Success!");
                                                                    window.setTimeout(function() { _this.props.history.push("/locations") }, 2000);
                                                                }).catch(function (error) {
                                                                _this.setState({loading: false});
                                                                _this.notifyMessage("tc", 3, "Network error!");
                                                            });
                                                        }).catch(function (err) {
                                                            _this.setState({loading: false});
                                                            _this.notifyMessage("tc", 3, "Network error!");
                                                        });
                                                    } else {
                                                        _this.setState({loading: false});
                                                        _this.notifyMessage("tc", 3, "You have reached the sub location max limit.");
                                                    }
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
                // --------- Check Max Sub Location Limit --------- //
                Firebase.firestore().collection('Main_Locations').doc(_this.state.selected_main_location.value).get().then(function (main_location) {
                    if (main_location.exists) {
                        let sub_location_count = main_location.data().Sub_Locations_Count;
                        Firebase.firestore().collection('Customers').doc(_this.state.customer_id).get().then(function (own_customer_info) {
                            if (own_customer_info.exists) {
                                let customer_category = own_customer_info.data().Customer_Category;
                                Firebase.firestore().collection('System_Config').doc('Customer_Cat_Settings').collection(customer_category).get().then(function (response) {
                                    if (response.docs.length === 1) {
                                        let customer_category_data = response.docs[0].data();
                                        let max_sub_limit = customer_category_data.Sub_Location_Per_Main_Location_Max_Limit;
                                        if (sub_location_count < max_sub_limit) {
                                            Firebase.firestore().collection('Main_Locations').doc(_this.state.selected_main_location.value).update({Sub_Locations_Count: sub_location_count+1}).then(function (response) {
                                                let new_sub_location_data = {
                                                    Address: _this.state.address,
                                                    Created_Date: now,
                                                    Customer_ID: _this.state.customer_id,
                                                    Geolocation: _this.state.position,
                                                    Icon: '',
                                                    Last_Paid_Date: '',
                                                    Main_Location_ID: _this.state.selected_main_location.value,
                                                    Name: _this.state.name,
                                                    Next_Payment_Date: '',
                                                    Package_ID: _this.state.package_id,
                                                    Payment_Due_Date: '',
                                                    Pending_Queue_Count: '',
                                                    Remarks: _this.state.remarks,
                                                    Show_On_Mobile_App: _this.state.enable_mobile,
                                                    Status: _this.state.active,
                                                    Stop_Date: '',
                                                    TimeZone: _this.state.time_zone.value,
                                                    Notification_Date: '',
                                                    Final_Notification_Date: ''
                                                };

                                                Firebase.firestore().collection('Sub_Locations').doc(_this.state.sub_location_key).set(new_sub_location_data)
                                                    .then(function() {
                                                        _this.setState({loading: false});
                                                        _this.notifyMessage("tc", 2, "Add Sub Location Success!");
                                                        window.setTimeout(function() { _this.props.history.push("/locations") }, 2000);
                                                    }).catch(function (error) {
                                                        _this.setState({loading: false});
                                                        _this.notifyMessage("tc", 3, "Network error!");
                                                    });
                                            }).catch(function (err) {
                                                _this.setState({loading: false});
                                                _this.notifyMessage("tc", 3, "Network error!");
                                            });
                                        } else {
                                            _this.setState({loading: false});
                                            _this.notifyMessage("tc", 3, "You have reached the sub location max limit.");
                                        }
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
                                                    onClick={e => this.handleAdd()}
                                                    block
                                                >
                                                    Add
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
                                                        <Label md="4">Main Location</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Select
                                                                    className="react-select primary"
                                                                    classNamePrefix="react-select"
                                                                    name="mainLocationSelect"
                                                                    value={this.state.selected_main_location}
                                                                    onChange={value =>
                                                                        this.setState({ selected_main_location: value })
                                                                    }
                                                                    options={this.state.main_location_list}
                                                                    placeholder="Select Main Location"
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Sub Location Key</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Input
                                                                    type="text"
                                                                    defaultValue={this.state.sub_location_key}
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
                                                                    placeholder="New Sub Location"
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
                                                    <Row className="top-margin-10"/>
                                                    <Row>
                                                        <Label md="4">Address</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Input
                                                                    placeholder=""
                                                                    type="text"
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
                                                                    defaultValue={this.state.remarks}
                                                                    type="textarea"
                                                                    onChange={e => {this.setState({remarks: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
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

export default SubLocationAdd;
