import React from "react";
import LoadingOverlay from "react-loading-overlay";
import Select from "react-select";
import CopyToClipboard from 'react-copy-to-clipboard';
import NotificationAlert from "react-notification-alert";
import Firebase from "firebase";
import config from "../../../config";
import IconUpload from "../../../components/CustomUpload/IconUpload";

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
    Label,
    Input,
    Table,
    UncontrolledTooltip
} from "reactstrap";

const uuidv1 = require('uuid/v1');
class ServiceAdd extends React.Component {
    constructor(props) {
        super(props);
        if (!Firebase.apps.length) {
            Firebase.initializeApp(config);
        }

        this.state = {
            loading: false,
            icon_max_limit: 0,
            main_location_list: [],
            sub_location_list: [],
            selected_main_location: null,
            selected_sub_location: null,

            service_key: '',
            name: '',
            service_details: '',
            start_number: 1,
            end_number: 999,
            priority: 1,
            time_reset: 0,
            is_reset: false,
            nameState: '',

            new_week_select: {value: '0', label: 'Sunday'},
            new_start_time: '',
            new_end_time: '',
            service_days: []
        };

        this.handleAdd = this.handleAdd.bind(this);
        this.handleAddDay = this.handleAddDay.bind(this);
    }
    componentWillMount() {
        let service_key = uuidv1();
        this.setState({service_key: service_key});
        this.loadMainLocations();
    }
    loadMainLocations() {
        let _this = this;
        _this.setState({loading: true});
        let main_locations = [];
        var customer_id = JSON.parse(localStorage.getItem('auth_info')).customer_id;
        _this.setState({customer_id: customer_id});
        // ---------- Load Icon Max Size ---------- //
        Firebase.firestore().collection('System_Config').doc('Upload_Limits').get().then(function (upload_limit_info) {
            if (upload_limit_info.exists) {
                _this.setState({icon_max_limit: upload_limit_info.data().Max_Icon_size_in_MB});
                // ---------- Load Location List ---------- //
                Firebase.firestore().collection('Main_Locations').where('Customer_ID', '==', customer_id).get().then(function (response) {
                    response.docs.forEach(function (doc) {
                        main_locations.push({label: doc.data().Name, value: doc.id});
                    });

                    _this.setState({main_location_list: main_locations});
                    if (main_locations.length > 0) {
                        _this.setState({selected_main_location: main_locations[0]});
                        _this.loadSubLocationByMain(main_locations[0].value);
                    } else {
                        _this.setState({loading: false});
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
    loadSubLocationByMain(main_id) {
        let _this = this;
        _this.setState({loading: true});
        let sub_locations = [];
        Firebase.firestore().collection('Sub_Locations').where('Main_Location_ID', '==', main_id).get().then(function (response) {
            response.docs.forEach(function (doc) {
                sub_locations.push({label: doc.data().Name, value: doc.id});
            });

            _this.setState({sub_location_list: sub_locations});
            if (sub_locations.length > 0)
                _this.setState({selected_sub_location: sub_locations[0]});

            _this.setState({loading: false});
        }).catch(function (err) {
            _this.setState({loading: false});
            _this.notifyMessage("tc", 3, "Network error!");
        });
    }
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
                    var image_name = "service_icon_" + this.state.service_key;
                    var mainLocationRef = storageRef.child(image_name);
                    mainLocationRef.put(file).then(function (snapshot) {
                        mainLocationRef.getDownloadURL().then(function (res) {
                            let new_service_data = {
                                Created_Date: now,
                                Icon: res,
                                Name: _this.state.name,
                                Details: _this.state.service_details,
                                Start_Number: _this.state.start_number,
                                End_Number: _this.state.end_number,
                                Priority: _this.state.priority,
                                Reset_Time: _this.state.time_reset,
                                Auto_Reset: _this.state.is_reset,
                                Service_Days: _this.state.service_days,
                                Updated_Date: now,
                                Last_Printed_Number: '',
                                Last_Printed_Date_Time: '',
                                Last_Called_Number : '',
                                Last_Called_Date_Time: '',
                                Last_Called_Counter: '',
                                Last_Called_User: '',
                                Current_Status: '',
                                Main_Location_ID: _this.state.selected_main_location.value,
                                Sub_Location_ID: _this.state.selected_sub_location.value
                            };

                            Firebase.firestore().collection('Services').doc(_this.state.service_key).set(new_service_data)
                                .then(function() {
                                    _this.setState({loading: false});
                                    _this.notifyMessage("tc", 2, "Add Service Success!");
                                    window.setTimeout(function() { _this.props.history.push("/services") }, 2000);
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
                let new_service_data = {
                    Created_Date: now,
                    Icon: "",
                    Name: _this.state.name,
                    Details: _this.state.service_details,
                    Start_Number: _this.state.start_number,
                    End_Number: _this.state.end_number,
                    Priority: _this.state.priority,
                    Reset_Time: _this.state.time_reset,
                    Auto_Reset: _this.state.is_reset,
                    Service_Days: _this.state.service_days,
                    Updated_Date: now,
                    Last_Printed_Number: '',
                    Last_Printed_Date_Time: '',
                    Last_Called_Number : '',
                    Last_Called_Date_Time: '',
                    Last_Called_Counter: '',
                    Last_Called_User: '',
                    Current_Status: '',
                    Main_Location_ID: _this.state.selected_main_location.value,
                    Sub_Location_ID: _this.state.selected_sub_location.value
                };

                Firebase.firestore().collection('Services').doc(_this.state.service_key).set(new_service_data)
                    .then(function() {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 2, "Add Service Success!");
                        window.setTimeout(function() { _this.props.history.push("/services") }, 2000);
                    }).catch(function (error) {
                        _this.setState({loading: false});
                        _this.notifyMessage("tc", 3, "Network error!");
                    });
            }
        }
    }
    handleAddDay() {
        if (this.state.new_start_time !== "" && this.state.new_end_time !== "") {
            var new_service_day = {
                week_day: this.state.new_week_select.label,
                start_time: this.state.new_start_time,
                end_time: this.state.new_end_time
            };
            var cur_service_days = this.state.service_days;
            cur_service_days.push(new_service_day);
            // ------------- Sort Date and Start Time ------------ //

            this.setState({service_days: cur_service_days});
            this.setState({new_week_select: {value: '0', label: 'Sunday'}});
            this.setState({new_start_time: ''});
            this.setState({new_end_time: ''});
        }
    }
    handleDeleteDay(index) {
        var cur_service_days = this.state.service_days;
        if (index !== -1) cur_service_days.splice(index, 1);
        this.setState({service_days: cur_service_days});
    }
    getServiceDays() {
        return this.state.service_days.map((prop, key) => {
            return (
              <tr key={key}>
                  <td>{prop.week_day}</td>
                  <td>{prop.start_time}</td>
                  <td>{prop.end_time}</td>
                  <td className="td-actions">
                      <Button
                          className="btn-neutral"
                          color="default"
                          data-placement="left"
                          id={"day" + key.toString()}
                          title=""
                          type="button"
                          onClick={e => {e.preventDefault(); this.handleDeleteDay(key);}}
                      >
                          <i className="nc-icon nc-simple-remove" />
                      </Button>
                      <UncontrolledTooltip
                          delay={0}
                          placement="left"
                          target={"day" + key.toString()}
                      >
                          Remove item
                      </UncontrolledTooltip>
                  </td>
              </tr>
            );
        });
    }
    onChangeMain(e) {
        this.setState({ selected_main_location : e });
        this.loadSubLocationByMain(e.value);
    }
    onChangeSub(e) {
        this.setState({ selected_sub_location : e });
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
                                    <CardTitle tag="h4">Service Add</CardTitle>
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
                                                    onClick={e => this.props.history.push("/services")}
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
                                                                    className="react-select info select-location"
                                                                    classNamePrefix="react-select"
                                                                    placeholder="Select Main Location"
                                                                    name="selectMainLocation"
                                                                    value={this.state.selected_main_location}
                                                                    onChange={e =>
                                                                        this.onChangeMain(e)
                                                                    }
                                                                    options={this.state.main_location_list}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Sub Location</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Select
                                                                    className="react-select info select-location"
                                                                    classNamePrefix="react-select"
                                                                    placeholder="Select Sub Location"
                                                                    name="selectSubLocation"
                                                                    value={this.state.selected_sub_location}
                                                                    onChange={e =>
                                                                        this.onChangeSub(e)
                                                                    }
                                                                    options={this.state.sub_location_list}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Service Key</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Row>
                                                                    <Col md="9">
                                                                        <Input
                                                                            value={this.state.service_key}
                                                                            disabled
                                                                        />
                                                                    </Col>
                                                                    <Col md="3">
                                                                        <CopyToClipboard
                                                                            text={this.state.service_key}
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
                                                        <Label md="4">Service Name</Label>
                                                        <Col md="8">
                                                            <FormGroup className={`has-label ${nameState}`}>
                                                                <Input
                                                                    placeholder="Service Name"
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
                                                        <Label md="4">Service Details</Label>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <Input
                                                                    defaultValue={this.state.service_details}
                                                                    type="textarea"
                                                                    onChange={e => {this.setState({service_details: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Start Number</Label>
                                                        <Col md="3">
                                                            <FormGroup>
                                                                <Input
                                                                    defaultValue={this.state.start_number}
                                                                    type="number"
                                                                    min={1}
                                                                    max={parseInt(this.state.end_number) - 1}
                                                                    onChange={e => {this.setState({start_number: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">End Number</Label>
                                                        <Col md="3">
                                                            <FormGroup>
                                                                <Input
                                                                    defaultValue={this.state.end_number}
                                                                    type="number"
                                                                    min={parseInt(this.state.start_number) + 1}
                                                                    onChange={e => {this.setState({end_number: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4">Priority</Label>
                                                        <Col md="3">
                                                            <FormGroup>
                                                                <Input
                                                                    defaultValue={this.state.priority}
                                                                    type="number"
                                                                    min={1}
                                                                    onChange={e => {this.setState({priority: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4"/>
                                                        <Col md="4">
                                                            <FormGroup>
                                                                <div className="form-check-radio">
                                                                    <Label check>
                                                                        <Input
                                                                            defaultChecked={!this.state.is_reset}
                                                                            defaultValue="option1"
                                                                            id="exampleRadios11"
                                                                            name="exampleRadioz"
                                                                            type="radio"
                                                                            onChange={e => {this.setState({is_reset: !this.state.is_reset})}}
                                                                        />
                                                                    Radio Daily at Reset time <span className="form-check-sign" />
                                                                    </Label>
                                                                </div>
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md="2">
                                                            <Input
                                                                disabled={this.state.is_reset}
                                                                defaultValue={this.state.time_reset}
                                                                type="number"
                                                                min={0}
                                                                max={23}
                                                                onChange={e => {this.setState({time_reset: e.target.value})}}
                                                            />
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Label md="4"/>
                                                        <Col md="8">
                                                            <FormGroup>
                                                                <div className="form-check-radio">
                                                                    <Label check>
                                                                        <Input
                                                                            defaultChecked={this.state.is_reset}
                                                                            defaultValue="option2"
                                                                            id="exampleRadios12"
                                                                            name="exampleRadioz"
                                                                            type="radio"
                                                                            onChange={e => {this.setState({is_reset: !this.state.is_reset})}}
                                                                        />
                                                                        Reset When Maximum number is reached <span className="form-check-sign" />
                                                                    </Label>
                                                                </div>
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md="4">
                                                            <FormGroup>
                                                                <Select
                                                                    className="react-select primary"
                                                                    classNamePrefix="react-select"
                                                                    name="weekSelect"
                                                                    value={this.state.new_week_select}
                                                                    onChange={value =>
                                                                        this.setState({ new_week_select: value })
                                                                    }
                                                                    options={[
                                                                        { value: "0", label: "Sunday" },
                                                                        { value: "1", label: "Monday" },
                                                                        { value: "2", label: "Tuesday" },
                                                                        { value: "3", label: "Wednesday" },
                                                                        { value: "4", label: "Thursday" },
                                                                        { value: "5", label: "Friday" },
                                                                        { value: "6", label: "Saturday" },
                                                                    ]}
                                                                    placeholder="Select day of the week"
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md="3">
                                                            <FormGroup>
                                                                <Input
                                                                    placeholder="Start Time"
                                                                    value={this.state.new_start_time}
                                                                    type="time"
                                                                    onChange={e => {this.setState({new_start_time: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md="3">
                                                            <FormGroup>
                                                                <Input
                                                                    placeholder="Start Time"
                                                                    value={this.state.new_end_time}
                                                                    type="time"
                                                                    onChange={e => {this.setState({new_end_time: e.target.value})}}
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md="2">
                                                            <Button
                                                                className="top-margin-2"
                                                                color="success"
                                                                onClick={e => this.handleAddDay()}
                                                                block
                                                            >
                                                                Add
                                                            </Button>
                                                        </Col>
                                                        <Col md="12">
                                                            <FormGroup>
                                                                <Table bordered>
                                                                    <thead className="text-center back">
                                                                    <tr>
                                                                        <th>Day</th>
                                                                        <th>Start Time</th>
                                                                        <th>End Time</th>
                                                                        <th/>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody className="text-center">
                                                                        {this.getServiceDays()}
                                                                    </tbody>
                                                                </Table>
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

export default ServiceAdd;
